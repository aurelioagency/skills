#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error(`Usage:
  node verify-render.mjs --file <video.mp4> [--expect-width 1080] [--expect-height 1920] [--min-duration 1] [--max-duration 60]

Verifies duration, resolution, video stream, audio stream, and output path using ffmpeg metadata.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--file') args.file = argv[++i];
    else if (item === '--expect-width') args.expectWidth = Number(argv[++i]);
    else if (item === '--expect-height') args.expectHeight = Number(argv[++i]);
    else if (item === '--min-duration') args.minDuration = Number(argv[++i]);
    else if (item === '--max-duration') args.maxDuration = Number(argv[++i]);
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
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

function runFfmpeg(ffmpeg, file) {
  const nullTarget = process.platform === 'win32' ? 'NUL' : '/dev/null';
  const proc = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-frames:v', '1', '-f', 'null', nullTarget], {
    encoding: 'utf8',
    windowsHide: true,
  });
  const output = `${proc.stderr || ''}\n${proc.stdout || ''}`;
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw new Error(output || `ffmpeg exited with status ${proc.status}`);
  return output;
}

function parseMetadata(text) {
  const durationMatch = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const duration = durationMatch
    ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
    : null;
  const streams = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes('Stream #')) continue;
    if (line.includes('Video:')) {
      const dims = line.match(/(\d{2,5})x(\d{2,5})/);
      const codec = line.match(/Video:\s*([^,\s]+)/)?.[1] || null;
      streams.push({
        type: 'video',
        codec,
        width: dims ? Number(dims[1]) : null,
        height: dims ? Number(dims[2]) : null,
      });
    } else if (line.includes('Audio:')) {
      const codec = line.match(/Audio:\s*([^,\s]+)/)?.[1] || null;
      const sampleRate = line.match(/(\d+)\s*Hz/)?.[1] || null;
      const channels = line.includes('mono') ? 1 : line.includes('stereo') ? 2 : null;
      streams.push({ type: 'audio', codec, sampleRate: sampleRate ? Number(sampleRate) : null, channels });
    }
  }
  return { duration, streams };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.file) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const file = path.resolve(args.file);
  const issues = [];
  if (!fs.existsSync(file)) issues.push(`Missing file: ${file}`);
  if (issues.length) {
    console.log(JSON.stringify({ file, ok: false, issues }, null, 2));
    process.exit(1);
  }

  const ffmpeg = findFfmpeg(args.ffmpeg);
  const metadata = parseMetadata(runFfmpeg(ffmpeg, file));
  const video = metadata.streams.find((stream) => stream.type === 'video');
  const audio = metadata.streams.find((stream) => stream.type === 'audio');

  if (!metadata.duration || !Number.isFinite(metadata.duration)) issues.push('Could not read duration.');
  if (!video) issues.push('Missing video stream.');
  if (!audio) issues.push('Missing audio stream.');
  if (args.expectWidth && video?.width !== args.expectWidth) issues.push(`Expected width ${args.expectWidth}, got ${video?.width}.`);
  if (args.expectHeight && video?.height !== args.expectHeight) issues.push(`Expected height ${args.expectHeight}, got ${video?.height}.`);
  if (Number.isFinite(args.minDuration) && metadata.duration < args.minDuration) issues.push(`Duration below minimum ${args.minDuration}: ${metadata.duration}.`);
  if (Number.isFinite(args.maxDuration) && metadata.duration > args.maxDuration) issues.push(`Duration above maximum ${args.maxDuration}: ${metadata.duration}.`);

  const stat = fs.statSync(file);
  const result = {
    file,
    ok: issues.length === 0,
    sizeBytes: stat.size,
    durationSeconds: metadata.duration,
    video,
    audio,
    issues,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main();
