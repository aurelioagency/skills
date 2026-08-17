#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';

function usage() {
  console.error(`Usage:
  node download-freeze-heygen.mjs --project <project-root> --source <url-or-file> --output assets/avatar/opening1.mp4 --asset-id opening1 [--segment opening1] [--remote-id <heygen-video-id>] [--session-id <heygen-session-id>] [--page-url <url>] [--source-audio assets/voice/opening1.wav] [--source-text <text>] [--tts-text <text>] [--request-fingerprint sha256:...] [--manifest manifests/paid-assets.json]

Copies/downloads a completed paid HeyGen output into the project folder and records it. This script never deletes remote assets.`);
}

function parseArgs(argv) {
  const args = { manifest: 'manifests/paid-assets.json', provider: 'heygen' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--source') args.source = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--asset-id') args.assetId = argv[++i];
    else if (item === '--segment') args.segment = argv[++i];
    else if (item === '--remote-id') args.remoteId = argv[++i];
    else if (item === '--session-id') args.sessionId = argv[++i];
    else if (item === '--page-url') args.pageUrl = argv[++i];
    else if (item === '--download-url') args.downloadUrl = argv[++i];
    else if (item === '--run-manifest') args.runManifest = argv[++i];
    else if (item === '--source-audio') args.sourceAudio = argv[++i];
    else if (item === '--source-text') args.sourceText = argv[++i];
    else if (item === '--tts-text') args.ttsText = argv[++i];
    else if (item === '--request-fingerprint') args.requestFingerprint = argv[++i];
    else if (item === '--manifest') args.manifest = argv[++i];
    else if (item === '--provider') args.provider = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function isUrl(value) {
  return /^https?:\/\//i.test(value);
}

async function freezeSource(source, output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (isUrl(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${source}`);
    await pipeline(response.body, fs.createWriteStream(output));
  } else {
    const sourcePath = path.resolve(source);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing source file: ${sourcePath}`);
    fs.copyFileSync(sourcePath, output);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeJsonAtomic(filePath, value) {
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, filePath);
}

async function withManifestLock(manifestPath, fn) {
  const lockPath = `${manifestPath}.lock`;
  let fd = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      fd = fs.openSync(lockPath, 'wx');
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await sleep(100);
    }
  }
  if (fd === null) throw new Error(`Could not acquire manifest lock: ${lockPath}`);
  try {
    return await fn();
  } finally {
    fs.closeSync(fd);
    fs.rmSync(lockPath, { force: true });
  }
}

async function updateManifest(manifestPath, entry) {
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : { schemaVersion: 1, paidAssets: [] };
  if (!Array.isArray(manifest.paidAssets)) manifest.paidAssets = [];
  const existing = manifest.paidAssets.findIndex((item) => {
    if (entry.requestFingerprint && item.requestFingerprint === entry.requestFingerprint) return true;
    return item.assetId === entry.assetId;
  });
  if (existing >= 0) manifest.paidAssets[existing] = { ...manifest.paidAssets[existing], ...entry };
  else manifest.paidAssets.push(entry);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeJsonAtomic(manifestPath, manifest);
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside project root: ${target}`);
  }
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return `sha256:${hash.digest('hex')}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || !args.source || !args.output || !args.assetId) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const output = path.resolve(projectDir, args.output);
  assertInside(projectDir, output, 'Output');
  await freezeSource(args.source, output);

  const stat = fs.statSync(output);
  const manifestPath = path.resolve(projectDir, args.manifest);
  assertInside(projectDir, manifestPath, 'Manifest');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  let sourceAudioPath = null;
  let sourceAudioSha256 = null;
  if (args.sourceAudio) {
    sourceAudioPath = path.resolve(projectDir, args.sourceAudio);
    assertInside(projectDir, sourceAudioPath, 'Source audio');
    if (!fs.existsSync(sourceAudioPath)) throw new Error(`Missing source audio: ${sourceAudioPath}`);
    sourceAudioSha256 = sha256File(sourceAudioPath);
  }
  const entry = {
    assetId: args.assetId,
    segmentId: args.segment || args.assetId,
    provider: args.provider,
    remoteId: args.remoteId || null,
    sessionId: args.sessionId || null,
    pageUrl: args.pageUrl || null,
    downloadUrl: args.downloadUrl || (isUrl(args.source) ? args.source : null),
    remote: {
      videoId: args.remoteId || null,
      sessionId: args.sessionId || null,
      pageUrl: args.pageUrl || null,
      downloadUrl: args.downloadUrl || (isUrl(args.source) ? args.source : null),
      runManifestPath: args.runManifest || null,
    },
    source: args.source,
    sourceAudioPath: sourceAudioPath ? path.relative(projectDir, sourceAudioPath).replace(/\\/g, '/') : null,
    sourceAudioSha256,
    sourceText: args.sourceText || null,
    ttsText: args.ttsText || null,
    requestFingerprint: args.requestFingerprint || null,
    localPath: path.relative(projectDir, output).replace(/\\/g, '/'),
    sizeBytes: stat.size,
    status: 'frozen',
    frozenAt: new Date().toISOString(),
    deleteRemote: false,
  };
  await withManifestLock(manifestPath, () => updateManifest(manifestPath, entry));
  console.log(JSON.stringify({ ok: true, manifest: manifestPath, asset: entry }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
