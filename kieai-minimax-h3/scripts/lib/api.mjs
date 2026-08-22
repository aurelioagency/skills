// KIE.ai job API client for MiniMax H3. No third-party dependencies.
import fs from 'node:fs';
import path from 'node:path';

export const API_BASE = 'https://api.kie.ai';
export const UPLOAD_BASE = 'https://kieai.redpandaai.co';

export const MODELS = {
  't2v': 'minimax-h3/text-to-video',
  'i2v': 'minimax-h3/image-to-video',
  'ref2v': 'minimax-h3/reference-to-video',
};

// Credits per second of video, per resolution.
export const CREDITS_PER_SECOND = { '768P': 16, '2K': 26 };

function parseEnvFile(file) {
  const out = {};
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return out; }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

// Env var wins; then a .env in any of the given directories (job folder first).
export function readApiKey(searchDirs = []) {
  if (process.env.KIE_API_KEY && process.env.KIE_API_KEY.trim()) return process.env.KIE_API_KEY.trim();
  for (const dir of searchDirs) {
    if (!dir) continue;
    const found = parseEnvFile(path.join(dir, '.env')).KIE_API_KEY;
    if (found) return found.trim();
  }
  throw new Error(
    'No KIE API key. Set KIE_API_KEY as a user environment variable, or put KIE_API_KEY=... in a .env file inside the job folder. Never commit the key.'
  );
}

async function request(urlPath, { method = 'GET', body, key, base = API_BASE } = {}) {
  const res = await fetch(base + urlPath, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`${method} ${urlPath} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok || (json.code !== undefined && json.code !== 200)) {
    throw new Error(`${method} ${urlPath} failed (HTTP ${res.status}, code ${json.code}): ${json.msg || json.message || text.slice(0, 300)}`);
  }
  return json;
}

export async function getCredits(key) {
  const json = await request('/api/v1/chat/credit', { key });
  return typeof json.data === 'number' ? json.data : (json.data?.credit ?? json.data);
}

export async function createTask({ key, model, input, callBackUrl }) {
  const json = await request('/api/v1/jobs/createTask', {
    method: 'POST', key,
    body: { model, input, ...(callBackUrl ? { callBackUrl } : {}) },
  });
  const taskId = json.data?.taskId;
  if (!taskId) throw new Error(`createTask returned no taskId: ${JSON.stringify(json).slice(0, 300)}`);
  return taskId;
}

export async function getTask({ key, taskId }) {
  const json = await request(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { key });
  return json.data || {};
}

const DONE_OK = new Set(['success', 'succeeded', 'completed']);
const DONE_BAD = new Set(['fail', 'failed', 'error']);

export function taskStatus(data) {
  const state = String(data.state ?? data.status ?? '').toLowerCase();
  if (DONE_OK.has(state)) {
    let urls = [];
    try {
      const parsed = typeof data.resultJson === 'string' ? JSON.parse(data.resultJson) : (data.resultJson || {});
      urls = parsed.resultUrls || parsed.result_urls || [];
    } catch { /* leave empty, caller reports it */ }
    return { done: true, ok: true, state, urls, creditsConsumed: data.creditsConsumed, costTime: data.costTime };
  }
  if (DONE_BAD.has(state)) {
    return { done: true, ok: false, state, error: data.failMsg || data.errorMessage || data.msg || 'task failed with no message' };
  }
  return { done: false, ok: false, state: state || 'unknown' };
}

// Polls until the task finishes or the timeout expires. onTick reports progress.
export async function pollTask({ key, taskId, timeoutMs = 20 * 60 * 1000, intervalMs = 10000, onTick }) {
  const startedAt = Date.now();
  let attempt = 0;
  for (;;) {
    attempt++;
    let data;
    try {
      data = await getTask({ key, taskId });
    } catch (err) {
      // A transient network/API hiccup must not kill a paid run that is already generating.
      if (Date.now() - startedAt > timeoutMs) throw err;
      onTick?.({ attempt, state: 'poll-error', message: err.message, elapsedMs: Date.now() - startedAt });
      await sleep(intervalMs);
      continue;
    }
    const status = taskStatus(data);
    onTick?.({ attempt, ...status, elapsedMs: Date.now() - startedAt });
    if (status.done) return status;
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out after ${Math.round((Date.now() - startedAt) / 1000)}s waiting for task ${taskId} (last state: ${status.state}). The task may still finish — check it with: kie.mjs poll --task ${taskId}`);
    }
    await sleep(intervalMs);
  }
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function downloadTo(url, destFile) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, buf);
  return { file: destFile, bytes: buf.length };
}
