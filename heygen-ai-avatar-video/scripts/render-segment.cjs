#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

function usage() {
  console.error(`Usage:
  node render-segment.cjs --project <project-root> --output <out.mp4> [--storyboard storyboard.json] [--composition-id <id>] [--keep-frames]

Renders the current HyperFrames public/index.html with seek-safe video capture and optional storyboard audio mix.`);
}

function parseArgs(argv) {
  const args = { storyboard: 'storyboard.json' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--storyboard') args.storyboard = argv[++i];
    else if (item === '--composition-id') args.compositionId = argv[++i];
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--keep-frames') args.keepFrames = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function loadPlaywright() {
  const candidates = [
    'playwright',
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try next known runtime.
    }
  }
  throw new Error('Could not load Playwright.');
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

function findChrome() {
  const chrome = process.env.CHROMIUM_EXECUTABLE || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || firstExisting([
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ]);
  if (!chrome) throw new Error('Could not find Chrome or Edge.');
  return chrome;
}

function run(command, args) {
  const proc = spawnSync(command, args, { stdio: 'inherit', windowsHide: true });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw new Error(`${path.basename(command)} exited with status ${proc.status}`);
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside project root: ${target}`);
  }
}

function resolveMediaPath(projectDir, publicDir, rel) {
  const normalized = String(rel).replace(/\//g, path.sep);
  const projectCandidate = path.resolve(projectDir, normalized);
  if (fs.existsSync(projectCandidate)) {
    assertInside(projectDir, projectCandidate, 'Media');
    return projectCandidate;
  }
  const publicCandidate = path.resolve(publicDir, normalized);
  assertInside(projectDir, publicCandidate, 'Media');
  return publicCandidate;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.output) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const publicDir = path.join(projectDir, 'public');
  const indexPath = path.join(publicDir, 'index.html');
  const storyboardPath = path.resolve(projectDir, args.storyboard);
  if (!fs.existsSync(indexPath)) throw new Error(`Missing ${indexPath}`);
  if (!fs.existsSync(storyboardPath)) throw new Error(`Missing ${storyboardPath}`);

  const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
  const width = storyboard.composition?.width || 1080;
  const height = storyboard.composition?.height || 1920;
  const fps = storyboard.composition?.fps || 30;
  const duration = storyboard.composition?.durationSeconds || storyboard.durationSeconds;
  if (!duration) throw new Error('Storyboard must include composition.durationSeconds or durationSeconds.');

  const output = path.resolve(projectDir, args.output);
  assertInside(projectDir, output, 'Output');
  const renderName = path.basename(output, path.extname(output));
  const frameDir = path.join(path.dirname(output), `.frames-${renderName}`);
  const audioPath = path.join(path.dirname(output), `.audio-${renderName}.wav`);
  const ffmpeg = findFfmpeg(args.ffmpeg);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });
  fs.rmSync(audioPath, { force: true });

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    executablePath: findChrome(),
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);
  await page.goto(pathToFileURL(indexPath).href, { waitUntil: 'load' });
  const compositionId = args.compositionId || await page.$eval('[data-composition-id]', (el) => el.dataset.compositionId);
  await page.waitForFunction((id) => Boolean(window.__timelines && window.__timelines[id]), compositionId);
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const videos = Array.from(document.querySelectorAll('video'));
    await Promise.all(videos.map((video) => new Promise((resolve) => {
      if (video.readyState >= 1) return resolve();
      video.addEventListener('loadedmetadata', resolve, { once: true });
      setTimeout(resolve, 2000);
    })));
  });

  const totalFrames = Math.ceil(duration * fps);
  console.log(`Capturing ${totalFrames} frames at ${width}x${height}, ${fps}fps`);
  for (let frame = 0; frame < totalFrames; frame += 1) {
    const time = frame / fps;
    await page.evaluate(async ({ id, time }) => {
      const videos = Array.from(document.querySelectorAll('video'));
      const seeks = [];
      for (const video of videos) {
        const start = Number(video.dataset.start || 0);
        const span = Number(video.dataset.duration || video.duration || 0);
        const active = time >= start && time <= start + span;
        if (!active || !Number.isFinite(video.duration) || video.duration <= 0) continue;
        const target = Math.max(0, Math.min(video.duration - 0.01, time - start));
        if (Math.abs(video.currentTime - target) > 0.012) {
          seeks.push(new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              resolve();
            };
            const afterSeek = () => {
              if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(finish);
              else requestAnimationFrame(finish);
            };
            video.addEventListener('seeked', afterSeek, { once: true });
            video.currentTime = target;
            setTimeout(finish, 250);
          }));
        }
      }
      await Promise.all(seeks);
      window.__timelines[id].time(time, false);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, { id: compositionId, time });

    const framePath = path.join(frameDir, `frame_${String(frame + 1).padStart(6, '0')}.jpg`);
    await page.screenshot({ path: framePath, fullPage: false, type: 'jpeg', quality: 92 });
    if ((frame + 1) % 60 === 0 || frame + 1 === totalFrames) console.log(`Captured ${frame + 1}/${totalFrames}`);
  }
  await browser.close();

  const segments = Array.isArray(storyboard.segments) ? storyboard.segments.filter((segment) => segment.audio) : [];
  const encodeInputs = ['-y', '-framerate', String(fps), '-i', path.join(frameDir, 'frame_%06d.jpg')];
  const encodeTail = [
    '-t', Number(duration).toFixed(3),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', String(fps),
    '-movflags', '+faststart',
    output,
  ];

  if (segments.length) {
    const audioArgs = ['-y'];
    const filterParts = [];
    const mixInputs = [];
    segments.forEach((segment, index) => {
      const inputPath = resolveMediaPath(projectDir, publicDir, segment.audio);
      if (!fs.existsSync(inputPath)) throw new Error(`Missing audio: ${inputPath}`);
      audioArgs.push('-i', inputPath);
      const delayMs = Math.round(Number(segment.start || 0) * 1000);
      filterParts.push(`[${index}:a]adelay=${delayMs}:all=1[a${index}]`);
      mixInputs.push(`[a${index}]`);
    });
    const filter = `${filterParts.join(';')};${mixInputs.join('')}amix=inputs=${segments.length}:duration=longest:normalize=0,apad,atrim=0:${Number(duration).toFixed(3)},asetpts=N/SR/TB[a]`;
    audioArgs.push('-filter_complex', filter, '-map', '[a]', '-c:a', 'pcm_s16le', audioPath);
    console.log('Mixing audio');
    run(ffmpeg, audioArgs);
    encodeInputs.push('-i', audioPath);
    encodeTail.splice(encodeTail.length - 1, 0, '-c:a', 'aac', '-b:a', '192k');
  } else {
    encodeTail.splice(encodeTail.length - 1, 0, '-an');
  }

  console.log(`Encoding ${output}`);
  run(ffmpeg, [...encodeInputs, ...encodeTail]);

  if (!args.keepFrames) {
    fs.rmSync(frameDir, { recursive: true, force: true });
    fs.rmSync(audioPath, { force: true });
  }
  console.log(output);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
