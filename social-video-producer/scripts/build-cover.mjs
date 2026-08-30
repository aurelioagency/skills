#!/usr/bin/env node
// Builds the social cover (portada): one frame of the finished video with a three-line
// kinetic-style headline burned onto it, as a PNG at the source's native resolution.
//
// Two modes:
//   --scan   contact sheet of face crops, for CHOOSING the frame by looking at it
//   (build)  extract that frame at full res and compose the headline onto it
//
// The headline geometry is expressed against the 1080-wide house design and scaled by
// sourceWidth/1080, exactly like build-burn-in-captions.mjs, so a 4K source gets 4K-sized
// text instead of text at half its intended size.
//
// Two failures this script exists to prevent, both learned the hard way:
//
//   1. `YCbCr Matrix: TV.709` in the ASS header is correct when the target is an MP4 and
//      WRONG when the target is a PNG: libass converts the fill for limited-range video and
//      the colour lands dimmer and greyer than asked for (#30D5FF arrived as #39C7EB, which
//      reads as "the letters look half transparent"). PNG output declares `None` and the
//      script SAMPLES the rendered fill pixel and fails if it does not match the request.
//   2. Text placed without looking at the frame lands across the speaker's hands or a prop.
//      The script reports the block's extent and whether it survives the profile grid's
//      centred square crop, which is the size the cover is actually judged at.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFontFamily } from './lib/font-name.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// House cover style, in 1080-wide design space. Scaled by sourceWidth/1080 at build time.
const BASE = {
  smallSize: 66,
  bigSize: 160,
  yTop: 1215,
  yBig: 1330,
  yBottom: 1442,
  outline: 2.5,
  shadow: 6,
  // A cover line may run wider than a caption line: it is read once, big, not followed
  // word by word. 70 in 1080-space still leaves a real gate against a runaway headline.
  marginLr: 70,
};

// Same cyan as the caption accent. The cover and the captions inside the video speak one
// language on purpose: that repetition is what makes the grid recognisable.
const HOUSE_COLOR = '#30D5FF';

function usage() {
  console.error(`Usage:
  Choose the frame first (look at the sheet, pick a closed mouth / slight smile):
    node build-cover.mjs --scan --input <source.mp4> --output <sheet.png> [--fps 5] [--columns 8]

  Then build the cover:
    node build-cover.mjs --project <project-root> --input <source.mp4> --frame <seconds> \\
      --top "esta skill te da" --big "10 ganchos" --bottom "para tu proximo video" \\
      [--output <cover.png>]        defaults to renders/final/<slug>-portada.png
      [--font-file <font.ttf>]      defaults to the project's frozen caption font
      [--color "#30D5FF"]           house cyan; all three lines
      [--accent-big]                white lines with the big one in --color instead
      [--y-offset <px>]             nudge the whole block; + is down, in SOURCE pixels
      [--python python] [--ffmpeg <path>]

--top and --bottom are optional; --big is the line that carries the cover.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--input') args.input = argv[++i];
    else if (item === '--frame') args.frame = Number(argv[++i]);
    else if (item === '--top') args.top = argv[++i];
    else if (item === '--big') args.big = argv[++i];
    else if (item === '--bottom') args.bottom = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--font-file') args.fontFile = argv[++i];
    else if (item === '--color' || item === '--colour') args.color = argv[++i];
    else if (item === '--accent-big') args.accentBig = true;
    else if (item === '--y-offset') args.yOffset = Number(argv[++i]);
    else if (item === '--scan') args.scan = true;
    else if (item === '--fps') args.fps = Number(argv[++i]);
    else if (item === '--columns') args.columns = Number(argv[++i]);
    else if (item === '--python') args.python = argv[++i];
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function resolveOnPath(command) {
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map((ext) => ext.trim()).filter(Boolean)
    : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir.replace(/^"|"$/g, ''), command + ext);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function findTool(name, explicit) {
  const configured = explicit || process.env[`${name.toUpperCase()}_PATH`];
  if (configured) return configured;
  const resolved = resolveOnPath(name);
  if (resolved) return resolved;
  const probe = spawnSync(name, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (!probe.error && probe.status === 0) return name;
  throw new Error(`Could not find ${name} on PATH.`);
}

function run(command, commandArgs, options = {}) {
  const proc = spawnSync(command, commandArgs, {
    encoding: options.encoding ?? 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw new Error(`${path.basename(command)} exited ${proc.status}: ${proc.stderr || ''}`);
  return proc;
}

// A Windows drive letter has to be escaped inside an ffmpeg filter argument, or the colon
// is read as the start of the next filter option and the filter silently drops.
function filterPath(value) {
  return String(value).replace(/\\/g, '/').replace(/:/g, '\\:');
}

function probeSize(ffprobe, input) {
  const proc = run(ffprobe, [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', input,
  ]);
  const [width, height] = proc.stdout.trim().split(/[x,]/).map(Number);
  if (!width || !height) throw new Error(`Could not read dimensions of ${input}`);
  return { width, height };
}

function probeDuration(ffprobe, input) {
  const proc = run(ffprobe, [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input,
  ]);
  const seconds = Number(proc.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`Could not read duration of ${input}`);
  return seconds;
}

// ASS colour is &HBBGGRR&, the reverse of CSS hex. Reversing it silently yields the
// complement, which is easy to miss on a warm frame.
function assColor(hex) {
  const value = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Expected a #RRGGBB colour, got: ${hex}`);
  const rr = value.slice(0, 2);
  const gg = value.slice(2, 4);
  const bb = value.slice(4, 6);
  return `&H00${bb}${gg}${rr}`.toUpperCase();
}

function measureLines(python, fontFile, size, lines) {
  if (!lines.length) return [];
  const proc = run(python, [path.join(HERE, 'lib', 'measure_text.py'), fontFile, String(Math.round(size))], {
    input: JSON.stringify(lines),
  });
  return JSON.parse(proc.stdout);
}

function findProjectFont(projectDir) {
  const dir = path.join(projectDir, 'assets', 'fonts');
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((name) => /\.(ttf|otf)$/i.test(name));
  return hit ? path.join(dir, hit) : null;
}

function readSlug(projectDir) {
  const manifest = path.join(projectDir, 'manifests', 'project.json');
  if (fs.existsSync(manifest)) {
    const slug = JSON.parse(fs.readFileSync(manifest, 'utf8')).slug;
    if (slug) return slug;
  }
  return path.basename(projectDir);
}

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

// Reads a horizontal strip of the rendered PNG through the middle of the big line and
// tallies the colours in it. Sampling a single guessed point is not reliable — glyph side
// bearings move the first stroke around — but the fill of a 160pt line is thousands of
// pixels on that row, so its share of the strip is unmistakable.
function stripHistogram(ffmpeg, file, x, y, width, height = 6) {
  const proc = run(ffmpeg, [
    '-v', 'error', '-i', file,
    '-vf', `crop=${Math.round(width)}:${height}:${Math.max(0, Math.round(x))}:${Math.max(0, Math.round(y - height / 2))}`,
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
  ], { encoding: 'buffer' });
  const buf = proc.stdout;
  const counts = new Map();
  let total = 0;
  for (let i = 0; i + 2 < buf.length; i += 3) {
    const key = toHex(buf[i], buf[i + 1], buf[i + 2]);
    counts.set(key, (counts.get(key) || 0) + 1);
    total += 1;
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    total,
    share: (hex) => (counts.get(hex) || 0) / (total || 1),
    top: ranked.slice(0, 3).map(([hex, count]) => ({ hex, share: Number((count / total).toFixed(3)) })),
  };
}

function scanMode(args) {
  if (!args.input || !args.output) { usage(); process.exit(2); }
  const ffmpeg = findTool('ffmpeg', args.ffmpeg);
  const ffprobe = findTool('ffprobe', args.ffprobe);
  const input = path.resolve(args.input);
  const output = path.resolve(args.output);
  const { width, height } = probeSize(ffprobe, input);
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const fps = args.fps ?? 5;
  const columns = args.columns ?? 8;
  // tile refuses -1 for either axis, so the row count has to be computed up front.
  const rows = Math.max(1, Math.ceil((probeDuration(ffprobe, input) * fps) / columns));
  // Crop to the head-and-shoulders band: a full-frame thumbnail is too small to judge
  // whether the mouth is closed, which is the whole reason for scanning.
  const cropW = Math.round(width * 0.65);
  const cropH = Math.round(height * 0.28);
  const cropX = Math.round((width - cropW) / 2);
  const cropY = Math.round(height * 0.24);
  run(ffmpeg, [
    '-y', '-v', 'error', '-i', input,
    '-vf', `fps=${fps},crop=${cropW}:${cropH}:${cropX}:${cropY},scale=200:-1,tile=${columns}x${rows}`,
    '-frames:v', '1', output,
  ]);

  console.log(JSON.stringify({
    ok: true,
    mode: 'scan',
    sheet: output,
    fps,
    columns,
    rows,
    timeOfCell: `t = (row * ${columns} + column) / ${fps}  (0-based row and column)`,
    next: 'Look at the sheet. Pick a cell with a closed mouth or a slight smile and eyes to camera, then run the build mode with --frame <that t>.',
  }, null, 2));
}

function buildMode(args) {
  if (!args.project || !args.input || !Number.isFinite(args.frame) || !args.big) {
    usage();
    process.exit(2);
  }
  const ffmpeg = findTool('ffmpeg', args.ffmpeg);
  const ffprobe = findTool('ffprobe', args.ffprobe);
  const python = args.python || process.env.PYTHON_PATH || 'python';

  const projectDir = path.resolve(args.project);
  if (!fs.existsSync(projectDir)) throw new Error(`Missing project: ${projectDir}`);
  const input = path.resolve(projectDir, args.input);
  if (!fs.existsSync(input)) throw new Error(`Missing input video: ${input}`);

  const fontFile = path.resolve(projectDir, args.fontFile || findProjectFont(projectDir) || '');
  if (!fs.existsSync(fontFile)) {
    throw new Error('No caption font found. Run freeze-caption-font.mjs first, or pass --font-file.');
  }
  const fontFamily = readFontFamily(fontFile);

  const slug = readSlug(projectDir);
  const { width, height } = probeSize(ffprobe, input);
  const scale = width / 1080;
  const yOffset = args.yOffset ?? 0;

  const smallSize = Math.round(BASE.smallSize * scale);
  const bigSize = Math.round(BASE.bigSize * scale);
  const usableWidth = width - Math.round(BASE.marginLr * scale) * 2;

  const color = args.color || HOUSE_COLOR;
  const primary = assColor(args.accentBig ? '#FFFFFF' : color);
  const bigColor = assColor(color);

  // Width gate, same reasoning as audit-caption-width.mjs: \pos disables margin-based
  // wrapping, so an over-long line runs straight off the frame instead of wrapping.
  const smallLines = [args.top, args.bottom].filter(Boolean);
  const smallWidths = measureLines(python, fontFile, smallSize, smallLines);
  const bigWidths = measureLines(python, fontFile, bigSize, [args.big]);
  const overflow = [];
  smallLines.forEach((line, i) => {
    if (smallWidths[i] > usableWidth) overflow.push({ line, widthPx: Math.round(smallWidths[i]), usableWidth });
  });
  if (bigWidths[0] > usableWidth) overflow.push({ line: args.big, widthPx: Math.round(bigWidths[0]), usableWidth });
  if (overflow.length) {
    throw new Error(`Cover text is wider than the frame:\n${JSON.stringify(overflow, null, 2)}\nShorten the line or lower the size.`);
  }

  const yTop = Math.round(BASE.yTop * scale) + yOffset;
  const yBig = Math.round(BASE.yBig * scale) + yOffset;
  const yBottom = Math.round(BASE.yBottom * scale) + yOffset;
  const centerX = Math.round(width / 2);

  const events = [];
  if (args.top) events.push(`{\\an5\\pos(${centerX},${yTop})\\fs${smallSize}}${args.top}`);
  events.push(`{\\an5\\pos(${centerX},${yBig})\\fs${bigSize}${args.accentBig ? `\\c${bigColor}&` : ''}}${args.big}`);
  if (args.bottom) events.push(`{\\an5\\pos(${centerX},${yBottom})\\fs${smallSize}}${args.bottom}`);

  // Two alpha decisions in the style line, and they are not the same decision:
  // the OUTLINE is fully opaque black (&H00......) so the fill keeps a hard edge — a
  // semi-transparent outline lets the background bleed through the ring around every
  // glyph and the colour reads washed out even though the fill itself is solid. The
  // SHADOW stays semi-transparent (&H80......) because it is meant to be a soft drop,
  // not a second outline.
  //
  // `YCbCr Matrix: None` is load-bearing for PNG output. See the header comment.
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cover,${fontFamily},${smallSize},${primary},${primary},&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,${(BASE.outline * scale).toFixed(1)},${(BASE.shadow * scale).toFixed(1)},5,${Math.round(BASE.marginLr * scale)},${Math.round(BASE.marginLr * scale)},60,1

[Events]
Format: Layer, Start, End, Style, MarginL, MarginR, MarginV, Effect, Text
${events.map((text) => `Dialogue: 0,0:00:00.00,0:00:10.00,Cover,0,0,0,,${text}`).join('\n')}
`;

  const coverDir = path.join(projectDir, 'renders', 'cover');
  fs.mkdirSync(coverDir, { recursive: true });
  const assPath = path.join(coverDir, `${slug}-portada.ass`);
  fs.writeFileSync(assPath, ass, 'utf8');

  const framePath = path.join(coverDir, `frame-${args.frame}.png`);
  run(ffmpeg, ['-y', '-v', 'error', '-i', input, '-ss', String(args.frame), '-frames:v', '1', framePath]);

  const output = path.resolve(projectDir, args.output || path.join('renders', 'final', `${slug}-portada.png`));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  run(ffmpeg, [
    '-y', '-v', 'error', '-i', framePath,
    '-vf', `ass='${filterPath(assPath)}':fontsdir='${filterPath(path.dirname(fontFile))}'`,
    '-frames:v', '1', output,
  ]);

  // Colour gate: the fill that landed on disk has to be the fill that was asked for.
  const expectedHex = `#${String(color).replace('#', '').toUpperCase()}`;
  const strip = stripHistogram(ffmpeg, output, centerX - bigWidths[0] / 2, yBig, bigWidths[0]);
  const fillShare = strip.share(expectedHex);
  if (fillShare < 0.05) {
    throw new Error(
      `Expected fill ${expectedHex} covers only ${(fillShare * 100).toFixed(1)}% of the big line. `
      + `Colours found: ${JSON.stringify(strip.top)}. `
      + 'A dim, desaturated near-miss means the ASS header asked for a video colour matrix on RGB output — '
      + `check that ${path.basename(assPath)} declares "YCbCr Matrix: None".`,
    );
  }

  // The profile grid crops the cover to a centred square, and that is the size a viewer
  // decides at. Text below the square's bottom edge is text nobody reads.
  const squareTop = Math.round((height - width) / 2);
  const squareBottom = squareTop + width;
  // \an5 centres each line on its own box, so the visible extent above and below the
  // anchor is roughly 0.45em — cap height one way, descender the other. Using the full
  // font size as the half-extent would flag a block that is demonstrably inside the crop.
  const blockTop = (args.top ? yTop : yBig) - (args.top ? smallSize : bigSize) * 0.45;
  const blockBottom = (args.bottom ? yBottom : yBig) + (args.bottom ? smallSize : bigSize) * 0.45;
  const insideGridCrop = blockTop >= squareTop && blockBottom <= squareBottom;

  const gridPreview = path.join(coverDir, `${slug}-portada-gridcrop.png`);
  run(ffmpeg, [
    '-y', '-v', 'error', '-i', output,
    '-vf', `crop=${width}:${width}:0:${squareTop},scale=540:-1`,
    '-frames:v', '1', gridPreview,
  ]);

  console.log(JSON.stringify({
    ok: true,
    mode: 'build',
    output,
    ass: assPath,
    frameSeconds: args.frame,
    frame: framePath,
    gridCropPreview: gridPreview,
    source: { width, height, scale: Number(scale.toFixed(3)) },
    font: { file: fontFile, family: fontFamily },
    style: {
      color,
      accentBig: Boolean(args.accentBig),
      smallSize,
      bigSize,
      yTop, yBig, yBottom,
      yOffset,
    },
    verified: { fill: expectedHex, shareOfBigLineStrip: Number(fillShare.toFixed(3)), colours: strip.top },
    widestLinePx: Math.round(Math.max(bigWidths[0], ...(smallWidths.length ? smallWidths : [0]))),
    usableWidthPx: usableWidth,
    insideGridCrop,
    next: insideGridCrop
      ? 'Look at BOTH the full cover and the grid-crop preview. Check the text does not land on the hands or a prop; nudge with --y-offset if it does.'
      : 'WARNING: the text block falls outside the centred square the profile grid crops to. Nudge it back with --y-offset before delivering.',
  }, null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); process.exit(0); }
  if (args.scan) scanMode(args);
  else buildMode(args);
}

try {
  main();
} catch (error) {
  console.error(String(error.message || error));
  process.exit(1);
}
