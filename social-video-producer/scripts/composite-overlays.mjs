#!/usr/bin/env node
// Composites captured overlay frames (from capture-overlay-frames.mjs) onto a base video
// in a single ffmpeg encode pass. Reads manifests/overlays.json for timing and
// renders/overlay-frames/capture-manifest.json for the frame directories/durations.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error(`Usage:
  node composite-overlays.mjs --project <project-root> --input <base-video> --output <out.mp4>
                              [--overlays manifests/overlays.json] [--width 1920] [--height 1080] [--crf 14]`);
}

function parseArgs(argv) {
  const args = { overlays: 'manifests/overlays.json', width: 1920, height: 1080, crf: 14 };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--input') args.input = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--overlays') args.overlays = argv[++i];
    else if (item === '--width') args.width = Number(argv[++i]);
    else if (item === '--height') args.height = Number(argv[++i]);
    else if (item === '--crf') args.crf = Number(argv[++i]);
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function resolveOnPath(command) {
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map((e) => e.trim()).filter(Boolean)
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
  throw new Error('Could not find ffmpeg on PATH.');
}

// Detects same-zone overlap between simultaneously active items so a collision
// (two panels stacked on top of each other) is caught before spending an encode.
function checkCollisions(items) {
  const zoneOf = (item) => {
    if (item.type === 'punch') return 'center';
    return item.position || (item.type === 'steplist' ? 'bottom-center' : 'bottom-left');
  };
  const spans = items.map((item) => ({
    id: item.id,
    zone: zoneOf(item),
    start: item.start,
    end: item.end ?? (item.start + (item.duration || 0) + 0.3),
  }));
  const problems = [];
  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      const a = spans[i], b = spans[j];
      if (a.zone !== b.zone) continue;
      const overlap = a.start < b.end && b.start < a.end;
      if (overlap) problems.push(`"${a.id}" and "${b.id}" both use zone "${a.zone}" and overlap in time (${a.start}-${a.end} vs ${b.start}-${b.end})`);
    }
  }
  return problems;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.input || !args.output) { usage(); process.exit(args.help ? 0 : 2); }

  const projectDir = path.resolve(args.project);
  const overlaysPath = path.resolve(projectDir, args.overlays);
  const overlays = JSON.parse(fs.readFileSync(overlaysPath, 'utf8'));
  const captureManifestPath = path.join(projectDir, 'renders', 'overlay-frames', 'capture-manifest.json');
  if (!fs.existsSync(captureManifestPath)) throw new Error(`Missing ${captureManifestPath}. Run capture-overlay-frames.mjs first.`);
  const captured = JSON.parse(fs.readFileSync(captureManifestPath, 'utf8'));

  const collisions = checkCollisions(overlays.items);
  if (collisions.length) {
    throw new Error(`Overlay zone collisions found — fix timing/position before compositing:\n${collisions.join('\n')}`);
  }

  const inputArgs = ['-i', path.resolve(args.input)];
  const filterLines = [];
  filterLines.push(`[0:v]scale=${args.width}:${args.height}:flags=lanczos,setsar=1[base];`);

  let inputIndex = 1;
  let lastLabel = 'base';
  const overlayStages = [];

  overlays.items.forEach((item, idx) => {
    const cap = captured[item.id];
    if (!cap) throw new Error(`No captured frames recorded for item "${item.id}"`);
    const dir = path.join(projectDir, cap.dir);
    const rawLabel = `raw${idx}`;
    const shiftedLabel = `ov${idx}`;

    if (cap.kind === 'enter-hold-exit') {
      const enterGlob = path.join(dir, 'enter_%03d.png');
      const holdPng = path.join(dir, 'hold.png');
      const exitGlob = path.join(dir, 'exit_%03d.png');
      const holdDur = Math.max(0, (item.end ?? (item.start + (item.duration || 0))) - item.start - cap.enterDur - cap.exitDur);
      inputArgs.push('-framerate', String(cap.fps), '-i', enterGlob);
      inputArgs.push('-framerate', String(cap.fps), '-loop', '1', '-t', holdDur.toFixed(3), '-i', holdPng);
      inputArgs.push('-framerate', String(cap.fps), '-i', exitGlob);
      const e0 = inputIndex, e1 = inputIndex + 1, e2 = inputIndex + 2;
      inputIndex += 3;
      filterLines.push(`[${e0}:v]format=rgba[${rawLabel}a];[${e1}:v]format=rgba[${rawLabel}b];[${e2}:v]format=rgba[${rawLabel}c];`);
      filterLines.push(`[${rawLabel}a][${rawLabel}b][${rawLabel}c]concat=n=3:v=1:a=0[${rawLabel}];`);
    } else if (cap.kind === 'continuous-plus-exit') {
      const mainGlob = path.join(dir, 'f_%04d.png');
      const exitGlob = path.join(dir, 'x_%03d.png');
      inputArgs.push('-framerate', String(cap.fps), '-i', mainGlob);
      inputArgs.push('-framerate', String(cap.fps), '-i', exitGlob);
      const e0 = inputIndex, e1 = inputIndex + 1;
      inputIndex += 2;
      filterLines.push(`[${e0}:v]format=rgba[${rawLabel}a];[${e1}:v]format=rgba[${rawLabel}b];`);
      filterLines.push(`[${rawLabel}a][${rawLabel}b]concat=n=2:v=1:a=0[${rawLabel}];`);
    } else {
      throw new Error(`Unknown capture kind "${cap.kind}" for item "${item.id}"`);
    }

    filterLines.push(`[${rawLabel}]setpts=PTS+${item.start}/TB[${shiftedLabel}];`);
    const end = item.end ?? (item.start + (item.duration || 0) + 0.3);
    overlayStages.push({ label: shiftedLabel, start: item.start, end });
  });

  overlayStages.forEach((stage, idx) => {
    const outLabel = idx === overlayStages.length - 1 ? 'vout' : `stage${idx}`;
    filterLines.push(`[${lastLabel}][${stage.label}]overlay=0:0:enable='between(t,${stage.start},${stage.end})'[${outLabel}];`);
    lastLabel = outLabel;
  });

  const projectTmp = path.join(projectDir, 'renders');
  fs.mkdirSync(projectTmp, { recursive: true });
  const filterPath = path.join(projectTmp, '.composite-filter.txt');
  const filterText = filterLines.join('\n').replace(/;\s*$/, '');
  fs.writeFileSync(filterPath, filterText);

  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const ffmpeg = findFfmpeg(args.ffmpeg);

  const ffmpegArgs = [
    '-y', '-v', 'error',
    ...inputArgs,
    '-filter_complex_script', filterPath,
    '-map', '[vout]', '-map', '0:a',
    '-c:v', 'libx264', '-crf', String(args.crf), '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    output,
  ];

  console.log('Compositing', overlays.items.length, 'overlay items onto', args.input);
  const proc = spawnSync(ffmpeg, ffmpegArgs, { stdio: 'inherit', windowsHide: true });
  if (proc.status !== 0) throw new Error(`ffmpeg exited with status ${proc.status}`);
  console.log(output);
}

main();
