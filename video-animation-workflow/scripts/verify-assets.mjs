#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(skillRoot, 'assets');
const manifestFile = path.join(assetsRoot, 'manifest.json');

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && fullPath !== manifestFile) files.push(fullPath);
  }
  return files;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

if (!fs.existsSync(manifestFile)) {
  console.error(`Missing asset manifest: ${manifestFile}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const expected = new Map(manifest.files.map((file) => [file.path, file]));
const actualFiles = walk(assetsRoot);
const actual = new Set(
  actualFiles.map((file) => path.relative(assetsRoot, file).replaceAll('\\', '/')),
);
const errors = [];

for (const [relative, record] of expected) {
  const file = path.join(assetsRoot, ...relative.split('/'));
  if (!fs.existsSync(file)) {
    errors.push(`missing: ${relative}`);
    continue;
  }
  const stat = fs.statSync(file);
  if (stat.size !== record.bytes) errors.push(`size: ${relative}`);
  const hash = sha256(file);
  if (hash !== record.sha256) errors.push(`sha256: ${relative}`);
}

for (const relative of actual) {
  if (!expected.has(relative)) errors.push(`unlisted: ${relative}`);
}

if (errors.length) {
  console.error(`Asset verification failed (${errors.length}):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Asset verification passed: ${manifest.fileCount} files, ${manifest.totalBytes} bytes.`);
