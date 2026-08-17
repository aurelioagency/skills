#!/usr/bin/env node
// Extracts a mono 16k WAV from any audio/video file and produces a word-level
// transcript for the caption tools. Nothing here is paid work.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function usage() {
  console.error(`Usage:
  node transcribe-media.mjs --input <video-or-audio> --out-audio <audio.wav> --out-transcript <words.json>
                            [--model large-v3] [--language es] [--python python] [--ffmpeg <path>]

Extracts speech audio and transcribes it with word-level timestamps.
The transcript is written as UTF-8 JSON and never echoed to the terminal.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--input') args.input = argv[++i];
    else if (item === '--out-audio') args.outAudio = argv[++i];
    else if (item === '--out-transcript') args.outTranscript = argv[++i];
    else if (item === '--model') args.model = argv[++i];
    else if (item === '--language') args.language = argv[++i];
    else if (item === '--python') args.python = argv[++i];
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

function findBinary(explicit, command, envVar) {
  const configured = explicit || (envVar ? process.env[envVar] : null);
  if (configured) return configured;
  const resolved = resolveOnPath(command);
  if (resolved) return resolved;
  const probe = spawnSync(command, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (!probe.error) return command;
  throw new Error(`Could not find ${command} on PATH.`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input || !args.outAudio || !args.outTranscript) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const input = path.resolve(args.input);
  if (!fs.existsSync(input)) throw new Error(`Missing input: ${input}`);
  const outAudio = path.resolve(args.outAudio);
  const outTranscript = path.resolve(args.outTranscript);
  fs.mkdirSync(path.dirname(outAudio), { recursive: true });
  fs.mkdirSync(path.dirname(outTranscript), { recursive: true });

  const ffmpeg = findBinary(args.ffmpeg, 'ffmpeg', 'FFMPEG_PATH');
  const extract = spawnSync(
    ffmpeg,
    ['-y', '-v', 'error', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', outAudio],
    { encoding: 'utf8', windowsHide: true },
  );
  if (extract.status !== 0) throw new Error(extract.stderr || 'ffmpeg audio extraction failed');

  const python = args.python || process.env.PYTHON_PATH || 'python';
  const transcribe = spawnSync(
    python,
    [
      path.join(HERE, 'lib', 'transcribe_words.py'),
      outAudio,
      outTranscript,
      args.model || 'large-v3',
      args.language || 'es',
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  if (transcribe.status !== 0) throw new Error(transcribe.stderr || 'transcription failed');

  const data = JSON.parse(fs.readFileSync(outTranscript, 'utf8'));
  const words = data.segments.flatMap((segment) => segment.words || []);
  const suspicious = words
    .filter((word) => word.prob !== undefined && word.prob < 0.75)
    .map((word) => ({ word: word.word, start: word.start, prob: word.prob }));

  console.log(JSON.stringify({
    ok: true,
    audio: outAudio,
    transcript: outTranscript,
    words: words.length,
    firstWordStart: words.length ? words[0].start : null,
    lastWordEnd: words.length ? words[words.length - 1].end : null,
    // Read these out of the JSON file, not the terminal, then take them to the
    // Transcript Approval Gate before rendering anything.
    lowConfidence: suspicious,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
