#!/usr/bin/env node
// Read-only gate: measures every rendered caption line in an ASS file against the real
// font metrics and fails when a line would run past the usable width.
//
// check-overflow.cjs inspects DOM boxes with Playwright and cannot see burned-in
// captions at all. This is its equivalent for the burn-in branch, and it must pass
// before the encode: after burning, an overflow costs the whole render again.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function usage() {
  console.error(`Usage:
  node audit-caption-width.mjs --ass <captions.ass> --font-file <font.ttf>
      [--size <px>] [--video-width <px>] [--margin-lr <px>]   read from the ASS file when omitted
      [--output <report.json>] [--python python]

Fails (exit 1) when any caption line is wider than the usable width.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--ass') args.ass = argv[++i];
    else if (item === '--font-file') args.fontFile = argv[++i];
    else if (item === '--size') args.size = Number(argv[++i]);
    else if (item === '--video-width') args.videoWidth = Number(argv[++i]);
    else if (item === '--margin-lr') args.marginLr = Number(argv[++i]);
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--python') args.python = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function parseAss(text) {
  const playResX = Number((text.match(/^PlayResX:\s*(\d+)/m) || [])[1]) || null;

  // Read the styles Format: line rather than trusting column positions — the field
  // order is declared per file and guessing it silently mis-reads the font size.
  const formatLine = text.match(/^\[V4\+? Styles\][\s\S]*?^Format:\s*(.+)$/m);
  const styleLine = text.match(/^Style:\s*(.+)$/m);
  let size = null;
  let marginLr = null;
  if (formatLine && styleLine) {
    const columns = formatLine[1].split(',').map((field) => field.trim().toLowerCase());
    const fields = styleLine[1].split(',').map((field) => field.trim());
    const pick = (name) => {
      const index = columns.indexOf(name);
      if (index < 0) return null;
      const value = Number(fields[index]);
      return Number.isFinite(value) ? value : null;
    };
    size = pick('fontsize');
    marginLr = pick('marginl') ?? pick('marginr');
  }

  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.startsWith('Dialogue:')) continue;
    const parts = raw.split(',');
    const start = parts[1];
    const body = parts.slice(9).join(',');
    const stripped = body.replace(/\{[^}]*\}/g, '');
    for (const piece of stripped.split('\\N')) {
      if (piece.trim()) lines.push({ start, text: piece });
    }
  }
  return { playResX, size, marginLr, lines };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.ass || !args.fontFile) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const assPath = path.resolve(args.ass);
  const fontFile = path.resolve(args.fontFile);
  if (!fs.existsSync(assPath)) throw new Error(`Missing ASS file: ${assPath}`);
  if (!fs.existsSync(fontFile)) throw new Error(`Missing font file: ${fontFile}`);

  const parsed = parseAss(fs.readFileSync(assPath, 'utf8'));
  const size = args.size || parsed.size;
  const videoWidth = args.videoWidth || parsed.playResX;
  const marginLr = args.marginLr ?? parsed.marginLr;
  if (!size || !videoWidth || marginLr === null || marginLr === undefined) {
    throw new Error('Could not determine size/width/margin. Pass --size, --video-width and --margin-lr.');
  }

  const usableWidth = videoWidth - 2 * marginLr;
  const python = args.python || process.env.PYTHON_PATH || 'python';
  const proc = spawnSync(python, [path.join(HERE, 'lib', 'measure_text.py'), fontFile, String(size)], {
    input: JSON.stringify(parsed.lines.map((line) => line.text)),
    encoding: 'utf8',
    windowsHide: true,
  });
  if (proc.status !== 0) throw new Error(proc.stderr || 'measure_text.py failed');
  const widths = JSON.parse(proc.stdout);

  const overflow = [];
  let widest = 0;
  parsed.lines.forEach((line, index) => {
    const width = widths[index];
    if (width > widest) widest = width;
    if (width > usableWidth) {
      overflow.push({ start: line.start, text: line.text, widthPx: Math.round(width) });
    }
  });

  const report = {
    ok: overflow.length === 0,
    ass: assPath,
    fontFile,
    sizePx: size,
    usableWidthPx: usableWidth,
    widestLinePx: Math.round(widest),
    linesChecked: parsed.lines.length,
    overflow,
    recommendation: overflow.length
      ? 'Reduce --size, widen the wrap by lowering --margin-lr, or split the chunk with \\N.'
      : null,
  };

  if (args.output) {
    const output = path.resolve(args.output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    report.reportPath = output;
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
