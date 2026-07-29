#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scripts = path.join(skillRoot, 'scripts');
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'video-animation-workflow-test-'));

function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(scripts, script), ...args], {
    cwd: skillRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

try {
  const preflight = JSON.parse(run('preflight.mjs', ['--project', skillRoot, '--agent', 'codex', '--json']));
  if (preflight.runtime.agent !== 'codex') throw new Error('Preflight agent override failed.');
  if (!Array.isArray(preflight.skillRoots)) throw new Error('Preflight skill roots missing.');

  const discovery = JSON.parse(run('discover-brand.mjs', ['--project', skillRoot, '--max-files', '100', '--json']));
  if (discovery.project !== skillRoot) throw new Error('Brand discovery project mismatch.');

  const initialized = JSON.parse(
    run('brand-profile.mjs', [
      'init',
      '--name',
      'Test Brand',
      '--project',
      skillRoot,
      '--root',
      testRoot,
      '--json',
    ]),
  );
  if (!fs.existsSync(path.join(initialized.path, 'brand-profile.json'))) {
    throw new Error('Brand profile was not created.');
  }
  const repeated = JSON.parse(
    run('brand-profile.mjs', [
      'init',
      '--name',
      'Test Brand',
      '--project',
      skillRoot,
      '--root',
      testRoot,
      '--json',
    ]),
  );
  if (Object.values(repeated.created).some(Boolean)) {
    throw new Error('Brand profile initialization overwrote existing files.');
  }

  run('verify-assets.mjs');
  console.log('Self-test passed: preflight, discovery, persistent brand profile, and asset verification.');
} finally {
  const resolved = path.resolve(testRoot);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
