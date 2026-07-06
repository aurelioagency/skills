#!/usr/bin/env node
// Installs ONE chosen skill from this repo (a subfolder containing SKILL.md)
// into the agent's personal skills directory, so it is available in every
// future session. Re-running updates that skill only; other installed skills
// are never touched. Run with no arguments to list available skills.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { dest: path.join(os.homedir(), '.claude', 'skills'), names: [] };
  for (let i = 2; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--dest') args.dest = path.resolve(argv[++i]);
    else if (item === '--codex') args.dest = path.join(os.homedir(), '.codex', 'skills');
    else if (item === '--help' || item === '-h') args.help = true;
    else if (item.startsWith('--')) throw new Error(`Unknown argument: ${item}`);
    else args.names.push(item.replace(/[\\/]+$/, ''));
  }
  return args;
}

function availableSkills() {
  return fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(repoRoot, entry.name, 'SKILL.md')))
    .map((entry) => entry.name);
}

const args = parseArgs(process.argv);
const skills = availableSkills();

if (args.help || args.names.length === 0) {
  console.log('Usage: node install-skills.mjs <skill-name> [more-skill-names] [--dest <skills-dir>] [--codex]');
  console.log('Default destination: ~/.claude/skills');
  console.log('');
  console.log('Available skills in this repo (sparse checkouts only show the one you fetched):');
  for (const name of skills) console.log(`  - ${name}`);
  process.exit(args.help ? 0 : 1);
}

for (const name of args.names) {
  if (!skills.includes(name)) {
    console.error(`Skill not found in this checkout: ${name}`);
    console.error(`Available here: ${skills.join(', ') || '(none)'}`);
    console.error('If you used a sparse checkout, fetch it first: git sparse-checkout set <skill-name>');
    process.exit(1);
  }
}

fs.mkdirSync(args.dest, { recursive: true });
for (const name of args.names) {
  const src = path.join(repoRoot, name);
  const dest = path.join(args.dest, name);
  const action = fs.existsSync(dest) ? 'updated  ' : 'installed';
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`${action}  ${name}  ->  ${dest}`);
}
console.log(`Done: ${args.names.length} skill(s) now available in every session.`);
