#!/usr/bin/env node
// Builds an ASS subtitle file from an approved word-level transcript, for burning
// captions into video that already exists (see the Burn-In Captions branch in SKILL.md).
//
// Two things this script exists to get right, because both cost a render cycle otherwise:
//   1. The font family name comes from the TTF's own name table, not from the file name.
//      libass falls back to some other font silently when the family does not match.
//   2. Line breaks are explicit. libass stops wrapping on margins once an event carries
//      \pos or \move, so width is measured against the real font and \N is inserted.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function usage() {
  console.error(`Usage:
  node build-burn-in-captions.mjs --transcript <words.json> --output <captions.ass> --font-file <font.ttf>
      [--font-name "<family>"]        auto-detected from the TTF name table when omitted
      [--size 104] [--outline 7] [--shadow 5]
      [--primary "#FFFFFF"] [--accent "#30D5FF"]
      [--video-width 1080] [--video-height 1920]
      [--margin-lr 120] [--margin-bottom 500]
      [--reveal chunk|word] [--max-words 2] [--gap-cut 0.35] [--hold 0.45]
      [--accent-terms "Fable,Haiku,Sonnet"]   chunk mode: which words get the accent colour
      [--corrections <corrections.json>]      [{ "at": 4.72, "from": "puedes", "to": "podés" }]
      [--python python]

reveal=chunk  the whole chunk enters at once, always centred, never reflows (default)
reveal=word   words appear one at a time; the chunk reserves its full width, so a
              lone first word renders off-centre. See Caption Reveal in the guidelines.`);
}

function parseArgs(argv) {
  const args = {};
  const numeric = new Set([
    '--size', '--outline', '--shadow', '--video-width', '--video-height',
    '--margin-lr', '--margin-bottom', '--max-words', '--gap-cut', '--hold',
    '--fade-ms', '--rise-px', '--rise-ms',
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--help' || item === '-h') { args.help = true; continue; }
    if (!item.startsWith('--')) throw new Error(`Unknown argument: ${item}`);
    const key = item.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = argv[++i];
    args[key] = numeric.has(item) ? Number(value) : value;
  }
  return args;
}

// --- TTF name table ---------------------------------------------------------
// Reads nameID 1 (font family). The file name is not the family name: Inter-Black.ttf
// declares "Inter Black", and asking libass for "Inter" silently renders a fallback.
function readFontFamily(fontFile) {
  const buf = fs.readFileSync(fontFile);
  const numTables = buf.readUInt16BE(4);
  let nameOffset = null;
  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + i * 16;
    if (buf.toString('latin1', record, record + 4) === 'name') {
      nameOffset = buf.readUInt32BE(record + 8);
      break;
    }
  }
  if (nameOffset === null) throw new Error(`No name table in font: ${fontFile}`);

  const count = buf.readUInt16BE(nameOffset + 2);
  const storage = nameOffset + buf.readUInt16BE(nameOffset + 4);
  let fallback = null;
  for (let i = 0; i < count; i += 1) {
    const rec = nameOffset + 6 + i * 12;
    const platformId = buf.readUInt16BE(rec);
    const nameId = buf.readUInt16BE(rec + 6);
    if (nameId !== 1) continue;
    const length = buf.readUInt16BE(rec + 8);
    const offset = storage + buf.readUInt16BE(rec + 10);
    const slice = buf.subarray(offset, offset + length);
    const value = platformId === 3 ? slice.swap16().toString('utf16le') : slice.toString('latin1');
    if (platformId === 3) return value;
    fallback = fallback || value;
  }
  if (!fallback) throw new Error(`No family name (nameID 1) in font: ${fontFile}`);
  return fallback;
}

// --- colours ----------------------------------------------------------------
// ASS stores colour as &HBBGGRR& — the reverse of CSS hex. Getting this backwards
// turns cyan into orange, which is easy to miss on a warm-toned frame.
function assColour(hex) {
  const value = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Expected #RRGGBB, got: ${hex}`);
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  return `&H${b}${g}${r}`.toUpperCase() + '&';
}

function assStyleColour(hex) {
  return `&H00${assColour(hex).slice(2, 8)}`;
}

// --- transcript -------------------------------------------------------------
function loadWords(transcriptPath, correctionsPath) {
  const data = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  const words = (data.segments
    ? data.segments.flatMap((segment) => segment.words || [])
    : data.words || []).map((word) => ({ ...word }));
  if (!words.length) throw new Error(`No word-level timings in ${transcriptPath}`);

  if (correctionsPath) {
    const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
    for (const fix of corrections) {
      const hit = words.find((w) => Math.abs(w.start - fix.at) < 0.02 && w.word === fix.from);
      // Fail loud: a correction that silently does not apply ships the wrong caption.
      if (!hit) throw new Error(`Correction did not apply: "${fix.from}" at ${fix.at}s`);
      hit.word = fix.to;
    }
  }
  return words;
}

function chunkWords(words, maxWords, gapCut) {
  const chunks = [];
  let current = [];
  for (const word of words) {
    if (current.length) {
      const prev = current[current.length - 1];
      const endsSentence = /[.!?]$/.test(prev.word);
      if (current.length >= maxWords || word.start - prev.end > gapCut || endsSentence) {
        chunks.push(current);
        current = [];
      }
    }
    current.push(word);
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function measure(python, fontFile, size, lines) {
  if (!lines.length) return [];
  const proc = spawnSync(python, [path.join(HERE, 'lib', 'measure_text.py'), fontFile, String(size)], {
    input: JSON.stringify(lines),
    encoding: 'utf8',
    windowsHide: true,
  });
  if (proc.status !== 0) throw new Error(proc.stderr || 'measure_text.py failed');
  return JSON.parse(proc.stdout);
}

function timestamp(seconds) {
  const t = Math.max(0, seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.transcript || !args.output || !args.fontFile) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const fontFile = path.resolve(args.fontFile);
  if (!fs.existsSync(fontFile)) throw new Error(`Missing font file: ${fontFile}`);
  const detectedFamily = readFontFamily(fontFile);
  const fontName = args.fontName || detectedFamily;

  const size = args.size || 104;
  const videoWidth = args.videoWidth || 1080;
  const videoHeight = args.videoHeight || 1920;
  const marginLr = args.marginLr ?? 120;
  const marginBottom = args.marginBottom ?? 500;
  const outline = args.outline ?? 7;
  const shadow = args.shadow ?? 5;
  const primary = args.primary || '#FFFFFF';
  const accent = args.accent || '#30D5FF';
  const reveal = args.reveal || 'chunk';
  const maxWords = args.maxWords || 2;
  const gapCut = args.gapCut ?? 0.35;
  const hold = args.hold ?? 0.45;
  const fadeMs = args.fadeMs ?? 70;
  const risePx = args.risePx ?? 6;
  const riseMs = args.riseMs ?? 130;
  const python = args.python || process.env.PYTHON_PATH || 'python';

  if (reveal !== 'chunk' && reveal !== 'word') throw new Error(`--reveal must be chunk or word`);

  const accentTerms = args.accentTerms
    ? new Set(args.accentTerms.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean))
    : null;
  const isAccented = (word) => {
    if (!accentTerms) return false;
    return accentTerms.has(word.replace(/[.,!?;:]+$/, '').toLowerCase());
  };

  const words = loadWords(path.resolve(args.transcript), args.corrections && path.resolve(args.corrections));
  const chunks = chunkWords(words, maxWords, gapCut);

  const usableWidth = videoWidth - 2 * marginLr;
  const widths = measure(python, fontFile, size, chunks.map((c) => c.map((w) => w.word).join(' ')));
  const separators = chunks.map((_, i) => (widths[i] > usableWidth ? '\\N' : ' '));

  const baseX = Math.round(videoWidth / 2);
  const baseY = videoHeight - marginBottom;
  const move = `\\move(${baseX},${baseY + risePx},${baseX},${baseY},0,${riseMs})`;
  const tags = `{\\an2${move}\\fad(${fadeMs},0)}`;
  const primaryTag = `{\\c${assColour(primary)}}`;
  const accentTag = `{\\c${assColour(accent)}}`;

  const events = [];
  chunks.forEach((chunk, index) => {
    const separator = separators[index];
    const next = chunks[index + 1];
    let chunkEnd = chunk[chunk.length - 1].end + hold;
    if (next) chunkEnd = Math.min(chunkEnd, next[0].start);

    if (reveal === 'chunk') {
      const text = chunk
        .map((w) => (isAccented(w.word) ? `${accentTag}${w.word}${primaryTag}` : w.word))
        .join(separator);
      events.push(`Dialogue: 0,${timestamp(chunk[0].start)},${timestamp(chunkEnd)},Cap,,0,0,0,,${tags}${text}`);
      return;
    }

    chunk.forEach((word, wordIndex) => {
      const end = wordIndex + 1 < chunk.length ? chunk[wordIndex + 1].start : chunkEnd;
      if (end <= word.start) return;
      // Every word of the chunk stays in the line so the layout never recomputes;
      // the ones not spoken yet are fully transparent.
      const text = chunk
        .map((w, i) => {
          if (i > wordIndex) return `{\\alpha&HFF&}${w.word}{\\alpha&H00&}`;
          if (i === wordIndex) return `${accentTag}${w.word}${primaryTag}`;
          return w.word;
        })
        .join(separator);
      events.push(`Dialogue: 0,${timestamp(word.start)},${timestamp(end)},Cap,,0,0,0,,${tags}${text}`);
    });
  });

  const header = `[Script Info]
; Generated by build-burn-in-captions.mjs
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,${fontName},${size},${assStyleColour(primary)},${assStyleColour(primary)},&H00101010,&H80000000,0,0,0,0,100,100,0,0,1,${outline},${shadow},2,${marginLr},${marginLr},${marginBottom},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
`;

  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${header}${events.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    output,
    fontFile,
    fontFamilyFromTtf: detectedFamily,
    fontNameUsed: fontName,
    reveal,
    words: words.length,
    chunks: chunks.length,
    events: events.length,
    wrappedChunks: separators.filter((s) => s === '\\N').length,
    usableWidthPx: usableWidth,
    anchorY: baseY,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
