#!/usr/bin/env node
// kieai-minimax-h3 — one CLI for the whole MiniMax H3 run on KIE.ai.
// Same behaviour in Claude Code and Codex: all API and ffmpeg work lives here,
// never in agent-improvised fetch calls.
//
//   node kie.mjs config --base "<folder>"     set (and remember) where jobs are stored
//   node kie.mjs credits                      account credit balance
//   node kie.mjs init <slug> --mode i2v       create a job folder with a job.json skeleton
//   node kie.mjs upload --job <dir>           upload every local input, save the URLs
//   node kie.mjs estimate --job <dir>         credit cost, before spending anything
//   node kie.mjs create --job <dir> --yes     submit the task (refuses without --yes)
//   node kie.mjs poll --job <dir>             wait, then download the MP4
//   node kie.mjs verify --job <dir>           contact sheet + first/last frame
//   node kie.mjs run --job <dir> --yes        upload -> create -> poll -> verify
//
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  MODELS, CREDITS_PER_SECOND, readApiKey, getCredits, createTask, pollTask, downloadTo,
} from './lib/api.mjs';
import { uploadFile, checkFile } from './lib/upload.mjs';
import { contactSheet, extractFrame, probeDuration, probeVideo, haveFfmpeg } from './lib/media.mjs';

const CONFIG_FILE = path.join(os.homedir(), '.kieai-minimax-h3.json');

// ---------- small helpers ----------

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

const readJson = (f, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; }
};
const writeJson = (f, data) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
};

const loadConfig = () => readJson(CONFIG_FILE, {}) || {};
const saveConfig = (cfg) => writeJson(CONFIG_FILE, cfg);

function fail(msg) { console.error(`\n[x] ${msg}\n`); process.exit(1); }

function jobDir(args) {
  if (args.job) return path.resolve(String(args.job));
  const slug = args._[1];
  const base = loadConfig().baseDir;
  if (slug && base) return path.join(base, slug);
  fail('Missing --job <folder>. Set a default base folder first: kie.mjs config --base "<folder>"');
}

function loadJob(dir) {
  const file = path.join(dir, 'job.json');
  const job = readJson(file);
  if (!job) fail(`No job.json in ${dir}. Create one with: kie.mjs init <slug> --mode i2v`);
  if (!MODELS[job.mode]) fail(`job.json has an unknown mode "${job.mode}". Use one of: ${Object.keys(MODELS).join(', ')}`);
  return job;
}

const key = (dir) => readApiKey([dir, loadConfig().baseDir, process.cwd()]);

// Local input paths declared in job.json, flattened with the role each one plays.
function jobInputs(job, dir) {
  const abs = (p) => (path.isAbsolute(p) ? p : path.join(dir, p));
  const i = job.inputs || {};
  const list = [];
  if (i.first_frame) list.push({ role: 'first_frame', file: abs(i.first_frame) });
  if (i.last_frame) list.push({ role: 'last_frame', file: abs(i.last_frame) });
  for (const f of i.reference_images || []) list.push({ role: 'reference_image', file: abs(f) });
  for (const f of i.reference_videos || []) list.push({ role: 'reference_video', file: abs(f) });
  for (const f of i.reference_audios || []) list.push({ role: 'reference_audio', file: abs(f) });
  return list;
}

function validateJob(job, dir) {
  const errs = [];
  const i = job.inputs || {};
  if (!job.prompt_en || String(job.prompt_en).trim().length < 10) errs.push('prompt_en is empty (the API is sent the English prompt)');
  if (String(job.prompt_en || '').length > 7000) errs.push('prompt_en is over the 7000 character limit');
  const d = Number(job.duration);
  if (!Number.isInteger(d) || d < 4 || d > 15) errs.push('duration must be an integer between 4 and 15');
  if (!CREDITS_PER_SECOND[job.resolution]) errs.push('resolution must be "768P" or "2K"');

  if (job.mode === 't2v') {
    if (!job.aspect_ratio) errs.push('t2v requires aspect_ratio (21:9, 16:9, 4:3, 1:1, 3:4, 9:16)');
    if (jobInputs(job, dir).length) errs.push('t2v takes no input files');
  }
  if (job.mode === 'i2v') {
    if (!i.first_frame && !i.last_frame) errs.push('i2v needs first_frame and/or last_frame');
    if ((i.reference_images || []).length || (i.reference_videos || []).length || (i.reference_audios || []).length) {
      errs.push('i2v accepts only first_frame/last_frame — reference inputs belong to ref2v');
    }
  }
  if (job.mode === 'ref2v') {
    if (!(i.reference_images || []).length && !(i.reference_videos || []).length) {
      errs.push('ref2v needs at least one reference image or reference video');
    }
    if ((i.reference_images || []).length > 9) errs.push('ref2v allows at most 9 reference images');
    if ((i.reference_videos || []).length > 3) errs.push('ref2v allows at most 3 reference videos');
    if ((i.reference_audios || []).length > 3) errs.push('ref2v allows at most 3 reference audios');
    if (i.first_frame || i.last_frame) errs.push('ref2v has no first/last frame control — use i2v when the cut must match exactly');
  }
  for (const { file } of jobInputs(job, dir)) {
    try { checkFile(file); } catch (e) { errs.push(e.message); }
  }
  if (errs.length) fail(`job.json is not valid:\n    - ${errs.join('\n    - ')}`);
}

// Input video seconds are billed on top of the generated seconds.
function estimate(job, dir) {
  const rate = CREDITS_PER_SECOND[job.resolution];
  let inputSeconds = 0;
  const inputs = [];
  for (const { role, file } of jobInputs(job, dir)) {
    if (role !== 'reference_video') continue;
    const s = probeDuration(file);
    inputSeconds += s;
    inputs.push({ file: path.basename(file), seconds: +s.toFixed(2) });
  }
  const billedSeconds = Number(job.duration) + inputSeconds;
  return {
    resolution: job.resolution,
    creditsPerSecond: rate,
    generatedSeconds: Number(job.duration),
    inputVideoSeconds: +inputSeconds.toFixed(2),
    inputVideos: inputs,
    billedSeconds: +billedSeconds.toFixed(2),
    credits: Math.ceil(billedSeconds * rate),
  };
}

function buildInput(job, dir) {
  const urls = readJson(path.join(dir, 'uploads.json'), null);
  const need = jobInputs(job, dir);
  if (need.length && !urls) fail('Inputs are not uploaded yet. Run: kie.mjs upload --job <dir>');
  const urlFor = (file) => {
    const hit = (urls?.files || []).find((u) => path.resolve(u.file) === path.resolve(file));
    if (!hit) fail(`No uploaded URL for ${file}. Re-run: kie.mjs upload --job <dir>`);
    return hit.url;
  };
  const abs = (p) => (path.isAbsolute(p) ? p : path.join(dir, p));
  const i = job.inputs || {};
  const input = { prompt: job.prompt_en, duration: Number(job.duration), resolution: job.resolution };

  if (job.mode === 't2v') {
    input.aspect_ratio = job.aspect_ratio;
  } else if (job.mode === 'i2v') {
    // No aspect_ratio here on purpose: in image-to-video the framing comes from the image.
    if (i.first_frame) input.first_frame_url = urlFor(abs(i.first_frame));
    if (i.last_frame) input.last_frame_url = urlFor(abs(i.last_frame));
  } else {
    if (job.aspect_ratio) input.aspect_ratio = job.aspect_ratio;
    if ((i.reference_images || []).length) input.reference_image_urls = i.reference_images.map((f) => urlFor(abs(f)));
    if ((i.reference_videos || []).length) input.reference_video_urls = i.reference_videos.map((f) => urlFor(abs(f)));
    if ((i.reference_audios || []).length) input.reference_audio_urls = i.reference_audios.map((f) => urlFor(abs(f)));
  }
  return input;
}

function appendLog(dir, title, lines) {
  const file = path.join(dir, 'log.md');
  const stamp = new Date().toISOString();
  const body = `\n## ${title} — ${stamp}\n\n${lines.join('\n')}\n`;
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(file, fs.existsSync(file) ? body : `# Run log — ${path.basename(dir)}\n${body}`);
}

// ---------- commands ----------

const commands = {};

commands.config = async (args) => {
  const cfg = loadConfig();
  if (args.base) {
    const base = path.resolve(String(args.base));
    fs.mkdirSync(base, { recursive: true });
    cfg.baseDir = base;
    saveConfig(cfg);
  }
  console.log(JSON.stringify({ configFile: CONFIG_FILE, ...cfg }, null, 2));
  if (!cfg.baseDir) console.log('\nNo base folder set yet. Set one with: kie.mjs config --base "<folder>"');
};

commands.credits = async (args) => {
  const credits = await getCredits(key(args.job ? path.resolve(String(args.job)) : null));
  console.log(`Credits available: ${credits}`);
};

commands.init = async (args) => {
  const slug = args._[1];
  if (!slug) fail('Usage: kie.mjs init <slug> --mode i2v|ref2v|t2v');
  const mode = String(args.mode || 'i2v');
  if (!MODELS[mode]) fail(`Unknown mode "${mode}". Use i2v, ref2v or t2v.`);
  const base = args.base ? path.resolve(String(args.base)) : loadConfig().baseDir;
  if (!base) fail('No base folder set. Run: kie.mjs config --base "<folder>"');
  const dir = path.join(base, slug);
  if (fs.existsSync(path.join(dir, 'job.json'))) fail(`${dir} already has a job.json — pick another slug or edit that job.`);
  fs.mkdirSync(path.join(dir, 'in'), { recursive: true });
  const job = {
    slug, mode,
    prompt_es: '',
    prompt_en: '',
    duration: 4,
    resolution: '768P',
    ...(mode === 't2v' ? { aspect_ratio: '16:9' } : {}),
    ...(mode === 'ref2v' ? { aspect_ratio: 'adaptive' } : {}),
    inputs: mode === 'i2v' ? { first_frame: '', last_frame: '' }
      : mode === 'ref2v' ? { reference_images: [], reference_videos: [], reference_audios: [] }
      : {},
    technique: '',
    notes: '',
  };
  writeJson(path.join(dir, 'job.json'), job);
  console.log(`Job folder ready: ${dir}\n  - put input files in ${path.join(dir, 'in')}\n  - fill job.json (prompt_en is what gets sent)`);
};

commands.upload = async (args) => {
  const dir = jobDir(args);
  const job = loadJob(dir);
  validateJob(job, dir);
  const files = jobInputs(job, dir);
  if (!files.length) { console.log('No local inputs to upload for this mode.'); return; }
  const k = key(dir);
  const out = { uploadedAt: new Date().toISOString(), files: [] };
  for (const { role, file } of files) {
    process.stdout.write(`uploading ${role}: ${path.basename(file)} ... `);
    const res = await uploadFile({ key: k, file });
    out.files.push({ role, ...res });
    console.log('ok');
  }
  writeJson(path.join(dir, 'uploads.json'), out);
  console.log(`\nURLs saved to ${path.join(dir, 'uploads.json')} (KIE deletes the uploaded copies after 24h).`);
};

commands.estimate = async (args) => {
  const dir = jobDir(args);
  const job = loadJob(dir);
  validateJob(job, dir);
  console.log(JSON.stringify(estimate(job, dir), null, 2));
};

commands.create = async (args) => {
  const dir = jobDir(args);
  const job = loadJob(dir);
  validateJob(job, dir);
  const est = estimate(job, dir);
  const input = buildInput(job, dir);

  if (!args.yes) {
    console.log(`\nAbout to spend ~${est.credits} credits (${est.resolution}, ${est.billedSeconds}s billed).`);
    console.log(JSON.stringify({ model: MODELS[job.mode], input }, null, 2));
    fail('Not submitted. Re-run with --yes only after the user has confirmed the cost.');
  }

  const k = key(dir);
  const taskId = await createTask({ key: k, model: MODELS[job.mode], input, callBackUrl: job.callBackUrl });
  writeJson(path.join(dir, 'task.json'), { taskId, model: MODELS[job.mode], input, estimate: est, createdAt: new Date().toISOString() });
  appendLog(dir, 'Task created', [
    `- taskId: \`${taskId}\``,
    `- model: \`${MODELS[job.mode]}\``,
    `- duration: ${job.duration}s · resolution: ${job.resolution}${job.aspect_ratio ? ` · aspect_ratio: ${job.aspect_ratio}` : ''}`,
    `- estimated credits: ${est.credits}`,
    ...(job.technique ? [`- technique: ${job.technique}`] : []),
    '',
    '**Prompt (ES)**', '', '```text', job.prompt_es || '(not written)', '```', '',
    '**Prompt (EN, sent to the API)**', '', '```text', job.prompt_en, '```',
  ]);
  console.log(`taskId: ${taskId}\nNow run: kie.mjs poll --job "${dir}"`);
};

commands.poll = async (args) => {
  const dir = args.task && !args.job ? null : jobDir(args);
  const taskId = args.task ? String(args.task) : readJson(path.join(dir, 'task.json'), {})?.taskId;
  if (!taskId) fail('No taskId. Run create first, or pass --task <id>.');
  const k = key(dir);
  const timeoutMs = (Number(args.timeout) || 20) * 60 * 1000;

  const status = await pollTask({
    key: k, taskId, timeoutMs,
    onTick: ({ attempt, state, elapsedMs, message }) => {
      console.log(`[${Math.round(elapsedMs / 1000)}s] attempt ${attempt}: ${state}${message ? ` (${message})` : ''}`);
    },
  });

  if (!status.ok) {
    if (dir) appendLog(dir, 'Task failed', [`- taskId: \`${taskId}\``, `- state: ${status.state}`, `- error: ${status.error}`]);
    fail(`Task ${taskId} failed (${status.state}): ${status.error}\nDiagnose before resubmitting. Never retry blind — change exactly one variable.`);
  }
  if (!status.urls.length) fail(`Task ${taskId} reported success but returned no result URL.`);

  if (!dir) { console.log(status.urls.join('\n')); return; }
  const out = path.join(dir, 'out', `${loadJob(dir).slug || 'clip'}.mp4`);
  const dl = await downloadTo(status.urls[0], out);
  appendLog(dir, 'Task finished', [
    `- taskId: \`${taskId}\``,
    `- credits consumed: ${status.creditsConsumed ?? 'not reported'}`,
    `- generation time: ${status.costTime ?? '?'}s`,
    `- file: \`${out}\` (${(dl.bytes / 1048576).toFixed(2)} MB)`,
    `- source url (expires): ${status.urls[0]}`,
  ]);
  console.log(`\nDownloaded: ${out}\nNow run: kie.mjs verify --job "${dir}"`);
};

commands.verify = async (args) => {
  const dir = jobDir(args);
  const job = loadJob(dir);
  if (!haveFfmpeg()) fail('ffmpeg/ffprobe not found on PATH — needed to build the contact sheet.');
  const video = args.file ? path.resolve(String(args.file)) : path.join(dir, 'out', `${job.slug || 'clip'}.mp4`);
  if (!fs.existsSync(video)) fail(`No video at ${video}`);

  const info = probeVideo(video);
  const sheet = contactSheet(video, path.join(dir, 'out', 'contact-sheet.png'));
  const first = extractFrame(video, path.join(dir, 'out', 'frame-first.png'), { at: 0 });
  const last = extractFrame(video, path.join(dir, 'out', 'frame-last.png'), { fromEnd: true });

  const report = {
    video, ...info,
    contactSheet: sheet.file,
    contactSheetGrid: `${sheet.cols}x${sheet.rows}`,
    secondsPerTile: sheet.secondsPerTile,
    tileTimestamps: sheet.tileTimestamps,
    firstFrame: first, lastFrame: last,
    compareAgainst: {
      first_frame: job.inputs?.first_frame || null,
      last_frame: job.inputs?.last_frame || null,
    },
    durationMatchesRequest: info.duration ? Math.abs(info.duration - Number(job.duration)) < 1 : null,
  };
  writeJson(path.join(dir, 'out', 'verify.json'), report);
  console.log(JSON.stringify(report, null, 2));
  console.log('\nNow read references/verification-checklist.md and judge the contact sheet against it.');
};

commands.run = async (args) => {
  const dir = jobDir(args);
  const job = loadJob(dir);
  validateJob(job, dir);
  if (!args.yes) {
    console.log(JSON.stringify(estimate(job, dir), null, 2));
    fail('Not submitted. Re-run with --yes only after the user has confirmed the cost.');
  }
  if (jobInputs(job, dir).length) await commands.upload({ ...args, job: dir });
  await commands.create({ ...args, job: dir });
  await commands.poll({ ...args, job: dir, task: undefined });
  await commands.verify({ ...args, job: dir });
};

// ---------- entry ----------

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (!cmd || !commands[cmd]) {
  // Usage is the header comment block, so it can never drift from the file.
  const header = [];
  for (const line of fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1)) {
    if (!line.startsWith('//')) break;
    header.push(line.replace(/^\/\/ ?/, ''));
  }
  console.log(header.join('\n'));
  process.exit(cmd ? 1 : 0);
}
commands[cmd](args).catch((err) => fail(err.message));
