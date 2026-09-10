#!/usr/bin/env node
// Publishes an APPROVED delivery folder to the Aurelio "Reels" shared drive.
//
// Run this only after the user has approved the video, cover and caption. It mirrors the
// exact source/output split that deliver-package.mjs produced into a folder named ONLY
// after the descriptive slug:
//
//   <Reels>/<slug>/source/   the media the skill produced
//   <Reels>/<slug>/output/   <slug>-caption.txt (the editor adds the finished cut here later)
//
// A separate publishing skill renames <slug>/ to the dated <YYYY-MM-DD>_<slug>_post/ form
// when the content actually goes out on social. This skill does NOT add the date or _post.
//
// The shared drive is mounted locally by Google Drive for desktop, so "upload" is a plain
// folder copy — Drive syncs it. On Windows that mount is:
//   G:\Unidades compartidas\Aurelio\Reels
// Override with --reels for another machine or another target folder.
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error(`Usage:
  node publish-to-drive.mjs --project <project-root> [options]
  node publish-to-drive.mjs --delivery <slug-folder> --slug <slug> [options]

      --reels <dir>    Reels folder to publish into
                       (default on Windows: "G:\\Unidades compartidas\\Aurelio\\Reels")
      --slug <slug>    override the slug (default: from manifests/project.json or folder name)
      --delivery <dir> the <slug>/ folder deliver-package.mjs wrote; inferred from --project
      --overwrite      replace the dated post folder if it already exists
      --dry-run        print what would be copied, copy nothing

Only run after the user approves the delivery. source/ and output/ are copied verbatim.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--delivery') args.delivery = argv[++i];
    else if (item === '--slug') args.slug = argv[++i];
    else if (item === '--reels') args.reels = argv[++i];
    else if (item === '--overwrite') args.overwrite = true;
    else if (item === '--dry-run') args.dryRun = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function copyTree(srcDir, destDir, out) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyTree(from, to, out);
    else {
      fs.copyFileSync(from, to);
      out.push({ name: path.relative(out.root, to).split(path.sep).join('/'), sizeBytes: fs.statSync(to).size });
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.project && !args.delivery)) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  let slug = args.slug;
  let delivery = args.delivery ? path.resolve(args.delivery) : null;

  if (args.project) {
    const projectDir = path.resolve(args.project);
    if (!fs.existsSync(projectDir)) throw new Error(`Missing project: ${projectDir}`);
    if (!slug) {
      const manifest = path.join(projectDir, 'manifests', 'project.json');
      if (fs.existsSync(manifest)) slug = JSON.parse(fs.readFileSync(manifest, 'utf8')).slug;
    }
    slug = slug || path.basename(projectDir);
    if (!delivery) {
      const isWorkTree = path.basename(path.dirname(projectDir)) === '.work';
      delivery = isWorkTree
        ? path.join(path.dirname(path.dirname(projectDir)), slug)
        : path.join(projectDir, 'entrega');
    }
  }
  slug = slug || path.basename(delivery);

  if (/^(tmp|temp|placeholder|untitled|video|final|clip)[-_]?\d*$/i.test(slug) || /^\d{3,}$/.test(slug)) {
    throw new Error(`Refusing to publish under a non-descriptive slug: "${slug}".`);
  }
  if (!fs.existsSync(delivery)) throw new Error(`Missing delivery folder: ${delivery}`);
  const srcSub = path.join(delivery, 'source');
  const outSub = path.join(delivery, 'output');
  if (!fs.existsSync(srcSub) || !fs.existsSync(outSub)) {
    throw new Error(`Delivery folder is not in source/ + output/ shape: ${delivery}. Re-run deliver-package.mjs.`);
  }

  const reels = path.resolve(
    args.reels
      || (process.platform === 'win32'
        ? 'G:\\Unidades compartidas\\Aurelio\\Reels'
        : (() => { throw new Error('Pass --reels: no default Reels path outside Windows.'); })()),
  );
  if (!fs.existsSync(reels)) {
    throw new Error(`Reels folder not found: ${reels}. Is Google Drive for desktop running / mounted?`);
  }

  // Named after the descriptive slug ONLY. A separate publishing skill renames this to the
  // dated <YYYY-MM-DD>_<slug>_post form when the content is actually posted to social.
  const postFolder = path.join(reels, slug);

  const exists = fs.existsSync(postFolder);
  if (exists && !args.overwrite && !args.dryRun) {
    throw new Error(`Post folder already exists: ${postFolder} (pass --overwrite)`);
  }

  const files = [];
  files.root = postFolder;
  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true, dryRun: true, postFolder, exists,
      note: exists && !args.overwrite ? 'exists; a real run would need --overwrite' : undefined,
      wouldCopy: ['source/', 'output/'],
    }, null, 2));
    return;
  }
  if (exists) fs.rmSync(postFolder, { recursive: true, force: true });
  copyTree(srcSub, path.join(postFolder, 'source'), files);
  copyTree(outSub, path.join(postFolder, 'output'), files);

  console.log(JSON.stringify({
    ok: true,
    slug,
    postFolder,
    files: files.map(({ name, sizeBytes }) => ({ name, sizeBytes })),
    note: 'Copied to the local Google Drive mount. Drive for desktop syncs it to the shared drive; large videos may take a few minutes to finish uploading.',
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
