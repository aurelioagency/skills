#!/usr/bin/env node
// Gathers the finished deliverables into one clean <project>/entrega folder, so the user
// gets the three things they actually consume without hunting through renders/, manifests/
// and assets/.
//
// It stays INSIDE the project tree on purpose: this harness only makes a path clickable
// when it lives under the working directory, so a delivery folder written to Downloads can
// be described but never opened with a click. Large files are hardlinked, not copied, so
// the tidy folder costs no extra disk.
//
// A deliverable the user cannot find is not delivered. This is the last step of every branch.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error(`Usage:
  node deliver-package.mjs --project <project-root> [--slug <slug>]
      [--video <path>]...        final MP4s; defaults to everything in renders/final
      [--caption <path>]         post description txt; auto-detected as *-caption.txt
      [--transcript <path>]      word-level JSON; auto-detected (.approved.json wins)
      [--extra <path>]...        anything else worth handing over
      [--dest <dir>]             defaults to <project>/entrega
      [--overwrite]              replace an existing destination folder
      [--no-open]                do not open the folder in the file manager

The transcript ships as readable plain text (<slug>-transcript.txt) only. The word-level
JSON stays in the project; it is a build input, not a deliverable.`);
}

function parseArgs(argv) {
  const args = { video: [], extra: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--slug') args.slug = argv[++i];
    else if (item === '--video') args.video.push(argv[++i]);
    else if (item === '--caption') args.caption = argv[++i];
    else if (item === '--transcript') args.transcript = argv[++i];
    else if (item === '--extra') args.extra.push(argv[++i]);
    else if (item === '--dest') args.dest = argv[++i];
    else if (item === '--overwrite') args.overwrite = true;
    else if (item === '--no-open') args.noOpen = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}


function listFinalVideos(projectDir) {
  const dir = path.join(projectDir, 'renders', 'final');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => /\.(mp4|mov|webm)$/i.test(name))
    .map((name) => path.join(dir, name));
}

function findCaption(projectDir) {
  const dir = path.join(projectDir, 'renders', 'final');
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((name) => /-caption\.txt$/i.test(name));
  return hit ? path.join(dir, hit) : null;
}

// A corrected transcript is the one the captions were built from, so it is the one the
// user should receive. Fall back to the raw ASR output only when no approved copy exists.
function findTranscript(projectDir) {
  const dir = path.join(projectDir, 'assets', 'voice');
  if (!fs.existsSync(dir)) return null;
  const names = fs.readdirSync(dir);
  const approved = names.find((name) => /\.approved\.json$/i.test(name));
  if (approved) return path.join(dir, approved);
  const raw = names.find((name) => /\.transcript\.json$/i.test(name));
  return raw ? path.join(dir, raw) : null;
}

function readWords(transcriptPath) {
  const data = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  return data.segments ? data.segments.flatMap((segment) => segment.words || []) : (data.words || []);
}

// Plain readable prose, wrapped, so the user can read or repurpose the script without
// opening a JSON file.
function transcriptToText(words, width = 90) {
  const lines = [];
  let line = '';
  for (const word of words) {
    const token = String(word.word ?? '').trim();
    if (!token) continue;
    if (line && line.length + 1 + token.length > width) {
      lines.push(line);
      line = '';
    }
    line = line ? `${line} ${token}` : token;
  }
  if (line) lines.push(line);
  return `${lines.join('\n')}\n`;
}

// A hardlink is the same bytes under a second name, so a 165 MB deliverable appears in the
// delivery folder without a second 165 MB on disk. It only works within one volume; fall
// back to a real copy when it does not (different drive, filesystem without hardlinks).
function placeInto(source, destDir) {
  const target = path.join(destDir, path.basename(source));
  try {
    fs.linkSync(source, target);
  } catch {
    fs.copyFileSync(source, target);
  }
  return target;
}

// A file:// URL is not reliably clickable from a terminal, so opening the folder is the
// only thing that actually puts the deliverables in front of the user.
function openFolder(target) {
  const command = process.platform === 'win32' ? 'explorer.exe'
    : process.platform === 'darwin' ? 'open'
    : 'xdg-open';
  // explorer.exe returns a non-zero exit code even when it succeeds; only a spawn
  // failure means the folder did not open.
  const proc = spawnSync(command, [path.resolve(target)], { windowsHide: true, stdio: 'ignore' });
  return !proc.error;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  if (!fs.existsSync(projectDir)) throw new Error(`Missing project: ${projectDir}`);

  let slug = args.slug;
  if (!slug) {
    const manifest = path.join(projectDir, 'manifests', 'project.json');
    if (fs.existsSync(manifest)) slug = JSON.parse(fs.readFileSync(manifest, 'utf8')).slug;
  }
  slug = slug || path.basename(projectDir);
  // A placeholder slug is the failure this whole step exists to prevent: the user opens the
  // skill's folder and cannot tell which video is which.
  if (/^(tmp|temp|placeholder|untitled|video|final|clip)[-_]?\d*$/i.test(slug) || /^\d{3,}$/.test(slug)) {
    throw new Error(`Refusing to deliver under a non-descriptive slug: "${slug}". Rename the project to its actual topic first.`);
  }

  // The user sees one folder per video, named after the video, holding only what they
  // consume. The working tree lives out of sight in the sibling `.work` folder, so the
  // delivery folder is <root>/<slug> and the project is <root>/.work/<slug>.
  const isWorkTree = path.basename(path.dirname(projectDir)) === '.work';
  const defaultDest = isWorkTree
    ? path.join(path.dirname(path.dirname(projectDir)), slug)
    : path.join(projectDir, 'entrega');
  const dest = path.resolve(args.dest || defaultDest);
  if (fs.existsSync(dest)) {
    if (!args.overwrite) throw new Error(`Destination already exists: ${dest} (pass --overwrite to replace)`);
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });

  const videos = (args.video.length ? args.video : listFinalVideos(projectDir)).map((p) => path.resolve(projectDir, p));
  if (!videos.length) throw new Error(`No final video found under ${path.join(projectDir, 'renders', 'final')}`);
  for (const video of videos) if (!fs.existsSync(video)) throw new Error(`Missing video: ${video}`);

  const captionPath = args.caption ? path.resolve(projectDir, args.caption) : findCaption(projectDir);
  if (!captionPath) throw new Error('No post description found. Write renders/final/<slug>-caption.txt before delivering.');

  const transcriptPath = args.transcript ? path.resolve(projectDir, args.transcript) : findTranscript(projectDir);
  if (!transcriptPath) throw new Error('No transcript found under assets/voice/.');

  const delivered = [];
  for (const video of videos) delivered.push(placeInto(video, dest));
  delivered.push(placeInto(captionPath, dest));

  // The word-level JSON is a build input for the caption pipeline, not something the
  // user asked to receive. It stays in the project; only readable text ships.
  const textPath = path.join(dest, `${slug}-transcript.txt`);
  fs.writeFileSync(textPath, transcriptToText(readWords(transcriptPath)), 'utf8');
  delivered.push(textPath);

  for (const extra of args.extra) {
    const resolved = path.resolve(projectDir, extra);
    if (!fs.existsSync(resolved)) throw new Error(`Missing extra file: ${resolved}`);
    delivered.push(placeInto(resolved, dest));
  }

  const opened = args.noOpen ? false : openFolder(dest);

  console.log(JSON.stringify({
    ok: true,
    slug,
    folder: dest,
    opened,
    files: delivered.map((file) => ({
      name: path.basename(file),
      sizeBytes: fs.statSync(file).size,
    })),
    reportToUser: opened
      ? 'The folder was opened in the file manager. Say so, and give the plain path, then the file list.'
      : 'Could not open the folder. Give the plain path first, then the file list.',
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
