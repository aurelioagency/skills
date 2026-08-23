#!/usr/bin/env node
// Search the bundled Eyecandy clip index — offline, no network.
// eyecannndy.com returns 403 to programmatic fetches, so the index is a cache
// built from the site; see scripts/refresh-catalog.md for how it was made.
//
//   node find-reference.mjs phone portal        clips matching every term
//   node find-reference.mjs --any phone mirror  clips matching any term
//   node find-reference.mjs --tech object-portal --limit 5
//   node find-reference.mjs phone --json
//
// A term matches against the title, the tags, and the technique slugs.
// Output gives the clip's GIF URL: that is the effect itself, and the only
// permalink Eyecandy has for a clip — there is no per-clip page.
//
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(HERE, '..', 'references', 'eyecannndy-clips.tsv');
// The full-size asset, not the grid thumbnail. The site lazy-loads: `src` points at a
// downscaled copy under /media/CACHE/images/clip/, and the real file is in `data-src`
// under /media/clip/. Storing the `src` gives everyone a postage stamp.
const ASSET = 'https://asset.eyecannndy.com/media/clip/';
const TECHNIQUE = 'https://eyecannndy.com/technique/';

function parseArgs(argv) {
  const out = { terms: [], any: false, json: false, limit: 12, tech: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--any') out.any = true;
    else if (a === '--json') out.json = true;
    else if (a === '--limit') out.limit = Number(argv[++i]) || 12;
    else if (a === '--tech') out.tech = String(argv[++i] || '').toLowerCase();
    else out.terms.push(a.toLowerCase());
  }
  return out;
}

function load() {
  if (!fs.existsSync(INDEX)) {
    console.error(`Clip index not found at ${INDEX}`);
    process.exit(1);
  }
  return fs.readFileSync(INDEX, 'utf8').split('\n').filter(Boolean).map((line) => {
    const [id, title, gif, techs, year, tags] = line.split('\t');
    return {
      id,
      title: title || '',
      gif: gif ? ASSET + gif : '',
      techs: (techs || '').split(',').filter(Boolean),
      year: year || '',
      tags: (tags || '').split(',').filter(Boolean),
    };
  });
}

const args = parseArgs(process.argv.slice(2));
if (!args.terms.length && !args.tech) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const rows = load();
const scored = [];

for (const r of rows) {
  if (args.tech && !r.techs.includes(args.tech)) continue;
  const haystackTags = r.tags.map((t) => t.toLowerCase());
  const haystackTitle = r.title.toLowerCase();
  const haystackTech = r.techs.join(' ').toLowerCase();

  let score = 0;
  let matched = 0;
  for (const term of args.terms) {
    let hit = 0;
    // A tag match is the strongest signal: tags are what the curators wrote about the clip.
    if (haystackTags.some((t) => t === term)) hit = 3;
    else if (haystackTags.some((t) => t.includes(term))) hit = 2;
    else if (haystackTech.includes(term)) hit = 2;
    else if (haystackTitle.includes(term)) hit = 1;
    if (hit) { matched++; score += hit; }
  }
  if (args.terms.length && (args.any ? matched === 0 : matched < args.terms.length)) continue;
  // Clips carrying several techniques are richer references than single-tag ones.
  score += Math.min(r.techs.length, 4) * 0.1;
  scored.push({ ...r, score });
}

scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
const hits = scored.slice(0, args.limit);

if (args.json) {
  console.log(JSON.stringify(hits, null, 2));
} else if (!hits.length) {
  console.log(`No clips for: ${args.terms.join(' ')}${args.tech ? ` (technique ${args.tech})` : ''}`);
  console.log('Try --any, fewer terms, or a different tag.');
} else {
  console.log(`${scored.length} clips matched, showing ${hits.length}:\n`);
  for (const h of hits) {
    console.log(`${h.title}${h.year ? ` (${h.year})` : ''}`);
    console.log(`  effect : ${h.gif}`);
    console.log(`  techniques: ${h.techs.map((t) => TECHNIQUE + t).join('  ')}`);
    if (h.tags.length) console.log(`  tags   : ${h.tags.join(', ')}`);
    console.log('');
  }
}
