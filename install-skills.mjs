#!/usr/bin/env node
// Installs ONE chosen skill from this repo (a subfolder containing SKILL.md)
// into the agent's personal skills directory, so it is available in every
// future session. Re-running updates that skill only; other installed skills
// are never touched. Updates preserve the installed skill's node_modules and
// record the installed commit in .installed-from.json. Run with no arguments
// to list available skills. Use --check to report whether an installed skill
// is behind this checkout without installing anything, and --remove to delete
// the installed copy (the repo itself is never touched).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { dest: path.join(os.homedir(), '.claude', 'skills'), names: [] };
  for (let i = 2; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--dest') args.dest = path.resolve(argv[++i]);
    else if (item === '--codex') args.dest = path.join(os.homedir(), '.codex', 'skills');
    else if (item === '--check') args.check = true;
    else if (item === '--remove' || item === '--uninstall') args.remove = true;
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

function git(gitArgs) {
  try {
    return execFileSync('git', gitArgs, {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {
    return null;
  }
}

function markerPath(dest) {
  return path.join(dest, '.installed-from.json');
}

function readMarker(dest) {
  try {
    return JSON.parse(fs.readFileSync(markerPath(dest), 'utf8'));
  } catch {
    return null;
  }
}

const args = parseArgs(process.argv);
const skills = availableSkills();

if (args.help || args.names.length === 0) {
  console.log('Usage: node install-skills.mjs <skill-name> [more-skill-names] [--dest <skills-dir>] [--codex] [--check] [--remove]');
  console.log('Default destination: ~/.claude/skills');
  console.log('--check: report whether each installed skill is behind this checkout (git pull first); installs nothing.');
  console.log('--remove: delete the installed copy of each named skill (including its node_modules); the repo is never touched.');
  console.log('');
  console.log('Available skills in this repo (sparse checkouts only show the one you fetched):');
  for (const name of skills) console.log(`  - ${name}`);
  process.exit(args.help ? 0 : 1);
}

if (args.remove) {
  // Removal acts only on the destination; it does not require the skill to
  // exist in this checkout and never touches the repo folder.
  for (const name of args.names) {
    const dest = path.join(args.dest, name);
    if (!fs.existsSync(dest)) {
      console.log(`${name}: not installed at ${dest}; nothing to remove.`);
      continue;
    }
    if (!fs.existsSync(path.join(dest, 'SKILL.md'))) {
      console.error(`${name}: ${dest} does not look like an installed skill (no SKILL.md); not removing it.`);
      process.exit(1);
    }
    fs.rmSync(dest, { recursive: true, force: true });
    console.log(`removed    ${name}  ->  ${dest}`);
  }
  console.log('Done. Reinstall any time with: node install-skills.mjs <skill-name>');
  process.exit(0);
}

for (const name of args.names) {
  if (!skills.includes(name)) {
    console.error(`Skill not found in this checkout: ${name}`);
    console.error(`Available here: ${skills.join(', ') || '(none)'}`);
    console.error('If you used a sparse checkout, fetch it first: git sparse-checkout set <skill-name>');
    process.exit(1);
  }
}

const repository = git(['remote', 'get-url', 'origin']);
const headCommit = git(['rev-parse', 'HEAD']);

if (args.check) {
  const remoteHead = (git(['ls-remote', 'origin', 'HEAD']) || '').split(/\s/)[0] || null;
  if (remoteHead && headCommit && remoteHead !== headCommit) {
    console.log(`Note: this checkout (${headCommit.slice(0, 7)}) is not at the remote HEAD (${remoteHead.slice(0, 7)}); run git pull first for an accurate check.`);
  }
  let updates = 0;
  for (const name of args.names) {
    const dest = path.join(args.dest, name);
    if (!fs.existsSync(dest)) {
      console.log(`${name}: not installed at ${dest}.`);
      continue;
    }
    const marker = readMarker(dest);
    if (!marker?.commit) {
      console.log(`${name}: installed without a .installed-from.json marker; re-run the installer once to start tracking versions.`);
      updates += 1;
      continue;
    }
    if (!headCommit) {
      console.log(`${name}: installed at ${marker.commit.slice(0, 7)}; cannot compare (this checkout is not a git repository).`);
      continue;
    }
    // Count only commits that touch this skill's folder, so unrelated repo
    // activity does not flag an update.
    const behind = git(['rev-list', '--count', `${marker.commit}..${headCommit}`, '--', name]);
    if (behind === null) {
      console.log(`${name}: installed at ${marker.commit.slice(0, 7)}, checkout at ${headCommit.slice(0, 7)}; could not compare (installed commit not found locally — run git pull/fetch).`);
      updates += 1;
    } else if (behind === '0') {
      console.log(`${name}: up to date (${marker.commit.slice(0, 7)}).`);
    } else {
      console.log(`${name}: update available — installed ${marker.commit.slice(0, 7)}, latest ${headCommit.slice(0, 7)} (${behind} commit(s) touching ${name}/). See: git log --oneline ${marker.commit.slice(0, 7)}..${headCommit.slice(0, 7)} -- ${name}`);
      updates += 1;
    }
  }
  process.exit(updates ? 3 : 0);
}

fs.mkdirSync(args.dest, { recursive: true });
for (const name of args.names) {
  const src = path.join(repoRoot, name);
  const dest = path.join(args.dest, name);
  const action = fs.existsSync(dest) ? 'updated  ' : 'installed';
  const previous = readMarker(dest);

  // Preserve locally installed dependencies (e.g. Playwright) across updates:
  // the repo does not ship node_modules, but users npm-install it inside the
  // installed skill so the bundled scripts can resolve it.
  const nodeModules = path.join(dest, 'node_modules');
  let kept = null;
  if (fs.existsSync(nodeModules)) {
    kept = path.join(args.dest, `.${name}.node_modules-keep-${process.pid}`);
    fs.renameSync(nodeModules, kept);
  }

  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });

  if (kept) {
    if (fs.existsSync(path.join(dest, 'node_modules'))) fs.rmSync(kept, { recursive: true, force: true });
    else fs.renameSync(kept, path.join(dest, 'node_modules'));
  }

  fs.writeFileSync(markerPath(dest), `${JSON.stringify({
    skill: name,
    repository,
    commit: headCommit,
    installedAt: new Date().toISOString(),
  }, null, 2)}\n`, 'utf8');

  console.log(`${action}  ${name}  ->  ${dest}`);
  if (previous?.commit && headCommit && previous.commit !== headCommit) {
    console.log(`  ${previous.commit.slice(0, 7)} -> ${headCommit.slice(0, 7)}  (changes: git log --oneline ${previous.commit.slice(0, 7)}..${headCommit.slice(0, 7)} -- ${name})`);
  }
}
console.log(`Done: ${args.names.length} skill(s) now available in every session.`);
