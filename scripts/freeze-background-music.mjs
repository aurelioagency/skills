#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

function usage() {
  console.error(`Usage:
  node freeze-background-music.mjs --project <project-root> --source <mp3-url-or-file> --output assets/music/lofi.mp3 --source-url <track-page-url> --title <title> --artist <artist> --license "Pixabay Content License" [--attribution <text>] [--speed 1.07] [--volume-db -24]

Downloads or copies a license-checked background music file into assets/music/ and records final postprocess metadata in manifests/assemble.json.`);
}

function parseArgs(argv) {
  const args = {
    output: 'assets/music/lofi.mp3',
    license: 'Pixabay Content License',
    provider: 'pixabay',
    speed: 1.07,
    volumeDb: -24,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--source') args.source = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--source-url') args.sourceUrl = argv[++i];
    else if (item === '--title') args.title = argv[++i];
    else if (item === '--artist') args.artist = argv[++i];
    else if (item === '--license') args.license = argv[++i];
    else if (item === '--provider') args.provider = argv[++i];
    else if (item === '--attribution') args.attribution = argv[++i];
    else if (item === '--speed') args.speed = Number(argv[++i]);
    else if (item === '--volume-db') args.volumeDb = Number(argv[++i]);
    else if (item === '--manifest') args.manifest = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value));
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside project root: ${target}`);
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, filePath);
}

async function freezeSource(source, output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (isUrl(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${source}`);
    const contentType = response.headers.get('content-type') || '';
    if (/text\/html/i.test(contentType)) {
      throw new Error(`Source looks like an HTML page, not an audio file. Open the track page, use its actual MP3/WAV download URL, then rerun: ${source}`);
    }
    await pipeline(response.body, fs.createWriteStream(output));
    return;
  }
  const sourcePath = path.resolve(source);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing source file: ${sourcePath}`);
  fs.copyFileSync(sourcePath, output);
}

function updateAssembleManifest(manifestPath, musicEntry, speed) {
  const manifest = readJson(manifestPath, { schemaVersion: 1, mode: 'auto', variants: [] });
  manifest.schemaVersion ||= 1;
  manifest.mode ||= 'auto';
  if (!Array.isArray(manifest.variants)) manifest.variants = [];
  manifest.postprocess = {
    ...(manifest.postprocess || {}),
    speed,
    backgroundMusic: musicEntry,
  };
  writeJsonAtomic(manifestPath, manifest);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.source || !args.sourceUrl || !args.title || !args.artist) {
    usage();
    process.exit(args.help ? 0 : 2);
  }
  if (!Number.isFinite(args.speed) || args.speed <= 0) throw new Error(`Invalid --speed: ${args.speed}`);
  if (!Number.isFinite(args.volumeDb)) throw new Error(`Invalid --volume-db: ${args.volumeDb}`);

  const projectDir = path.resolve(args.project);
  const output = path.resolve(projectDir, args.output);
  assertInside(projectDir, output, 'Music output');
  await freezeSource(args.source, output);

  const stat = fs.statSync(output);
  if (stat.size <= 0) throw new Error(`Downloaded music is empty: ${output}`);

  const manifestPath = path.resolve(projectDir, args.manifest || 'manifests/assemble.json');
  assertInside(projectDir, manifestPath, 'Assemble manifest');
  const relativeOutput = path.relative(projectDir, output).replace(/\\/g, '/');
  const musicEntry = {
    path: relativeOutput,
    volumeDb: args.volumeDb,
    provider: args.provider,
    sourceUrl: args.sourceUrl,
    license: args.license,
    title: args.title,
    artist: args.artist,
    attribution: args.attribution || `${args.title} by ${args.artist}`,
    attributionRequired: false,
    downloadedAt: new Date().toISOString(),
    sizeBytes: stat.size,
  };
  updateAssembleManifest(manifestPath, musicEntry, args.speed);

  console.log(JSON.stringify({
    ok: true,
    project: projectDir,
    output,
    manifest: manifestPath,
    postprocess: {
      speed: args.speed,
      backgroundMusic: musicEntry,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
