import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, Mock


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parents[1] / 'scripts' / file)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


w = module('watch', 'watch.py')
b = module('batch', 'batch-takes.py')


class IntakeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        w.layout(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def batch(self, ready=True):
        folder = self.root / 'Crudos/tanda'
        folder.mkdir()
        (folder / 'IMG_001.MOV').write_bytes(b'raw')
        (folder / 'guion.txt').write_text('script')
        if ready:
            (folder / 'LISTO').touch()
        return folder

    def claim(self):
        folder = self.batch()
        observed = {}
        w.discover(self.root, observed, 0)
        self.assertTrue(folder.exists())
        w.discover(self.root, observed, 0)
        return w.jobs(self.root)[0]

    def test_claim_moves_whole_batch_exactly_once(self):
        _, job = self.claim()
        self.assertEqual(job['status'], 'queued')
        self.assertEqual(list((self.root / 'Crudos').iterdir()), [])
        self.assertEqual(Path(job['folder'], 'IMG_001.MOV').read_bytes(), b'raw')
        w.discover(self.root, {}, 0)
        self.assertEqual(len(w.jobs(self.root)), 1)

    def test_requires_ready_and_stable(self):
        folder = self.batch(False)
        observed = {}
        w.discover(self.root, observed, 0)
        self.assertFalse(w.jobs(self.root))
        (folder / 'LISTO').touch()
        w.discover(self.root, observed, 100)
        (folder / 'IMG_001.MOV').write_bytes(b'changed')
        w.discover(self.root, observed, 0)
        self.assertFalse(w.jobs(self.root))
        w.discover(self.root, observed, 0)
        self.assertEqual(len(w.jobs(self.root)), 1)

    def test_recovery_does_not_duplicate_running_agent(self):
        path, job = self.claim()
        job['status'] = 'running'
        w.save(path, job)
        w.recover(self.root)
        self.assertEqual(w.read(path)['status'], 'interrupted')

    def test_crash_after_move_recovers(self):
        path, job = self.claim()
        job['status'] = 'claiming'
        w.save(path, job)
        w.recover(self.root)
        self.assertEqual(w.read(path)['status'], 'queued')

    def test_success_waits_for_review_never_archives(self):
        path, job = self.claim()
        log = self.root / 'result.json'
        w.save(log, {'result': 'Approve map', 'session_id': 'saved-session'})
        job['log'] = str(log)
        w.finish((Mock(returncode=0), path, job))
        self.assertEqual(w.read(path)['status'], 'waiting_review')
        self.assertTrue(Path(job['folder'], 'CLAUDE-RESULT.txt').exists())

    def test_error_even_with_zero_exit_is_failed(self):
        path, job = self.claim()
        log = self.root / 'result.json'
        w.save(log, {'result': 'auth required', 'is_error': True})
        job['log'] = str(log)
        w.finish((Mock(returncode=0), path, job))
        self.assertEqual(w.read(path)['status'], 'failed')

    def test_launch_preserves_session_and_has_no_shell(self):
        path, job = self.claim()
        exe = self.root / 'fake.exe'
        exe.touch()
        cfg = {'claude': str(exe), 'workspace': str(self.root)}
        with patch.object(w.subprocess, 'Popen') as popen:
            w.start(self.root, cfg, path, job)
            self.assertIn('--session-id', popen.call_args.args[0])
            self.assertNotIn('shell', popen.call_args.kwargs)
            job['reply'] = 'Actual user approval'
            w.start(self.root, cfg, path, job)
            self.assertIn('--resume', popen.call_args.args[0])
            self.assertIn('Actual user approval', popen.call_args.args[0][2])

    def test_rename_dry_run_then_undo_preserves_bytes(self):
        folder = self.batch()
        mapping = self.root / 'map.json'
        w.save(mapping, [{'file': 'IMG_001.MOV', 'topic': 'demo', 'part': 'hook-1'}])
        args = Mock(folder=str(folder), map=str(mapping), dry_run=True)
        with patch.object(b, 'documents', return_value=self.root):
            b.rename(args)
            self.assertTrue((folder / 'IMG_001.MOV').exists())
            self.assertFalse((folder / '.ingest/topics.json').exists())
            args.dry_run = False
            b.rename(args)
            self.assertEqual((folder / 'demo_hook-1_IMG_001.MOV').read_bytes(), b'raw')
            b.rename(args)  # retry after rename must be idempotent
            b.undo(args)
            self.assertEqual((folder / 'IMG_001.MOV').read_bytes(), b'raw')


if __name__ == '__main__':
    unittest.main()
