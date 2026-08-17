// Resolves Playwright's chromium for this skill.
//
// A skill must never depend on another skill being installed, or on it still being
// called what it is called today: renaming or removing an unrelated skill would break
// this one silently. So the search goes from "our own install" outwards, and the last
// resort matches sibling skill folders by SHAPE — a folder that happens to carry
// playwright — never by name.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(HERE, '..', '..');

function globalNodeModulesParent() {
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const root = execFileSync(npm, ['root', '-g'], { encoding: 'utf8', windowsHide: true }).trim();
    // Node resolves `require('x')` by looking in <dir>/node_modules for each ancestor,
    // so the usable base is the PARENT of the global node_modules directory.
    return root ? path.dirname(root) : null;
  } catch {
    return null;
  }
}

const PACKAGES = ['playwright', 'playwright-core'];

function skillFoldersCarryingPlaywright() {
  const home = os.homedir();
  const roots = [
    process.env.CLAUDE_CONFIG_DIR && path.join(process.env.CLAUDE_CONFIG_DIR, 'skills'),
    path.join(home, '.claude', 'skills'),
    process.env.CODEX_HOME && path.join(process.env.CODEX_HOME, 'skills'),
    path.join(home, '.codex', 'skills'),
  ].filter(Boolean);

  const found = [];
  for (const root of roots) {
    let entries = [];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const base = path.join(root, entry.name);
      if (base === SKILL_ROOT) continue;
      if (PACKAGES.some((pkg) => fs.existsSync(path.join(base, 'node_modules', pkg)))) found.push(base);
    }
  }
  return found;
}

export function installHint() {
  return `Instalalo dentro de esta skill:\n  cd "${SKILL_ROOT}"\n  npm i playwright`;
}

export async function loadChromium() {
  const bases = [
    SKILL_ROOT,               // this skill's own install — where it belongs
    path.join(HERE, '..'),    // scripts/
    process.cwd(),            // the project being rendered
    globalNodeModulesParent(),
    ...skillFoldersCarryingPlaywright(),
  ].filter(Boolean);

  for (const base of bases) {
    const req = createRequire(path.join(base, 'noop.js'));
    for (const pkg of PACKAGES) {
      try {
        const mod = req(pkg); // playwright es CJS
        if (mod?.chromium) return mod.chromium;
      } catch { /* siguiente paquete */ }
    }
  }

  console.error(`No encontre Playwright.\n${installHint()}`);
  process.exit(1);
}
