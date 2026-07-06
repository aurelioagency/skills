#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const suspicious = [/Ã./, /Â./, /â./, /\uFFFD/, /podÃ/i, /sÃ/i, /dÃ/i, /Ã‚/i, /Ãƒ/i, /ï¿½/i];

function usage() {
  console.error(`Usage:
  node generate-elevenlabs-segment.mjs --project <project-root> --segment <id> [--request manifests/audio-request.json] [--meta manifests/audio-meta.json] [--voice-id <id>] [--target-duration 6.966] [--must-contain skill,foo] [--env <.env>] [--skip-transcribe]

Generates one ElevenLabs TTS segment, normalizes it to WAV, optionally transcribes it, and updates project voice assets/manifests.`);
}

function parseArgs(argv) {
  const args = { request: 'manifests/audio-request.json', meta: 'manifests/audio-meta.json', model: 'eleven_multilingual_v2' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--segment') args.segment = argv[++i];
    else if (item === '--request') args.request = argv[++i];
    else if (item === '--meta') args.meta = argv[++i];
    else if (item === '--voice-id') args.voiceId = argv[++i];
    else if (item === '--target-duration') args.targetDuration = Number(argv[++i]);
    else if (item === '--must-contain') args.mustContain = argv[++i];
    else if (item === '--env') args.env = argv[++i];
    else if (item === '--model') args.model = argv[++i];
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--skip-transcribe') args.skipTranscribe = true;
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

function loadEnv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equals = trimmed.indexOf('=');
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function assertCleanPayload(label, text) {
  const hit = suspicious.find((pattern) => pattern.test(text));
  if (hit) throw new Error(`Blocked mojibake in ${label}: ${hit}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} failed with status ${result.status}: ${result.stderr || result.stdout || ''}`);
  }
  return result;
}

function wavDuration(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`Not a WAV file: ${filePath}`);
  }
  let offset = 12;
  let sampleRate = null;
  let channels = null;
  let bitsPerSample = null;
  let dataSize = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(start + 2);
      sampleRate = buffer.readUInt32LE(start + 4);
      bitsPerSample = buffer.readUInt16LE(start + 14);
    } else if (id === 'data') {
      dataSize = size;
      break;
    }
    offset = start + size + (size % 2);
  }
  if (!sampleRate || !channels || !bitsPerSample || !dataSize) throw new Error(`Could not read WAV duration: ${filePath}`);
  return dataSize / (sampleRate * channels * (bitsPerSample / 8));
}

async function transcribe(inputPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const blob = new Blob([fs.readFileSync(inputPath)], { type: 'audio/wav' });
  const form = new FormData();
  form.set('file', blob, path.basename(inputPath));
  form.set('model_id', 'scribe_v2');
  form.set('language_code', 'spa');
  form.set('timestamps_granularity', 'word');
  form.set('diarize', 'false');
  form.set('tag_audio_events', 'false');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Speech-to-text failed with HTTP ${response.status}: ${body}`);
  return JSON.parse(body);
}

function toPosixRelative(fromDir, targetPath) {
  return path.relative(fromDir, targetPath).replace(/\\/g, '/');
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

function resolveProjectJson(projectDir) {
  const primary = path.join(projectDir, 'manifests', 'project.json');
  const legacy = path.join(projectDir, 'project.manifest.json');
  return readJsonIfExists(primary) || readJsonIfExists(legacy) || {};
}

function resolveProjectFile(projectDir, requested, legacyName) {
  const primary = path.resolve(projectDir, requested);
  if (fs.existsSync(primary)) return primary;
  const legacy = path.resolve(projectDir, legacyName);
  if (fs.existsSync(legacy)) return legacy;
  return primary;
}

function updateAudioMeta(projectDir, metaPath, publicDir, segment, wavPath, duration, transcriptPath) {
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    : { tts_provider: 'elevenlabs', voices: [] };
  if (!Array.isArray(meta.voices)) meta.voices = [];
  let voice = meta.voices.find((item) => item.id === segment);
  if (!voice) {
    voice = { id: segment };
    meta.voices.push(voice);
  }
  voice.path = path.relative(projectDir, wavPath).replace(/\\/g, '/');
  voice.browserSrc = toPosixRelative(publicDir, wavPath);
  voice.duration_s = Number(duration.toFixed(3));
  if (transcriptPath) {
    voice.transcript = path.relative(projectDir, transcriptPath).replace(/\\/g, '/');
    voice.transcriptBrowserSrc = toPosixRelative(publicDir, transcriptPath);
  }
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.segment) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const requestPath = resolveProjectFile(projectDir, args.request, 'audio_request.json');
  const metaPath = resolveProjectFile(projectDir, args.meta, 'audio_meta.json');
  const envPath = args.env
    ? path.resolve(args.env)
    : firstExisting([
      path.resolve(projectDir, '.env'),
    ]);
  loadEnv(envPath);
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('Missing ELEVENLABS_API_KEY.');

  const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
  const projectManifest = resolveProjectJson(projectDir);
  const line = (request.lines || []).find((item) => item.id === args.segment);
  if (!line) throw new Error(`No line with id ${args.segment} in ${requestPath}`);
  const voiceId = args.voiceId || request.voice || request.voice_id || request.elevenLabsVoiceId || projectManifest.elevenLabsVoiceId;
  if (!voiceId) throw new Error('Missing voice id. Pass --voice-id or set request.voice.');
  const displayText = line.text || '';
  const ttsText = line.ttsText || displayText;
  assertCleanPayload(`${args.segment}.text`, displayText);
  assertCleanPayload(`${args.segment}.ttsText`, ttsText);

  const ffmpeg = findFfmpeg(args.ffmpeg);
  const tempDir = fs.mkdtempSync(path.join(tmpdir(), `heygen-${args.segment}-`));
  const textFile = path.join(tempDir, `${args.segment}.txt`);
  const mp3Path = path.join(tempDir, `${args.segment}.mp3`);
  const rawWavPath = path.join(tempDir, `${args.segment}.raw.wav`);
  const finalWavPath = path.join(tempDir, `${args.segment}.wav`);
  fs.writeFileSync(textFile, ttsText, 'utf8');

  const py = `
import os, sys
from elevenlabs.client import ElevenLabs
from elevenlabs import save
client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
text = open(sys.argv[1], encoding="utf-8").read()
audio = client.text_to_speech.convert(
    text=text,
    voice_id=sys.argv[2],
    model_id=sys.argv[4],
    output_format="mp3_44100_128",
)
save(audio, sys.argv[3])
`;
  run('python', ['-c', py, textFile, voiceId, mp3Path, args.model], { stdio: ['ignore', 'pipe', 'pipe'] });
  run(ffmpeg, ['-y', '-loglevel', 'error', '-i', mp3Path, '-ar', '44100', '-ac', '1', rawWavPath]);

  const rawDuration = wavDuration(rawWavPath);
  if (Number.isFinite(args.targetDuration) && args.targetDuration > 0) {
    if (rawDuration > args.targetDuration + 0.04) {
      const tempo = rawDuration / args.targetDuration;
      run(ffmpeg, ['-y', '-loglevel', 'error', '-i', rawWavPath, '-af', `atempo=${tempo.toFixed(6)},atrim=0:${args.targetDuration}`, '-ar', '44100', '-ac', '1', finalWavPath]);
    } else {
      const pad = Math.max(0, args.targetDuration - rawDuration);
      run(ffmpeg, ['-y', '-loglevel', 'error', '-i', rawWavPath, '-af', `apad=pad_dur=${pad.toFixed(6)},atrim=0:${args.targetDuration}`, '-ar', '44100', '-ac', '1', finalWavPath]);
    }
  } else {
    fs.copyFileSync(rawWavPath, finalWavPath);
  }

  const voiceDir = path.join(projectDir, 'assets', 'voice');
  const publicDir = path.join(projectDir, 'public');
  fs.mkdirSync(voiceDir, { recursive: true });
  const targetWav = path.join(voiceDir, `${args.segment}.wav`);
  fs.copyFileSync(finalWavPath, targetWav);

  let transcriptPath = null;
  let transcript = null;
  if (!args.skipTranscribe) {
    transcript = await transcribe(finalWavPath);
    const transcriptText = String(transcript.text || '');
    const required = String(args.mustContain || '').split(',').map((item) => item.trim()).filter(Boolean);
    for (const token of required) {
      if (!new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(transcriptText)) {
        throw new Error(`Transcript missing required token "${token}": ${transcriptText}`);
      }
    }
    transcriptPath = path.join(voiceDir, `${args.segment}.transcript.json`);
    fs.writeFileSync(transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`, 'utf8');
  }

  const duration = wavDuration(targetWav);
  updateAudioMeta(projectDir, metaPath, publicDir, args.segment, targetWav, duration, transcriptPath);
  console.log(JSON.stringify({
    ok: true,
    segment: args.segment,
    text: displayText,
    ttsText,
    voiceId,
    duration_s: Number(duration.toFixed(3)),
    wav: targetWav,
    transcript: transcriptPath,
    transcriptText: transcript?.text || null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
