// Local file -> temporary public URL, via the KIE base64 upload endpoint.
// Uploaded files are deleted by KIE after 24h, so a job folder must keep its own copies.
import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_BASE } from './api.mjs';

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.heic': 'image/heic', '.heif': 'image/heif',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
};

// Limits taken from the MiniMax H3 docs. Checked before spending an upload round trip.
export const LIMITS = {
  image: { bytes: 30 * 1024 * 1024, exts: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] },
  video: { bytes: 50 * 1024 * 1024, exts: ['.mp4', '.mov'] },
  audio: { bytes: 15 * 1024 * 1024, exts: ['.wav', '.mp3'] },
};

export function kindOf(file) {
  const ext = path.extname(file).toLowerCase();
  for (const [kind, spec] of Object.entries(LIMITS)) if (spec.exts.includes(ext)) return kind;
  return null;
}

export function checkFile(file) {
  if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
  const kind = kindOf(file);
  if (!kind) throw new Error(`Unsupported format: ${file} (allowed: ${Object.values(LIMITS).flatMap(s => s.exts).join(' ')})`);
  const bytes = fs.statSync(file).size;
  const max = LIMITS[kind].bytes;
  if (bytes > max) throw new Error(`${path.basename(file)} is ${(bytes / 1048576).toFixed(1)}MB, over the ${max / 1048576}MB limit for ${kind} inputs`);
  return { kind, bytes };
}

export async function uploadFile({ key, file, uploadPath = 'kieai-minimax-h3' }) {
  const { kind, bytes } = checkFile(file);
  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const base64Data = `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
  const res = await fetch(`${UPLOAD_BASE}/api/file-base64-upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, uploadPath, fileName: path.basename(file) }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Upload of ${path.basename(file)} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok || (json.code !== undefined && json.code !== 200)) {
    throw new Error(`Upload of ${path.basename(file)} failed (HTTP ${res.status}, code ${json.code}): ${json.msg || text.slice(0, 300)}`);
  }
  const url = json.data?.downloadUrl || json.data?.fileUrl || json.data?.url;
  if (!url) throw new Error(`Upload of ${path.basename(file)} returned no URL: ${JSON.stringify(json).slice(0, 300)}`);
  return { file, url, kind, bytes, uploadedAt: new Date().toISOString() };
}
