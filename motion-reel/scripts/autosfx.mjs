// Branch B: turn the sound cues the animation kit registered (window.OV_CUES, from OV.slam / cutIn / pop / typeOn /
// draw / odometer / cursor) into timeline.json "sfx" entries, so every sound sits on the frame its visual lands.
//   node scripts/autosfx.mjs            (then: node scripts/sync.mjs && node scripts/sfx.mjs)
// Entries it writes carry "auto": true and are replaced on every run; hand-written entries (no "auto") are kept.
// The kind → sound map below is the house sound (reference/AUDIO.md §2). Change it here, not per cue.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HOUSE = {
  word:   { file: 'lib:loucash/clic_palabra_loucash.wav', gain: 0.18 },   // a key word / text slams or cuts in
  screen: { file: 'lib:loucash/clic_palabra_loucash.wav', gain: 0.14 },    // a screen, screenshot or card appears
  icon:   { type: 'bubble', gain: 0.14 },                                  // an icon pops in (runs climb in pitch)
  click:  { type: 'click', gain: 0.17 },                                    // the cursor clicks
  type:   { type: 'tick', gain: 0.11 },                                    // typing / a rolling counter
  whoosh: { type: 'whoosh', gain: 0.3, align: 'peak' },                    // a big move into a cutaway (use sparingly)
};
const RUN = [1, 1.12, 1.26, 1.41, 1.58];   // bubble pitches for icons landing within 0.45 s of each other

const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exitCode = 1; });
await page.goto(pathToFileURL(path.join(ROOT, 'film/index.html')).href + '?fmt=9x16');
await page.waitForFunction(() => window.OV_CUES && window.READY, null, { timeout: 60000 });
const cues = await page.evaluate(() => window.OV_CUES);
const timing = await page.evaluate(() => (window.OV_TIMING ? window.OV_TIMING() : null));
await browser.close();

const TL = JSON.parse(fs.readFileSync('timeline.json', 'utf8'));
const keep = (TL.sfx || []).filter((e) => !e.auto);
const auto = [];
let lastIcon = -9, run = 0;
for (const c of cues.slice().sort((a, b) => a.at - b.at)) {
  const h = HOUSE[c.kind];
  if (!h) { console.warn(`WARN: unknown cue kind "${c.kind}" at ${c.at}s — skipped`); continue; }
  const e = { at: c.at, ...h, gain: c.gain ?? h.gain, auto: true, what: `${c.kind}${c.what ? ': ' + c.what : ''}` };
  if (c.kind === 'icon') { run = c.at - lastIcon < 0.45 ? Math.min(run + 1, RUN.length - 1) : 0; lastIcon = c.at; e.pitch = RUN[run]; }
  if (c.kind === 'type') { const to = c.to ?? c.at + 0.5; e.to = to; e.every = Math.max(0.05, +((to - c.at) / 14).toFixed(3)); }
  auto.push(e);
}
// two sounds on the very same frame mask each other: keep the first, drop exact duplicates
const seen = new Set(), dedup = auto.filter((e) => { const k = `${e.at}|${e.type || e.file}`; if (seen.has(k)) return false; seen.add(k); return true; });
// --timing <file>: the film's animation onsets and Aurelio closes, for the pipeline's opening / close checks
const timingIndex = process.argv.indexOf('--timing');
if (timingIndex >= 0) {
  const file = process.argv[timingIndex + 1];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ cues: cues.map((c) => ({ at: c.at, kind: c.kind, what: c.what })), ...(timing || { missing: true }) }, null, 2));
}
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0) {
  const output = process.argv[outputIndex + 1];
  if (!output || output.startsWith('--')) throw new Error('--output requires a path');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(dedup, null, 2));
  console.log(`${output}: ${dedup.length} auto cues (timeline unchanged)`);
} else {
  TL.sfx = [...keep, ...dedup];
  fs.writeFileSync('timeline.json', JSON.stringify(TL, null, 2));
  console.log(`timeline.sfx: ${keep.length} hand-written + ${dedup.length} auto`);
}
for (const e of dedup) console.log(`  ${String(e.at).padStart(6)}s  ${(e.file || e.type).padEnd(38)} gain ${e.gain}${e.pitch ? ' pitch ' + e.pitch : ''}${e.every ? ' every ' + e.every + 's → ' + e.to : ''}  ${e.what}`);
