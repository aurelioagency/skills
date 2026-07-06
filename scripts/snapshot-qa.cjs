#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function usage() {
  console.error(`Usage:
  node snapshot-qa.cjs --project <project-root> --at <time[,time...]> [--composition-id <id>] [--variant <label>] [--width 1080] [--height 1920] [--out snapshots]

Captures exact timeline frames for visual QA.`);
}

function parseArgs(argv) {
  const args = { width: 1080, height: 1920, out: 'snapshots', variant: 'qa' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--at') args.at = argv[++i];
    else if (item === '--composition-id') args.compositionId = argv[++i];
    else if (item === '--variant') args.variant = argv[++i];
    else if (item === '--width') args.width = Number(argv[++i]);
    else if (item === '--height') args.height = Number(argv[++i]);
    else if (item === '--out') args.out = argv[++i];
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
      // Try next local runtime path.
    }
  }
  throw new Error('Could not load Playwright.');
}

function firstExisting(items) {
  return items.find((item) => item && fs.existsSync(item));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.at) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const publicIndex = path.join(projectDir, 'public', 'index.html');
  if (!fs.existsSync(publicIndex)) throw new Error(`Missing ${publicIndex}`);
  const snapshotDir = path.resolve(projectDir, args.out);
  fs.mkdirSync(snapshotDir, { recursive: true });
  const times = String(args.at).split(',').map(Number).filter(Number.isFinite);
  if (!times.length) throw new Error('No valid --at timestamps.');

  const { chromium } = loadPlaywright();
  const executablePath = process.env.CHROMIUM_EXECUTABLE || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || firstExisting([
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ]);
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: args.width, height: args.height }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);
  if (process.env.SNAPSHOT_DEBUG) {
    page.on('console', (msg) => console.error(`[browser:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (error) => console.error(`[browser:error] ${error.message}`));
  }
  await page.goto(pathToFileURL(publicIndex).href, { waitUntil: 'load' });
  const compositionId = args.compositionId || await page.$eval('[data-composition-id]', (el) => el.dataset.compositionId);
  await page.waitForFunction((id) => Boolean(window.__timelines && window.__timelines[id]), compositionId);
  await page.waitForTimeout(300);

  const outputs = [];
  for (const time of times) {
    await page.evaluate(async ({ id, t }) => {
      const videos = Array.from(document.querySelectorAll('video'));
      await Promise.all(videos.map((video) => new Promise((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.addEventListener('loadedmetadata', resolve, { once: true });
        setTimeout(resolve, 1000);
      })));
      for (const video of videos) {
        const start = Number(video.dataset.start || 0);
        const duration = Number(video.dataset.duration || video.duration || 0);
        if (t >= start && t <= start + duration && Number.isFinite(video.duration)) {
          video.currentTime = Math.max(0, Math.min(video.duration - 0.08, t - start));
        }
      }
      window.__timelines[id].time(t, false);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, { id: compositionId, t: time });
    const safeTime = String(time.toFixed(3)).replace('.', 'p');
    const safeVariant = String(args.variant).replace(/[^a-z0-9_-]+/gi, '-');
    const out = path.join(snapshotDir, `${safeVariant}-${safeTime}s.png`);
    await page.screenshot({ path: out, fullPage: false });
    outputs.push(out);
    console.log(out);
  }

  await browser.close();
  console.log(JSON.stringify({ ok: true, outputs }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
