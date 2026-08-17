#!/usr/bin/env node
// Puts a caption font inside the project, so the burn always uses a frozen file
// instead of whatever happens to be installed on the machine that day.
//
// Without this, the burn-in branch dead-ends on a fresh machine: the scripts require
// --font-file and nothing tells you where a font comes from. --system solves that
// offline on any OS by picking the heaviest readable sans already present.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFontFamily } from './lib/font-name.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_DIR = path.resolve(HERE, '..', 'assets', 'fonts');

// Shipped with the skill, all under the SIL Open Font License, so a caption looks the
// same on every machine instead of inheriting whatever that OS happens to install.
// Ordered best-first; the first entry is the default.
const BUNDLED = [
  ['Inter-Black.ttf', 'Inter Black — neutral modern grotesque. The default.'],
  ['ArchivoBlack-Regular.ttf', 'Archivo Black — wider and heavier, more shout per word.'],
  ['Anton-Regular.ttf', 'Anton — condensed heavy, the classic social-caption look.'],
  ['BebasNeue-Regular.ttf', 'Bebas Neue — tall condensed caps, fits long words on one line.'],
];

function usage() {
  console.error(`Usage:
  node freeze-caption-font.mjs --project <project>
  node freeze-caption-font.mjs --project <project> --bundled <name>
  node freeze-caption-font.mjs --project <project> --system
  node freeze-caption-font.mjs --project <project> --source <font.ttf | https://.../font.ttf>
      [--output "assets/fonts/<name>"]   defaults to assets/fonts/<original filename>
      [--list]                           show bundled and system candidates, then exit

(no flag)  freezes the skill's default bundled font, ${BUNDLED[0][0]}.
--bundled  picks another bundled font by name, e.g. --bundled anton.
--system   copies the best caption font already installed on this machine instead.
--source   freezes a specific font file or direct font URL (no zip archives).

Caption fonts want a heavy weight: at 104px a Regular reads thin against video.`);
}

function bundledFonts() {
  return BUNDLED
    .map(([file, why]) => ({ file: path.join(BUNDLED_DIR, file), why }))
    .filter((entry) => fs.existsSync(entry.file));
}

function pickBundled(name) {
  const available = bundledFonts();
  if (!available.length) throw new Error(`No bundled fonts found in ${BUNDLED_DIR}`);
  if (!name) return available[0];
  const needle = name.toLowerCase().replace(/[^a-z]/g, '');
  const hit = available.find((entry) => path.basename(entry.file).toLowerCase().replace(/[^a-z]/g, '').includes(needle));
  if (!hit) {
    throw new Error(
      `No bundled font matches "${name}". Available: ${available.map((e) => path.basename(e.file)).join(', ')}`,
    );
  }
  return hit;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--source') args.source = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--system') args.system = true;
    else if (item === '--bundled') args.bundled = argv[++i];
    else if (item === '--list') args.list = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function fontDirectories() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return [
      path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts'),
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows', 'Fonts'),
    ].filter(Boolean);
  }
  if (process.platform === 'darwin') {
    return [
      '/System/Library/Fonts',
      '/System/Library/Fonts/Supplemental',
      '/Library/Fonts',
      path.join(home, 'Library', 'Fonts'),
    ];
  }
  return [
    '/usr/share/fonts',
    '/usr/local/share/fonts',
    path.join(home, '.fonts'),
    path.join(home, '.local', 'share', 'fonts'),
  ];
}

// Ordered best-first. Heavy grotesques win: they hold up against moving video at
// caption size, which is the whole job here.
const PREFERENCES = [
  [/^inter[-_ ]?black/i, 'Inter Black — the font this skill\'s guidelines prefer'],
  [/^inter[-_ ]?extrabold/i, 'Inter ExtraBold'],
  [/^inter[-_ ]?bold/i, 'Inter Bold'],
  [/montserrat[-_ ]?(black|extrabold)/i, 'Montserrat heavy'],
  [/poppins[-_ ]?(black|extrabold)/i, 'Poppins heavy'],
  [/^seguibl/i, 'Segoe UI Black — heaviest sans shipped with Windows'],
  [/^ariblk|arial[-_ ]?black/i, 'Arial Black'],
  [/^impact/i, 'Impact — condensed, the classic social-caption look'],
  [/^arialbd|arial[-_ ]?bold/i, 'Arial Bold'],
  [/helvetica.*(black|bold)/i, 'Helvetica heavy'],
  [/dejavusans[-_ ]?bold/i, 'DejaVu Sans Bold — usual heaviest sans on Linux'],
  [/liberationsans[-_ ]?bold/i, 'Liberation Sans Bold'],
  [/notosans[-_ ]?bold/i, 'Noto Sans Bold'],
];

function walk(dir, depth, out) {
  if (depth < 0) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, depth - 1, out);
    else if (/\.(ttf|otf)$/i.test(entry.name)) out.push(full);
  }
}

function rankSystemFonts() {
  const files = [];
  for (const dir of fontDirectories()) walk(dir, 2, files);

  const ranked = [];
  for (const file of files) {
    const base = path.basename(file);
    const index = PREFERENCES.findIndex(([pattern]) => pattern.test(base));
    if (index >= 0) ranked.push({ file, rank: index, why: PREFERENCES[index][1] });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.file.localeCompare(b.file));
  return ranked;
}

async function fetchToFile(url, target) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  const buf = Buffer.from(await response.arrayBuffer());
  // A zip or an HTML error page would sail through as a "font" and only fail much
  // later, inside ffmpeg, with a useless message.
  const signature = buf.subarray(0, 4).toString('latin1');
  const ok = signature === '\x00\x01\x00\x00' || signature === 'OTTO' || signature === 'true' || signature === 'ttcf';
  if (!ok) throw new Error(`Not a TTF/OTF file (got ${JSON.stringify(signature)}). Point --source at a direct font file, not an archive or a web page.`);
  fs.writeFileSync(target, buf);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.list && !args.project)) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  if (args.list) {
    const ranked = rankSystemFonts();
    const bundled = bundledFonts();
    console.log(JSON.stringify({
      ok: bundled.length > 0 || ranked.length > 0,
      platform: process.platform,
      bundled: bundled.map((entry, index) => ({
        name: path.basename(entry.file),
        why: entry.why,
        default: index === 0,
      })),
      systemSearched: fontDirectories(),
      systemCandidates: ranked.slice(0, 10).map((c) => ({ file: c.file, why: c.why })),
    }, null, 2));
    process.exit(bundled.length || ranked.length ? 0 : 1);
  }

  const project = path.resolve(args.project);
  let sourceLabel;
  let why;
  let tempSource = null;
  let sourceFile;
  // The frozen file keeps the font's own name; the temp download name never leaks
  // into the project.
  let preferredName = null;

  if (args.source && /^https?:\/\//i.test(args.source)) {
    preferredName = decodeURIComponent(path.basename(new URL(args.source).pathname)) || 'caption-font.ttf';
    tempSource = path.join(os.tmpdir(), `caption-font-${Date.now()}-${preferredName}`);
    await fetchToFile(args.source, tempSource);
    sourceFile = tempSource;
    sourceLabel = args.source;
    why = 'downloaded from an explicit URL';
  } else if (args.source) {
    sourceFile = path.resolve(args.source);
    if (!fs.existsSync(sourceFile)) throw new Error(`Missing font file: ${sourceFile}`);
    sourceLabel = sourceFile;
    why = 'explicit local file';
  } else if (!args.system) {
    const chosen = pickBundled(args.bundled);
    sourceFile = chosen.file;
    sourceLabel = `bundled: ${path.basename(chosen.file)}`;
    why = chosen.why;
  } else {
    const ranked = rankSystemFonts();
    if (!ranked.length) {
      throw new Error(
        'No usable caption font found on this machine.\n'
        + 'Install a heavy sans (Inter Black is what the guidelines prefer, from '
        + 'https://github.com/rsms/inter/releases), then re-run, or pass --source <font.ttf>.',
      );
    }
    sourceFile = ranked[0].file;
    sourceLabel = sourceFile;
    why = ranked[0].why;
  }

  const family = readFontFamily(sourceFile);
  const outputName = preferredName || path.basename(sourceFile);
  const output = path.resolve(project, args.output || path.join('assets', 'fonts', outputName));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(sourceFile, output);
  if (tempSource) fs.rmSync(tempSource, { force: true });

  // Bundled fonts ship with their licence file; copy it next to the frozen font so the
  // project carries its own proof. Anything else has unverified redistribution rights.
  const bundledLicence = path.join(BUNDLED_DIR, `${path.basename(sourceFile, path.extname(sourceFile))}.LICENSE.txt`);
  let licence = 'UNVERIFIED — check the font licence before publishing or redistributing.';
  if (!args.system && !args.source && fs.existsSync(bundledLicence)) {
    fs.copyFileSync(bundledLicence, `${output}.LICENSE.txt`);
    licence = 'SIL Open Font License 1.1 — licence text copied next to the font.';
  }

  // Same provenance discipline the skill applies to background music: record where
  // the asset came from and under what terms.
  const record = {
    file: path.relative(project, output).split(path.sep).join('/'),
    fontFamily: family,
    source: sourceLabel,
    why,
    frozenAt: new Date().toISOString(),
    licence,
  };
  fs.writeFileSync(`${output}.source.json`, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    ...record,
    // Pass this exact path on; the family name is read from the file, never guessed.
    nextStep: `node build-burn-in-captions.mjs --font-file "${output}" ...`,
  }, null, 2));
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
