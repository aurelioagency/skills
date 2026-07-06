#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error(`Usage:
  node heygen-job-state.mjs claim --project <project-root> --job-id <id> [--worker-id <id>] [--lease-minutes 180]
  node heygen-job-state.mjs status --project <project-root> --job-id <id> --status submitted --claim-token <token> [--remote-id <id>] [--session-id <id>] [--page-url <url>]
  node heygen-job-state.mjs freeze --project <project-root> --job-id <id> --claim-token <token> --local-path assets/avatar/opening1.mp4 [--remote-id <id>] [--session-id <id>] [--page-url <url>] [--download-url <url>]
  node heygen-job-state.mjs fail --project <project-root> --job-id <id> --claim-token <token> --error <message>
  node heygen-job-state.mjs release --project <project-root> --job-id <id> --claim-token <token>
  node heygen-job-state.mjs list --project <project-root>

Updates manifests/heygen-jobs.json with a simple file lock so subagents do not claim the same paid job.`);
}

function parseArgs(argv) {
  const args = { command: argv[0], leaseMinutes: 180 };
  if (argv[0] === '--help' || argv[0] === '-h') {
    args.help = true;
    args.command = null;
    return args;
  }
  for (let i = 1; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--job-id') args.jobId = argv[++i];
    else if (item === '--worker-id') args.workerId = argv[++i];
    else if (item === '--claim-token') args.claimToken = argv[++i];
    else if (item === '--lease-minutes') args.leaseMinutes = Number(argv[++i]);
    else if (item === '--status') args.status = argv[++i];
    else if (item === '--remote-id') args.remoteId = argv[++i];
    else if (item === '--session-id') args.sessionId = argv[++i];
    else if (item === '--page-url') args.pageUrl = argv[++i];
    else if (item === '--download-url') args.downloadUrl = argv[++i];
    else if (item === '--run-manifest') args.runManifest = argv[++i];
    else if (item === '--local-path') args.localPath = argv[++i];
    else if (item === '--error') args.error = argv[++i];
    else if (item === '--manifest') args.manifest = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, filePath);
}

async function withLock(filePath, fn) {
  const lockPath = `${filePath}.lock`;
  let fd = null;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      fd = fs.openSync(lockPath, 'wx');
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await sleep(100);
    }
  }
  if (fd === null) throw new Error(`Could not acquire lock: ${lockPath}`);
  try {
    return await fn();
  } finally {
    fs.closeSync(fd);
    fs.rmSync(lockPath, { force: true });
  }
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside project root: ${target}`);
  }
}

function manifestPath(args) {
  const projectDir = path.resolve(args.project);
  const manifest = path.resolve(projectDir, args.manifest || 'manifests/heygen-jobs.json');
  assertInside(projectDir, manifest, 'Jobs manifest');
  return { projectDir, manifest };
}

function findJob(manifest, jobId) {
  if (!Array.isArray(manifest.jobs)) manifest.jobs = [];
  const job = manifest.jobs.find((item) => item.jobId === jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  return job;
}

function nowIso() {
  return new Date().toISOString();
}

function expiresIso(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function isExpired(job) {
  const value = job.claim?.leaseExpiresAt;
  return value ? Date.parse(value) <= Date.now() : false;
}

function assertToken(job, token) {
  if (!token || job.claim?.claimToken !== token) {
    throw new Error(`Claim token mismatch for ${job.jobId}. Claim the job before updating it.`);
  }
}

function setRemote(job, args) {
  job.remote = {
    ...(job.remote || {}),
    videoId: args.remoteId || job.remote?.videoId || null,
    sessionId: args.sessionId || job.remote?.sessionId || null,
    pageUrl: args.pageUrl || job.remote?.pageUrl || null,
    downloadUrl: args.downloadUrl || job.remote?.downloadUrl || null,
    runManifestPath: args.runManifest || job.remote?.runManifestPath || null,
  };
}

function appendAttempt(job, event) {
  if (!Array.isArray(job.attempts)) job.attempts = [];
  job.attempts.push({ at: nowIso(), ...event });
}

async function update(args, mutator) {
  const { projectDir, manifest } = manifestPath(args);
  return withLock(manifest, async () => {
    const data = readJson(manifest, { schemaVersion: 1, provider: 'heygen', maxConcurrency: 1, jobs: [] });
    const result = await mutator({ projectDir, manifest, data });
    writeJsonAtomic(manifest, data);
    return result;
  });
}

async function claim(args) {
  if (!args.jobId) throw new Error('Missing --job-id.');
  return update(args, ({ data }) => {
    const job = findJob(data, args.jobId);
    if (job.status === 'frozen') throw new Error(`Job already frozen: ${args.jobId}`);
    const claimable = job.status === 'ready' || job.status === 'failed' || (job.status === 'claimed' && isExpired(job));
    if (!claimable) throw new Error(`Job is not claimable: ${args.jobId} (${job.status})`);
    if (Array.isArray(job.issues) && job.issues.length) throw new Error(`Job has blocking issues: ${job.issues.join(', ')}`);
    const token = crypto.randomUUID();
    const workerId = args.workerId || `worker-${process.pid}`;
    job.status = 'claimed';
    job.claim = {
      claimedBy: workerId,
      claimedAt: nowIso(),
      leaseExpiresAt: expiresIso(args.leaseMinutes || 180),
      claimToken: token,
    };
    job.error = null;
    job.updatedAt = nowIso();
    appendAttempt(job, { event: 'claimed', workerId });
    return { ok: true, jobId: job.jobId, status: job.status, claimToken: token, leaseExpiresAt: job.claim.leaseExpiresAt, job };
  });
}

async function setStatus(args) {
  if (!args.jobId) throw new Error('Missing --job-id.');
  if (!args.status) throw new Error('Missing --status.');
  const allowed = new Set(['submitted', 'processing', 'waiting']);
  if (!allowed.has(args.status)) throw new Error(`Invalid --status for status command: ${args.status}`);
  return update(args, ({ data }) => {
    const job = findJob(data, args.jobId);
    assertToken(job, args.claimToken);
    job.status = args.status;
    setRemote(job, args);
    job.updatedAt = nowIso();
    appendAttempt(job, { event: args.status, remote: job.remote });
    return { ok: true, jobId: job.jobId, status: job.status, job };
  });
}

async function freeze(args) {
  if (!args.jobId) throw new Error('Missing --job-id.');
  if (!args.localPath) throw new Error('Missing --local-path.');
  return update(args, ({ projectDir, data }) => {
    const job = findJob(data, args.jobId);
    assertToken(job, args.claimToken);
    const local = path.resolve(projectDir, args.localPath);
    assertInside(projectDir, local, 'Frozen local path');
    if (!fs.existsSync(local)) throw new Error(`Missing frozen file: ${local}`);
    job.status = 'frozen';
    job.outputPath = args.localPath.replace(/\\/g, '/');
    setRemote(job, args);
    job.claim = {
      claimedBy: null,
      claimedAt: null,
      leaseExpiresAt: null,
      claimToken: null,
    };
    job.error = null;
    job.frozenAt = nowIso();
    job.updatedAt = job.frozenAt;
    appendAttempt(job, { event: 'frozen', localPath: job.outputPath, remote: job.remote });
    return { ok: true, jobId: job.jobId, status: job.status, outputPath: job.outputPath, job };
  });
}

async function fail(args) {
  if (!args.jobId) throw new Error('Missing --job-id.');
  if (!args.error) throw new Error('Missing --error.');
  return update(args, ({ data }) => {
    const job = findJob(data, args.jobId);
    assertToken(job, args.claimToken);
    job.status = 'failed';
    job.error = args.error;
    job.updatedAt = nowIso();
    appendAttempt(job, { event: 'failed', error: args.error });
    return { ok: true, jobId: job.jobId, status: job.status, error: job.error, job };
  });
}

async function release(args) {
  if (!args.jobId) throw new Error('Missing --job-id.');
  return update(args, ({ data }) => {
    const job = findJob(data, args.jobId);
    assertToken(job, args.claimToken);
    job.status = 'ready';
    job.claim = {
      claimedBy: null,
      claimedAt: null,
      leaseExpiresAt: null,
      claimToken: null,
    };
    job.updatedAt = nowIso();
    appendAttempt(job, { event: 'released' });
    return { ok: true, jobId: job.jobId, status: job.status, job };
  });
}

async function list(args) {
  const { manifest } = manifestPath(args);
  const data = readJson(manifest, { schemaVersion: 1, provider: 'heygen', maxConcurrency: 1, jobs: [] });
  return {
    ok: true,
    manifest,
    maxConcurrency: data.maxConcurrency || 1,
    jobs: (data.jobs || []).map((job) => ({
      jobId: job.jobId,
      segmentId: job.segmentId,
      status: job.status,
      issues: job.issues || [],
      claimedBy: job.claim?.claimedBy || null,
      leaseExpiresAt: job.claim?.leaseExpiresAt || null,
      outputPath: job.outputPath,
      requestFingerprint: job.requestFingerprint,
    })),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.command || !args.project) {
    usage();
    process.exit(args.help ? 0 : 2);
  }
  const commands = { claim, status: setStatus, freeze, fail, release, list };
  const fn = commands[args.command];
  if (!fn) throw new Error(`Unknown command: ${args.command}`);
  const result = await fn(args);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
