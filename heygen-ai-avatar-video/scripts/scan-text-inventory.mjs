#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const defaultForbidden = [
  'OpenAI skill',
  'Pregunta hook',
  'question hook',
  'short-format intro hook',
  'Status: corrected script',
];

function usage() {
  console.error(`Usage:
  node scan-text-inventory.mjs --file <public/index.html> [--forbid "OpenAI skill,question hook"]

Scans generated source/HTML for internal metadata strings that must not appear on-screen.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--file') args.file = argv[++i];
    else if (item === '--forbid') args.forbid = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.file) {
    usage();
    process.exit(args.help ? 0 : 2);
  }
  const file = path.resolve(args.file);
  const text = fs.readFileSync(file, 'utf8');
  const forbidden = args.forbid
    ? args.forbid.split(',').map((item) => item.trim()).filter(Boolean)
    : defaultForbidden;
  const hits = [];
  for (const item of forbidden) {
    let index = text.indexOf(item);
    while (index !== -1) {
      hits.push({
        term: item,
        index,
        sample: text.slice(Math.max(0, index - 40), Math.min(text.length, index + item.length + 40)),
      });
      index = text.indexOf(item, index + item.length);
    }
  }
  const result = { file, ok: hits.length === 0, checkedTerms: forbidden, hits };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main();
