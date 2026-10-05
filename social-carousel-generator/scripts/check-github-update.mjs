#!/usr/bin/env node
// Read-only freshness check. Never installs or overwrites local customizations.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function get(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'social-carousel-generator-version-check' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  return response.json();
}
try {
  const marker = JSON.parse(fs.readFileSync(path.join(root, '.installed-from.json'), 'utf8'));
  const match = marker.repository?.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match || !/^[a-f0-9]{40}$/i.test(marker.commit || '')) throw new Error('Missing or unsupported installation provenance');
  const repository = `${match[1]}/${match[2]}`;
  const api = `https://api.github.com/repos/${repository}`;
  const commits = await get(`${api}/commits?path=${encodeURIComponent(marker.skill)}/&per_page=1`);
  if (!commits.length) throw new Error('No remote history for this skill');
  const latest = commits[0].sha;
  const comparison = latest === marker.commit ? { status: 'identical' } : await get(`${api}/compare/${marker.commit}...${latest}`);
  const status = ['identical', 'behind'].includes(comparison.status) ? 'current' : comparison.status === 'ahead' ? 'update_available' : 'unknown';
  console.log(JSON.stringify({ status, installedCommit: marker.commit, latestSkillCommit: latest, url: commits[0].html_url, localCustomizationsPreserved: true }));
} catch (error) {
  console.log(JSON.stringify({ status: 'unavailable', reason: error.message, localCustomizationsPreserved: true }));
}
