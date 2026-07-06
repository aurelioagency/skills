#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function usage() {
  console.error(`Usage:
  node check-overflow.cjs --project <project-root> --at <time[,time...]> [--composition-id <id>] [--width 1080] [--height 1920] [--out snapshots/overflow-report.json]

Checks visible DOM boxes for off-frame content and clipped text.`);
}

function parseArgs(argv) {
  const args = { width: 1080, height: 1920, out: 'snapshots/overflow-report.json' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--at') args.at = argv[++i];
    else if (item === '--composition-id') args.compositionId = argv[++i];
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

const allowOverflowSelectors = [
  'html',
  'body',
  '#stage',
  'script',
  'style',
  'video',
  'audio',
  '.avatar-shade',
  '.bg-grid',
  '.ambient',
  '[data-layout-allow-overflow]',
  '[data-layout-allow-occlusion]',
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.at) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const publicIndex = path.join(projectDir, 'public', 'index.html');
  if (!fs.existsSync(publicIndex)) throw new Error(`Missing ${publicIndex}`);
  const reportPath = path.resolve(projectDir, args.out);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const times = String(args.at).split(',').map(Number).filter(Number.isFinite);
  if (!times.length) throw new Error('No valid --at timestamps.');

  const { chromium } = loadPlaywright();
  const executablePath = process.env.CHROMIUM_EXECUTABLE || firstExisting([
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
  await page.goto(pathToFileURL(publicIndex).href, { waitUntil: 'load' });
  const compositionId = args.compositionId || await page.$eval('[data-composition-id]', (el) => el.dataset.compositionId);
  await page.waitForFunction((id) => Boolean(window.__timelines && window.__timelines[id]), compositionId);
  await page.waitForTimeout(300);

  const reports = [];
  for (const time of times) {
    const result = await page.evaluate(async ({ id, t, allowSelectors, width, height }) => {
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

      const tolerance = 2;
      const scene = Array.from(document.querySelectorAll('.motion-scene,.scene')).find((el) => {
        const start = Number(el.dataset.start || 0);
        const duration = Number(el.dataset.duration || 0);
        return t >= start && t <= start + duration;
      });
      const issues = [];

      function isEffectivelyVisible(el) {
        let node = el;
        while (node && node.nodeType === 1) {
          const nodeStyle = getComputedStyle(node);
          if (nodeStyle.display === 'none' || nodeStyle.visibility === 'hidden' || Number(nodeStyle.opacity) <= 0.01) return false;
          node = node.parentElement;
        }
        return true;
      }

      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (allowSelectors.some((selector) => el.matches(selector))) continue;
        const parentScene = el.closest('.motion-scene,.scene');
        if (scene && parentScene && parentScene !== scene) continue;
        const style = getComputedStyle(el);
        if (!isEffectivelyVisible(el)) continue;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        if (rect.right < 0 || rect.left > width || rect.bottom < 0 || rect.top > height) continue;

        const outOfFrame = rect.left < -tolerance || rect.top < -tolerance || rect.right > width + tolerance || rect.bottom > height + tolerance;
        const tag = el.tagName.toLowerCase();
        const isTextElement = ['p', 'h1', 'h2', 'h3', 'span', 'strong', 'b', 'code', 'pre', 'div'].includes(tag);
        const horizontalScrollOverflow = isTextElement && el.scrollWidth > el.clientWidth + 8;
        const verticalClippedOverflow =
          isTextElement &&
          el.scrollHeight > el.clientHeight + 16 &&
          (style.overflowY === 'hidden' || style.overflowY === 'clip' || style.overflow === 'hidden' || style.overflow === 'clip');
        if (!outOfFrame && !horizontalScrollOverflow && !verticalClippedOverflow) continue;

        issues.push({
          tag,
          id: el.id || null,
          className: String(el.className || ''),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          outOfFrame,
          horizontalScrollOverflow,
          verticalClippedOverflow,
        });
      }

      return { time: t, sceneId: scene ? scene.id || null : null, issues };
    }, { id: compositionId, t: time, allowSelectors: allowOverflowSelectors, width: args.width, height: args.height });
    reports.push(result);
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(reports, null, 2)}\n`, 'utf8');
  await browser.close();

  const issueCount = reports.reduce((sum, report) => sum + report.issues.length, 0);
  console.log(JSON.stringify({ ok: issueCount === 0, reportPath, checked: reports.length, issueCount }, null, 2));
  if (issueCount) process.exit(2);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
