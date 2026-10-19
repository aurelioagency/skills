#!/usr/bin/env node
// Burns an ASS subtitle file into a video in a SINGLE encode pass.
//
// This is the whole point of the burn-in branch: the source video already exists, so
// the encode budget allows exactly one generation of pixels. Every caption, colour and
// motion decision lives in the .ass file, never in a chain of extra ffmpeg passes.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error(`Usage:
  node burn-in-captions.mjs --input <source.mp4> --ass <captions.ass> --output <final.mp4>
      [--fonts-dir <dir>]   directory holding the caption font; strongly recommended
      [--crf 14] [--preset slow] [--audio copy] [--ffmpeg <path>]

Single encode: video is re-encoded once with the captions, audio is copied by default.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--input') args.input = argv[++i];
    else if (item === '--ass') args.ass = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--fonts-dir') args.fontsDir = argv[++i];
    else if (item === '--crf') args.crf = Number(argv[++i]);
    else if (item === '--preset') args.preset = argv[++i];
    else if (item === '--audio') args.audio = argv[++i];
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

// A bare command name is resolved against PATH by spawn, but fs.existsSync would only
// match a file of that name in the current directory. Walk PATH explicitly instead.
function resolveOnPath(command) {
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map((ext) => ext.trim()).filter(Boolean)
    : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir.replace(/^"|"$/g, ''), command + ext);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function findFfmpeg(explicit) {
  const configured = explicit || process.env.FFMPEG_PATH;
  if (configured) return configured;
  const resolved = resolveOnPath('ffmpeg');
  if (resolved) return resolved;
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8', windowsHide: true });
  if (!probe.error && probe.status === 0) return 'ffmpeg';
  throw new Error('Could not find ffmpeg on PATH. Pass --ffmpeg or set FFMPEG_PATH.');
}

// Inside an ffmpeg filter argument a Windows drive letter has to be escaped, or the
// colon is read as the start of the next filter option and the filter silently drops.
function filterPath(value) {
  return String(value).replace(/\\/g, '/').replace(/:/g, '\\:');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input || !args.ass || !args.output) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const input = path.resolve(args.input);
  const ass = path.resolve(args.ass);
  const output = path.resolve(args.output);
  if (!fs.existsSync(input)) throw new Error(`Missing input video: ${input}`);
  if (!fs.existsSync(ass)) throw new Error(`Missing ASS file: ${ass}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });

  let filter = `ass='${filterPath(ass)}'`;
  if (args.fontsDir) {
    const fontsDir = path.resolve(args.fontsDir);
    if (!fs.existsSync(fontsDir)) throw new Error(`Missing fonts dir: ${fontsDir}`);
    filter += `:fontsdir='${filterPath(fontsDir)}'`;
  }
  // setsar=1 keeps the sample aspect ratio square; format=yuv420p keeps 10-bit sources
  // playable everywhere social platforms will take them.
  filter += ',setsar=1,format=yuv420p';

  const ffmpeg = findFfmpeg(args.ffmpeg);
  const audio = args.audio || 'copy';
  const ffmpegArgs = [
    '-y', '-v', 'error', '-stats',
    '-i', input,
    '-vf', filter,
    '-c:v', 'libx264',
    '-crf', String(args.crf ?? 14),
    '-preset', args.preset || 'slow',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', audio,
    '-movflags', '+faststart',
    output,
  ];

  const proc = spawnSync(ffmpeg, ffmpegArgs, { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'inherit'] });
  if (proc.status !== 0) throw new Error(`ffmpeg exited with status ${proc.status}`);

  console.log(JSON.stringify({
    ok: true,
    output,
    input,
    ass,
    encodePasses: 1,
    filter,
    crf: args.crf ?? 14,
    preset: args.preset || 'slow',
    audio,
    sizeBytes: fs.statSync(output).size,
    next: 'Run verify-render.mjs, then check frames at several timestamps of the FINAL file.',
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
