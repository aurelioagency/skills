"""Persistent, AI-free Windows inbox. Python stdlib; Claude runs only for queued jobs."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import uuid
from contextlib import contextmanager


def videos_folder():
    if os.name != 'nt':
        raise RuntimeError('Automatic Videos discovery requires Windows; pass --root elsewhere.')
    import winreg
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                       r'Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders') as key:
        return Path(os.path.expandvars(winreg.QueryValueEx(key, 'My Video')[0]))


def save(path, value):
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def layout(root):
    for name in ('Crudos', 'En proceso', 'Archivados', 'Entregas', '.control/jobs', '.control/logs'):
        (root / name).mkdir(parents=True, exist_ok=True)


@contextmanager
def lock(root):
    """OS releases the lock on crash; never steal a live worker's lock."""
    f = (root / '.control/lock').open('a+b')
    f.seek(0)
    f.write(b'0')
    f.flush()
    f.seek(0)
    try:
        if os.name == 'nt':
            import msvcrt
            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        f.close()


def job_path(root, job_id):
    return root / '.control/jobs' / (str(uuid.UUID(job_id)) + '.json')


def jobs(root):
    return [(p, read(p)) for p in sorted((root / '.control/jobs').glob('*.json'))]


def snapshot(folder):
    files = list(folder.rglob('*'))
    if folder.is_symlink() or any(p.is_symlink() or (hasattr(p, 'is_junction') and p.is_junction()) for p in [folder] + files):
        raise ValueError('Linked folders/files are not accepted in an inbox batch.')
    return sorted((str(p.relative_to(folder)), p.stat().st_size, p.stat().st_mtime_ns)
                  for p in files if p.is_file())


def discover(root, observed, settle):
    unresolved = {j['source'] for _, j in jobs(root)
                  if j['status'] in ('claiming', 'failed') and not Path(j['folder']).exists()}
    for folder in sorted((root / 'Crudos').iterdir()):
        if str(folder) in unresolved or not folder.is_dir() or not (folder / 'LISTO').is_file():
            continue
        try:
            snap = snapshot(folder)
            if not any(Path(n).suffix.lower() in {'.mov', '.mp4', '.m4v'} for n, _, _ in snap):
                continue
            previous, since = observed.get(str(folder), (None, time.monotonic()))
            if previous != snap:
                observed[str(folder)] = (snap, time.monotonic())
                continue
            if time.monotonic() - since < settle:
                continue
            jid = str(uuid.uuid4())
            dest = root / 'En proceso' / jid
            job = dict(id=jid, name=folder.name, source=str(folder), folder=str(dest),
                       status='claiming', session=None, attempt=0)
            path = job_path(root, jid)
            save(path, job)  # journal BEFORE the atomic same-volume move
            folder.rename(dest)
            job['status'] = 'queued'
            save(path, job)
            observed.pop(str(folder), None)
        except (OSError, ValueError) as exc:
            print(f'Inbox {folder.name}: {exc}', flush=True)


def recover(root):
    for path, job in jobs(root):
        if job['status'] == 'claiming':
            if Path(job['folder']).exists():
                job['status'] = 'queued'
            else:
                job['status'] = 'failed'
                job['error'] = 'Move incomplete; inspect source before retrying.'
            save(path, job)
        elif job['status'] == 'running':
            # The previous agent may still be alive. Never automatically duplicate it.
            job['status'] = 'interrupted'
            job['error'] = 'Watcher restarted; check the previous Claude process before resuming.'
            save(path, job)
        elif job['status'] == 'archiving':
            dest = root / 'Archivados' / job['id']
            if dest.exists() and not Path(job['folder']).exists():
                job.update(status='archived', folder=str(dest))
                save(path, job)


def start(root, config, path, job):
    exe = config.get('claude') or shutil.which('claude')
    if not exe or not Path(exe).is_file():
        raise RuntimeError('Claude Code executable missing. Configure its absolute path with init --claude.')
    job['attempt'] += 1
    logfile = root / '.control/logs' / f"{job['id']}-{job['attempt']}.json"
    errfile = logfile.with_suffix('.stderr.txt')
    prompt = (
        'Use motion-reel-pipeline, beginning with motion-reel-ingest for this batch. '
        f'Batch folder: {job["folder"]}. Batch name: {job["name"]}. '
        f'Create production projects under {root / "Entregas/.work"}; deliveries resolve to Entregas/<slug>. '
        'Read the installed skills. Preserve original media. Respect actual approval gates. '
        'When human input is required, save a clear REVIEW.md inside the batch with absolute '
        'artifact paths and the exact question; return control. Do not invent approval. '
        'Do not archive or move the batch yourself. '
    )
    if job.get('reply'):
        prompt += '\nUser reply for this continuation:\n' + job.pop('reply')
    args = [exe, '-p', prompt, '--output-format', 'json']
    if job.get('session'):
        args += ['--resume', job['session']]
    else:
        job['session'] = str(uuid.uuid4())
        args += ['--session-id', job['session']]
    # Explicit installation-time tool configuration; no permission bypass.
    if config.get('allowed_tools'):
        args += ['--allowedTools', ','.join(config['allowed_tools'])]
    job.update(status='running', log=str(logfile), error_log=str(errfile))
    save(path, job)
    with logfile.open('w', encoding='utf-8') as out, errfile.open('w', encoding='utf-8') as err:
        proc = subprocess.Popen(args, cwd=config['workspace'], stdin=subprocess.DEVNULL,
                                stdout=out, stderr=err, creationflags=0x08000000 if os.name == 'nt' else 0)
    return proc, path, job


def finish(active):
    proc, path, job = active
    try:
        result = read(Path(job['log']))
        if proc.returncode != 0 or result.get('is_error'):
            raise ValueError(str(result.get('result', 'Claude failed')))
        job['session'] = result.get('session_id', job['session'])
        job['status'] = 'waiting_review'
        Path(job['folder'], 'CLAUDE-RESULT.txt').write_text(str(result.get('result', '')), encoding='utf-8')
    except (OSError, ValueError) as exc:
        job.update(status='failed', error=str(exc))
    save(path, job)


def run(root, config, once=False):
    observed, active = {}, None
    # Separate lifetime lock prevents two watchers, while state lock permits CLI replies.
    guard = root / '.control/daemon'
    guard.mkdir(exist_ok=True)
    (guard / '.control').mkdir(exist_ok=True)
    with lock(guard):
        with lock(root):
            recover(root)
        try:
            while True:
                with lock(root):
                    discover(root, observed, config['settle_seconds'])
                    if active and active[0].poll() is not None:
                        finish(active)
                        active = None
                    if active is None and not any(j['status'] == 'interrupted' for _, j in jobs(root)):
                        for path, job in jobs(root):
                            if job['status'] == 'queued':
                                try:
                                    active = start(root, config, path, job)
                                except (OSError, RuntimeError) as exc:
                                    job.update(status='failed', error=str(exc))
                                    save(path, job)
                                break
                if once:
                    if active:
                        active[0].wait()
                        with lock(root):
                            finish(active)
                    return
                time.sleep(config['poll_seconds'])
        finally:
            if active and active[0].poll() is None:
                # Keep state as running; recovery will require an explicit check.
                print('Claude may still be running; inspect before resume.', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path)
    sub = ap.add_subparsers(dest='cmd', required=True)
    init = sub.add_parser('init')
    init.add_argument('--claude')
    init.add_argument('--allow-tool', action='append', default=[])
    watch = sub.add_parser('run')
    watch.add_argument('--once', action='store_true')
    sub.add_parser('status')
    resume = sub.add_parser('resume')
    resume.add_argument('id')
    resume.add_argument('--reply-file', type=Path, required=True)
    archive = sub.add_parser('archive')
    archive.add_argument('id')
    archive.add_argument('--confirm-complete', action='store_true', required=True)
    args = ap.parse_args()
    root = (args.root or videos_folder() / 'Motion Reel').resolve()
    layout(root)
    cp = root / '.control/config.json'
    if args.cmd == 'init':
        with lock(root):
            config = read(cp) if cp.exists() else dict(poll_seconds=10, settle_seconds=60,
                workspace=str(root / '.control/workspace'), allowed_tools=[])
            if args.claude:
                config['claude'] = str(Path(args.claude).resolve())
            if args.allow_tool:
                config['allowed_tools'] = args.allow_tool
            Path(config['workspace']).mkdir(parents=True, exist_ok=True)
            save(cp, config)
        print(root)
    elif args.cmd == 'run':
        run(root, read(cp), args.once)
    elif args.cmd == 'status':
        print(json.dumps([j for _, j in jobs(root)], ensure_ascii=False, indent=2))
    else:
        with lock(root):
            p = job_path(root, args.id)
            job = read(p)
            if job['status'] not in ('waiting_review', 'failed', 'interrupted'):
                raise ValueError('Job must be stopped before resume/archive.')
            if args.cmd == 'resume':
                if not Path(job['folder']).is_dir():
                    raise ValueError('Batch folder missing; repair incomplete move first.')
                job.update(status='queued', reply=args.reply_file.read_text(encoding='utf-8'))
                save(p, job)
            else:
                dest = root / 'Archivados' / job['id']
                if dest.exists():
                    raise ValueError('Archive destination already exists.')
                job['status'] = 'archiving'
                save(p, job)
                Path(job['folder']).rename(dest)
                job.update(status='archived', folder=str(dest))
                save(p, job)


if __name__ == '__main__':
    main()
