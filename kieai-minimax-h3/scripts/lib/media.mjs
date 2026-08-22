// ffmpeg/ffprobe helpers: duration probing, contact sheets, end-frame extraction.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(bin, args) {
  return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function haveFfmpeg() {
  try { run('ffmpeg', ['-version']); return true; } catch { return false; }
}

export function probeDuration(file) {
  const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  const seconds = parseFloat(out.trim());
  if (!Number.isFinite(seconds)) throw new Error(`Could not read duration of ${file}`);
  return seconds;
}

export function probeVideo(file) {
  const out = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate', '-show_entries', 'format=duration',
    '-of', 'default=nw=1', file]);
  const get = (k) => (new RegExp(`^${k}=(.*)$`, 'm').exec(out)?.[1] || '').trim();
  const [num, den] = (get('r_frame_rate') || '0/1').split('/').map(Number);
  return {
    width: Number(get('width')) || null,
    height: Number(get('height')) || null,
    fps: den ? +(num / den).toFixed(3) : null,
    duration: parseFloat(get('duration')) || null,
  };
}

// One PNG grid showing the whole clip. This is what makes "did it land on the last frame?"
// and "did it invent scenery?" answerable without scrubbing the video.
export function contactSheet(video, outFile, { cols = 4, rows = 4, tileWidth = 480 } = {}) {
  const duration = probeDuration(video);
  const count = cols * rows;
  const fps = count / duration;
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  // No burned-in timestamps: drawtext depends on a font being present, and a silently
  // mangled overlay is worse than none. The timestamps come back in the return value
  // instead, in reading order (left to right, top to bottom).
  run('ffmpeg', ['-y', '-i', video, '-vf', `fps=${fps.toFixed(6)},scale=${tileWidth}:-2,tile=${cols}x${rows}`, '-frames:v', '1', outFile]);
  const step = duration / count;
  return {
    file: outFile, cols, rows, frames: count, duration,
    secondsPerTile: +step.toFixed(3),
    tileTimestamps: Array.from({ length: count }, (_, i) => +(i * step).toFixed(2)),
  };
}

export function extractFrame(video, outFile, { at = 0, fromEnd = false } = {}) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const seek = fromEnd ? Math.max(0, probeDuration(video) - 0.05) : at;
  run('ffmpeg', ['-y', '-ss', String(seek), '-i', video, '-frames:v', '1', '-q:v', '2', outFile]);
  return outFile;
}
