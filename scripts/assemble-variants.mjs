#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

function usage() {
  console.error(`Usage:
  node assemble-variants.mjs --manifest <project-root>/manifests/assemble.json [--ffmpeg <path>] [--speed 1.07] [--music assets/music/lofi.mp3] [--music-volume-db -24]

Manifest shape:
{
  "postprocess": {
    "speed": 1.07,
    "backgroundMusic": {
      "path": "assets/music/lofi.mp3",
      "volumeDb": -24,
      "sourceUrl": "https://...",
      "license": "Pixabay Content License",
      "attribution": "Track by Artist"
    }
  },
  "variants": [
    { "id": "opening1", "segments": ["renders/segments/opening1.mp4", "renders/segments/middle.mp4", "renders/segments/outro.mp4"], "output": "renders/final/video-opening1.mp4" }
  ],
  "mode": "auto" // "copy", "encode", or "auto"
}
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--manifest') args.manifest = argv[++i];
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--speed') args.speed = Number(argv[++i]);
    else if (item === '--music') args.music = argv[++i];
    else if (item === '--music-volume-db') args.musicVolumeDb = Number(argv[++i]);
    else if (item === '--no-music') args.noMusic = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function firstExisting(items) {
  return items.find((item) => item && fs.existsSync(item));
}

function findFfmpeg(explicit) {
  const ffmpeg = explicit || process.env.FFMPEG_PATH || firstExisting([
    'ffmpeg',
  ]);
  if (!ffmpeg) throw new Error('Could not find ffmpeg. Pass --ffmpeg or set FFMPEG_PATH.');
  return ffmpeg;
}

function ffconcatEscape(filePath) {
  return String(filePath).replace(/\\/g, '/').replace(/'/g, "'\\''");
}

function run(command, args) {
  const proc = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) {
    throw new Error(`${path.basename(command)} failed with status ${proc.status}\n${proc.stderr || proc.stdout || ''}`);
  }
  return proc;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside manifest project root: ${target}`);
  }
}

function concatArgs(mode, concatFile, output) {
  const base = ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile];
  if (mode === 'copy') {
    return [...base, '-c', 'copy', '-movflags', '+faststart', output];
  }
  return [
    ...base,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    output,
  ];
}

function speedAudioFilter(speed) {
  if (speed > 0.5 && speed < 2) return `atempo=${speed.toFixed(6)}`;
  const parts = [];
  let remaining = speed;
  while (remaining >= 2) {
    parts.push('atempo=2.000000');
    remaining /= 2;
  }
  while (remaining <= 0.5) {
    parts.push('atempo=0.500000');
    remaining /= 0.5;
  }
  parts.push(`atempo=${remaining.toFixed(6)}`);
  return parts.join(',');
}

function outputArgs() {
  return [
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
  ];
}

function normalizePostprocess(manifest, variant, args) {
  const merged = {
    ...(manifest.postprocess || {}),
    ...(variant.postprocess || {}),
  };
  if (Number.isFinite(args.speed)) merged.speed = args.speed;
  if (args.music) {
    merged.backgroundMusic = {
      ...(merged.backgroundMusic || {}),
      path: args.music,
    };
  }
  if (Number.isFinite(args.musicVolumeDb)) {
    merged.backgroundMusic = {
      ...(merged.backgroundMusic || {}),
      volumeDb: args.musicVolumeDb,
    };
  }
  if (args.noMusic) delete merged.backgroundMusic;
  const speed = Number(merged.speed || 1);
  if (!Number.isFinite(speed) || speed <= 0) throw new Error(`Invalid postprocess speed: ${merged.speed}`);
  return {
    speed,
    backgroundMusic: merged.backgroundMusic || null,
  };
}

function needsPostprocess(postprocess) {
  return Math.abs(postprocess.speed - 1) > 0.0001 || Boolean(postprocess.backgroundMusic?.path);
}

function postprocessArgs(input, output, postprocess, root) {
  const args = ['-y', '-i', input];
  const filters = [];
  const maps = ['-map', '[v]', '-map', '[a]'];
  const speed = postprocess.speed;

  filters.push(`[0:v]setpts=PTS/${speed.toFixed(6)}[v]`);
  const voiceFilter = Math.abs(speed - 1) > 0.0001 ? speedAudioFilter(speed) : 'anull';

  if (postprocess.backgroundMusic?.path) {
    const musicPath = path.resolve(root, postprocess.backgroundMusic.path);
    assertInside(root, musicPath, 'Background music');
    if (!fs.existsSync(musicPath)) throw new Error(`Missing background music: ${musicPath}`);
    args.push('-stream_loop', '-1', '-i', musicPath);
    const volume = Number.isFinite(Number(postprocess.backgroundMusic.volume))
      ? Number(postprocess.backgroundMusic.volume)
      : null;
    const volumeDb = Number.isFinite(Number(postprocess.backgroundMusic.volumeDb))
      ? Number(postprocess.backgroundMusic.volumeDb)
      : -24;
    const musicVolume = volume == null ? `volume=${volumeDb}dB` : `volume=${volume}`;
    filters.push(`[0:a]${voiceFilter}[voice]`);
    filters.push(`[1:a]${musicVolume}[music]`);
    filters.push('[voice][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]');
  } else {
    filters.push(`[0:a]${voiceFilter}[a]`);
  }

  return [
    ...args,
    '-filter_complex', filters.join(';'),
    ...maps,
    ...outputArgs(),
    output,
  ];
}

function projectRootForManifest(manifestPath) {
  const manifestDir = path.dirname(manifestPath);
  return path.basename(manifestDir).toLowerCase() === 'manifests'
    ? path.dirname(manifestDir)
    : manifestDir;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.manifest) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const manifestPath = path.resolve(args.manifest);
  const root = projectRootForManifest(manifestPath);
  const manifest = readJson(manifestPath);
  const mode = manifest.mode || 'auto';
  if (!['auto', 'copy', 'encode'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  if (!Array.isArray(manifest.variants) || !manifest.variants.length) throw new Error('Manifest must include variants[].');

  const ffmpeg = findFfmpeg(args.ffmpeg);
  const results = [];
  for (const variant of manifest.variants) {
    if (!variant.id || !Array.isArray(variant.segments) || !variant.output) {
      throw new Error('Each variant needs id, segments[], and output.');
    }
    const segments = variant.segments.map((segment) => path.resolve(root, segment));
    for (const segment of segments) {
      assertInside(root, segment, `Segment for ${variant.id}`);
      if (!fs.existsSync(segment)) throw new Error(`Missing segment for ${variant.id}: ${segment}`);
    }
    const output = path.resolve(root, variant.output);
    assertInside(root, output, `Output for ${variant.id}`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const postprocess = normalizePostprocess(manifest, variant, args);
    const finalOutput = output;
    const assembledOutput = needsPostprocess(postprocess)
      ? path.join(tmpdir(), `heygen-avatar-${variant.id}-${Date.now()}-assembled.mp4`)
      : finalOutput;
    const concatFile = path.join(tmpdir(), `heygen-avatar-${variant.id}-${Date.now()}.ffconcat`);
    fs.writeFileSync(concatFile, segments.map((segment) => `file '${ffconcatEscape(segment)}'`).join('\n') + '\n', 'utf8');

    const attemptModes = mode === 'auto' ? ['copy', 'encode'] : [mode];
    let usedMode = null;
    let lastError = null;
    for (const attemptMode of attemptModes) {
      try {
        run(ffmpeg, concatArgs(attemptMode, concatFile, assembledOutput));
        usedMode = attemptMode;
        break;
      } catch (error) {
        lastError = error;
        if (mode !== 'auto') throw error;
      }
    }
    fs.rmSync(concatFile, { force: true });
    if (!usedMode) throw lastError || new Error(`Could not assemble ${variant.id}`);
    if (needsPostprocess(postprocess)) {
      run(ffmpeg, postprocessArgs(assembledOutput, finalOutput, postprocess, root));
      fs.rmSync(assembledOutput, { force: true });
    }
    results.push({ id: variant.id, output: finalOutput, mode: usedMode, postprocess, segments });
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main();
