#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
]);
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.htm',
  '.md',
  '.mdx',
  '.txt',
  '.json',
  '.yaml',
  '.yml',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
  '.svelte',
]);
const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.avif']);

function parseArgs(argv) {
  const args = { project: process.cwd(), json: false, maxFiles: 2500, maxDepth: 8 };
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = path.resolve(argv[++i]);
    else if (item === '--max-files') args.maxFiles = Number(argv[++i]);
    else if (item === '--max-depth') args.maxDepth = Number(argv[++i]);
    else if (item === '--json') args.json = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function walk(root, maxDepth, maxFiles) {
  const files = [];
  const queue = [{ directory: root, depth: 0 }];
  while (queue.length && files.length < maxFiles) {
    const { directory, depth } = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (depth < maxDepth && !IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) {
          queue.push({ directory: fullPath, depth: depth + 1 });
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function increment(map, value) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) || 0) + 1);
}

function ranked(map, limit = 20) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, occurrences]) => ({ value, occurrences }));
}

function inspect(args) {
  const files = walk(args.project, args.maxDepth, args.maxFiles);
  const evidence = [];
  const logos = [];
  const fonts = [];
  const samples = [];
  const colors = new Map();
  const fontFamilies = new Map();
  const headings = new Map();

  for (const file of files) {
    const relative = path.relative(args.project, file);
    const extension = path.extname(file).toLowerCase();
    const basename = path.basename(file).toLowerCase();
    if (/(brand|identity|guideline|styleguide|design|palette|typography|voice|tone)/i.test(basename)) {
      evidence.push(relative);
    }
    if (IMAGE_EXTENSIONS.has(extension) && /(logo|wordmark|brandmark|logotype)/i.test(basename)) {
      logos.push(relative);
    }
    if (FONT_EXTENSIONS.has(extension)) fonts.push(relative);
    if (/\.(mp3|wav|m4a|mp4|mov|webm)$/i.test(extension) || /(script|copy|caption|transcript)/i.test(basename)) {
      samples.push(relative);
    }
    if (!TEXT_EXTENSIONS.has(extension)) continue;
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      continue;
    }
    if (stat.size > 2_000_000) continue;
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) increment(colors, match[0].toUpperCase());
    for (const match of text.matchAll(/font-family\s*:\s*([^;}{\n]+)/gi)) {
      increment(fontFamilies, match[1].replace(/["']/g, ''));
    }
    for (const match of text.matchAll(/^#\s+(.+)$/gm)) increment(headings, match[1]);
  }

  return {
    schemaVersion: 1,
    project: args.project,
    scannedFileCount: files.length,
    scanWasTruncated: files.length >= args.maxFiles,
    candidateEvidenceFiles: evidence.slice(0, 100),
    candidateLogos: logos.slice(0, 100),
    candidateFontFiles: fonts.slice(0, 100),
    candidateVoiceAndMediaSamples: samples.slice(0, 100),
    frequentColors: ranked(colors),
    frequentFontFamilies: ranked(fontFamilies),
    candidateNamesFromHeadings: ranked(headings, 10),
    instruction:
      'Treat every result as evidence to inspect, not as an approved brand decision. Ask only for gaps that remain after verification.',
  };
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log('Usage: node scripts/discover-brand.mjs [--project <path>] [--max-files N] [--max-depth N] [--json]');
  process.exit(0);
}

const report = inspect(args);
if (args.json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Brand discovery: ${report.project}`);
  console.log(`Scanned files: ${report.scannedFileCount}${report.scanWasTruncated ? ' (truncated)' : ''}`);
  console.log(`Evidence files: ${report.candidateEvidenceFiles.length}`);
  console.log(`Logo candidates: ${report.candidateLogos.length}`);
  console.log(`Font candidates: ${report.candidateFontFiles.length}`);
  console.log(`Voice/media candidates: ${report.candidateVoiceAndMediaSamples.length}`);
  console.log('Frequent colors:');
  for (const item of report.frequentColors.slice(0, 10)) console.log(`  ${item.value} (${item.occurrences})`);
  console.log('Frequent font families:');
  for (const item of report.frequentFontFamilies.slice(0, 10)) console.log(`  ${item.value} (${item.occurrences})`);
}
