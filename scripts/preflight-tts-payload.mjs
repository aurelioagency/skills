#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const mojibakePatterns = [
  /\uFFFD/,
  /Ã./,
  /Â./,
  /â./,
  /podÃ/i,
  /sÃ/i,
  /dÃ/i,
  /Ã‚/i,
  /Ãƒ/i,
  /ï¿½/i,
];

function usage() {
  console.error(`Usage:
  node preflight-tts-payload.mjs --file <payload.json|txt> [--json-path lines[].ttsText] [--json-path lines[].text]

Checks the exact UTF-8 payload before sending it to TTS. Exits non-zero on mojibake/replacement characters.`);
}

function parseArgs(argv) {
  const args = { jsonPaths: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--file') args.file = argv[++i];
    else if (item === '--json-path') args.jsonPaths.push(argv[++i]);
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function valuesAtPath(value, expr) {
  const parts = expr.split('.');
  let current = [value];
  for (const part of parts) {
    const next = [];
    const array = part.endsWith('[]');
    const key = array ? part.slice(0, -2) : part;
    for (const item of current) {
      if (item == null) continue;
      const child = key ? item[key] : item;
      if (array) {
        if (Array.isArray(child)) next.push(...child);
      } else {
        next.push(child);
      }
    }
    current = next;
  }
  return current.filter((item) => typeof item === 'string');
}

function scanText(label, text) {
  const hits = [];
  for (const pattern of mojibakePatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const index = match.index ?? 0;
    hits.push({
      label,
      pattern: String(pattern),
      sample: text.slice(Math.max(0, index - 28), Math.min(text.length, index + 42)),
    });
  }
  return hits;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.file) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const file = path.resolve(args.file);
  const raw = fs.readFileSync(file);
  const text = raw.toString('utf8');
  const replacementByte = raw.includes(0xef) && text.includes('\uFFFD');
  const checks = [];

  if (args.jsonPaths.length) {
    const parsed = JSON.parse(text);
    for (const jsonPath of args.jsonPaths) {
      const values = valuesAtPath(parsed, jsonPath);
      values.forEach((value, index) => checks.push({ label: `${jsonPath}[${index}]`, text: value }));
    }
  } else {
    checks.push({ label: path.basename(file), text });
  }

  const hits = checks.flatMap((check) => scanText(check.label, check.text));
  if (replacementByte && !hits.some((hit) => hit.pattern.includes('FFFD'))) {
    hits.push({ label: path.basename(file), pattern: 'UTF-8 replacement character', sample: 'decoded payload contains U+FFFD' });
  }

  const result = {
    file,
    checkedFields: checks.map((check) => check.label),
    ok: hits.length === 0,
    issues: hits,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main();
