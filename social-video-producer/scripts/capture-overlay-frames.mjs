#!/usr/bin/env node
// Captures animated overlay frames (text cards, step lists, punch text) described by
// manifests/overlays.json, using the bundled overlay-template.html. No paid providers.
// Frames are transparent PNGs meant to be composited by composite-overlays.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.dirname(HERE);

function usage() {
  console.error(`Usage:
  node capture-overlay-frames.mjs --project <project-root> [--overlays manifests/overlays.json] [--font <path>]

Reads the overlay timeline and captures each item's animation frames into
renders/overlay-frames/<item-id>/.`);
}

function parseArgs(argv) {
  const args = { overlays: 'manifests/overlays.json' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--overlays') args.overlays = argv[++i];
    else if (item === '--font') args.font = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function findChrome() {
  const candidates = [
    process.env.CHROMIUM_EXECUTABLE,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('Could not find Chrome or Edge.');
}

function loadPlaywright() {
  const req = createRequire(path.join(SKILL_ROOT, 'scripts', 'capture-overlay-frames.mjs'));
  return req('playwright');
}

async function shoot(page, p) {
  await page.screenshot({ path: p, omitBackground: true });
}

async function captureTextCard(page, dir, config) {
  const FPS = 30;
  fs.mkdirSync(dir, { recursive: true });
  const wordCount = config.lines.reduce((a, l) => a + l.length, 0);
  const enterDur = await page.evaluate((n) => window.__textcardEnterDur(n), wordCount);
  const exitDur = await page.evaluate(() => window.__EXIT_DUR);
  const enterFrames = Math.ceil(enterDur * FPS);
  const exitFrames = Math.ceil(exitDur * FPS);

  await page.evaluate((cfg) => {
    window.__textcardSet(cfg);
    window.__textcardShow();
    window.__textcardReset();
  }, config);

  for (let f = 0; f < enterFrames; f += 1) {
    await page.evaluate((t) => window.__textcardEnter(t), f / FPS);
    await shoot(page, path.join(dir, `enter_${String(f + 1).padStart(3, '0')}.png`));
  }
  await page.evaluate((t) => window.__textcardEnter(t), enterDur + 0.05);
  await shoot(page, path.join(dir, 'hold.png'));
  for (let f = 0; f < exitFrames; f += 1) {
    await page.evaluate((t) => window.__textcardExit(t), f / FPS);
    await shoot(page, path.join(dir, `exit_${String(f + 1).padStart(3, '0')}.png`));
  }
  await page.evaluate(() => window.__textcardHide());
  return { kind: 'enter-hold-exit', fps: FPS, enterFrames, exitFrames, enterDur, exitDur };
}

async function capturePunch(page, dir, config) {
  const FPS = 30;
  fs.mkdirSync(dir, { recursive: true });
  const durations = await page.evaluate(() => window.__PUNCH_DUR);
  const enterFrames = Math.ceil(durations.ENTER * FPS);
  const exitFrames = Math.ceil(durations.EXIT * FPS);
  await page.evaluate((cfg) => { window.__punchSet(cfg); window.__punchShow(); }, config);
  for (let f = 0; f < enterFrames; f += 1) {
    await page.evaluate((t) => window.__punchEnter(t), f / FPS);
    await shoot(page, path.join(dir, `enter_${String(f + 1).padStart(3, '0')}.png`));
  }
  await page.evaluate((t) => window.__punchEnter(t), durations.ENTER + 0.05);
  await shoot(page, path.join(dir, 'hold.png'));
  for (let f = 0; f < exitFrames; f += 1) {
    await page.evaluate((t) => window.__punchExit(t), f / FPS);
    await shoot(page, path.join(dir, `exit_${String(f + 1).padStart(3, '0')}.png`));
  }
  await page.evaluate(() => window.__punchHide());
  return { kind: 'enter-hold-exit', fps: FPS, enterFrames, exitFrames, enterDur: durations.ENTER, exitDur: durations.EXIT };
}

async function captureSteplist(page, dir, config) {
  const FPS = 20;
  fs.mkdirSync(dir, { recursive: true });
  const duration = Number(config.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`steplist "${config.id}" needs a numeric duration`);
  const exitDur = 0.3;
  await page.evaluate((cfg) => {
    window.__steplistSet(cfg);
    window.__steplistShow();
    window.__steplistReset();
  }, config);
  const totalFrames = Math.ceil(duration * FPS);
  for (let f = 0; f < totalFrames; f += 1) {
    const t = f / FPS;
    await page.evaluate((t) => window.__steplistFrame(t), t);
    await shoot(page, path.join(dir, `f_${String(f + 1).padStart(4, '0')}.png`));
  }
  const exitFrames = Math.ceil(exitDur * FPS);
  for (let f = 0; f < exitFrames; f += 1) {
    await page.evaluate((t) => window.__steplistExit(t), f / FPS);
    await shoot(page, path.join(dir, `x_${String(f + 1).padStart(3, '0')}.png`));
  }
  return { kind: 'continuous-plus-exit', fps: FPS, totalFrames, exitFrames, duration, exitDur };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project) { usage(); process.exit(args.help ? 0 : 2); }

  const projectDir = path.resolve(args.project);
  const overlaysPath = path.resolve(projectDir, args.overlays);
  if (!fs.existsSync(overlaysPath)) throw new Error(`Missing ${overlaysPath}`);
  const overlays = JSON.parse(fs.readFileSync(overlaysPath, 'utf8'));

  const fontSrc = args.font
    ? path.resolve(args.font)
    : path.join(projectDir, 'assets', 'fonts', 'Inter-Black.ttf');
  if (!fs.existsSync(fontSrc)) throw new Error(`Missing font: ${fontSrc}. Freeze one with freeze-caption-font.mjs first.`);

  const templateSrc = fs.readFileSync(path.join(SKILL_ROOT, 'assets', 'overlay-template.html'), 'utf8');
  const framesRoot = path.join(projectDir, 'renders', 'overlay-frames');
  const tmpHtml = path.join(framesRoot, '_template.html');
  fs.mkdirSync(framesRoot, { recursive: true });
  const fontUrl = pathToFileURL(fontSrc).href;
  fs.writeFileSync(tmpHtml, templateSrc.replace('__FONT_URL__', fontUrl));

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true, executablePath: findChrome() });
  const page = await browser.newPage({
    viewport: { width: overlays.width || 1920, height: overlays.height || 1080 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'load' });
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });

  const manifest = {};
  for (const item of overlays.items) {
    const dir = path.join(framesRoot, item.id);
    fs.rmSync(dir, { recursive: true, force: true });
    let result;
    if (item.type === 'textcard') result = await captureTextCard(page, dir, item);
    else if (item.type === 'punch') result = await capturePunch(page, dir, item);
    else if (item.type === 'steplist') result = await captureSteplist(page, dir, item);
    else throw new Error(`Unknown overlay type "${item.type}" for item "${item.id}"`);
    manifest[item.id] = { dir: path.relative(projectDir, dir), start: item.start, ...result };
    console.log(item.id, JSON.stringify(result));
  }

  await browser.close();
  fs.rmSync(tmpHtml, { force: true });
  fs.writeFileSync(path.join(framesRoot, 'capture-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('capture-manifest written to', path.join(framesRoot, 'capture-manifest.json'));
}

main().catch((err) => { console.error(err.stack || err.message); process.exit(1); });
