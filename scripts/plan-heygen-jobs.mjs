#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error(`Usage:
  node plan-heygen-jobs.mjs --project <project-root> --all
  node plan-heygen-jobs.mjs --project <project-root> --segment opening1
  node plan-heygen-jobs.mjs --project <project-root> --all --max-avatar-duration 20

Creates or updates manifests/heygen-jobs.json without making provider/API calls.
Only explicit HeyGen/avatar segments are planned.
Modular projects block body/middle/full-script paid avatar jobs by default.
Use --allow-full-avatar only when the user explicitly asks for a direct full-avatar exception.`);
}

function parseArgs(argv) {
  const args = { segments: [], maxAvatarDurationS: 20, maxAvatarTextChars: 700 };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--segment') args.segments.push(argv[++i]);
    else if (item === '--all') args.all = true;
    else if (item === '--concurrency') args.concurrency = Math.max(1, Number(argv[++i]) || 1);
    else if (item === '--allow-full-avatar') args.allowFullAvatar = true;
    else if (item === '--max-avatar-duration') args.maxAvatarDurationS = Math.max(1, Number(argv[++i]) || 20);
    else if (item === '--max-avatar-text-chars') args.maxAvatarTextChars = Math.max(1, Number(argv[++i]) || 700);
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
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

function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside project root: ${target}`);
  }
}

function resolveProjectPath(projectDir, rel, label) {
  if (!rel) return null;
  const target = path.resolve(projectDir, String(rel));
  assertInside(projectDir, target, label);
  return target;
}

function relativeProjectPath(projectDir, target) {
  return toPosix(path.relative(projectDir, target));
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return `sha256:${hash.digest('hex')}`;
}

function sha256Json(value) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(value));
  return `sha256:${hash.digest('hex')}`;
}

function normalizeSegmentsManifest(raw) {
  if (Array.isArray(raw)) return { schemaVersion: 1, segments: raw };
  if (!raw || typeof raw !== 'object') return { schemaVersion: 1, segments: [] };
  if (!Array.isArray(raw.segments)) raw.segments = [];
  return raw;
}

function findVoice(audioMeta, id) {
  const voices = Array.isArray(audioMeta?.voices) ? audioMeta.voices : [];
  return voices.find((voice) => voice.id === id || voice.segment === id) || null;
}

function findLine(audioRequest, id) {
  const lines = Array.isArray(audioRequest?.lines) ? audioRequest.lines : [];
  return lines.find((line) => line.id === id || line.segment === id) || null;
}

function findPaidAsset(paidAssets, id, fingerprint) {
  const assets = Array.isArray(paidAssets?.paidAssets) ? paidAssets.paidAssets : [];
  return assets.find((asset) => {
    const segmentMatch = asset.segmentId === id || asset.assetId === id || asset.id === id;
    const fingerprintMatch = !fingerprint || asset.requestFingerprint === fingerprint;
    return segmentMatch && fingerprintMatch;
  }) || null;
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim());
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function isHeyGenSegment(segment, explicitlySelected) {
  if (segment.heygen === false || segment.provider === 'none') return false;
  if (explicitlySelected) return true;
  return segment.provider === 'heygen'
    || segment.requiresHeyGen === true
    || segment.heygen === true
    || segment.kind === 'avatar'
    || Boolean(segment.heygenJobId);
}

function compactId(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesAnySegmentField(segment, pattern) {
  return [
    segment.id,
    segment.kind,
    segment.role,
    segment.type,
    segment.group,
    segment.segmentGroup,
  ].some((value) => pattern.test(compactId(value)));
}

function paidAvatarPolicyIssues(segment, job, options) {
  if (options.allowFullAvatar) return [];

  const issues = [];
  const id = compactId(segment.id);
  const compositePattern = /(^|[-_])(full|whole|complete|combined|all|deliverable)([-_]|$)/i;
  const localOnlyPattern = /(^|[-_])(body|middle|animation|motion|shared[-_]body|shared[-_]middle)(\d+)?([-_]|$)/i;
  const avatarOnlyPattern = /^(opening|intro|outro|closing)(\d+)?([-_].*)?$/i;

  if (compositePattern.test(id) || matchesAnySegmentField(segment, compositePattern)) {
    issues.push('paid-avatar-composite-or-full-segment-blocked');
  }

  if (localOnlyPattern.test(id) || matchesAnySegmentField(segment, localOnlyPattern)) {
    issues.push('paid-avatar-body-or-middle-segment-blocked');
  }

  if (!avatarOnlyPattern.test(id)) {
    issues.push('paid-avatar-id-must-be-opening-or-outro');
  }

  if (job.audioDurationS && job.audioDurationS > options.maxAvatarDurationS) {
    issues.push(`paid-avatar-duration-exceeds-${options.maxAvatarDurationS}s`);
  }

  const spokenText = job.sourceText || job.ttsText || '';
  if (spokenText.length > options.maxAvatarTextChars) {
    issues.push(`paid-avatar-text-exceeds-${options.maxAvatarTextChars}-chars`);
  }

  return [...new Set(issues)];
}

function segmentAudioRel(segment, audioMeta) {
  const voice = findVoice(audioMeta, segment.id);
  return firstString(
    segment.audioPath,
    segment.audio,
    segment.voicePath,
    segment.voice?.path,
    voice?.path,
  );
}

function segmentTranscriptRel(segment, audioMeta) {
  const voice = findVoice(audioMeta, segment.id);
  return firstString(
    segment.transcriptPath,
    segment.transcript,
    segment.voice?.transcript,
    voice?.transcript,
  );
}

function segmentOutputRel(segment) {
  return firstString(
    segment.avatarPath,
    segment.avatarOutput,
    segment.heygen?.outputPath,
    segment.avatar?.path,
    `assets/avatar/${segment.id}.mp4`,
  );
}

function buildJob(projectDir, projectManifest, audioMeta, audioRequest, paidAssets, segment, options) {
  const line = findLine(audioRequest, segment.id);
  const audioRel = segmentAudioRel(segment, audioMeta);
  const transcriptRel = segmentTranscriptRel(segment, audioMeta);
  const outputRel = segmentOutputRel(segment);
  const avatarId = firstString(
    segment.avatarId,
    segment.heygen?.avatarId,
    projectManifest.avatarId,
    projectManifest.heygenAvatarId,
  );
  const sourceText = firstString(segment.sourceText, segment.text, line?.text, line?.displayText) || '';
  const ttsText = firstString(segment.ttsText, line?.ttsText, sourceText) || sourceText;
  const audioPath = resolveProjectPath(projectDir, audioRel, `Audio for ${segment.id}`);
  const outputPath = resolveProjectPath(projectDir, outputRel, `Output for ${segment.id}`);
  const transcriptPath = transcriptRel ? resolveProjectPath(projectDir, transcriptRel, `Transcript for ${segment.id}`) : null;
  const now = new Date().toISOString();
  const issues = [];
  let audioSha256 = null;
  let audioDurationS = null;

  if (!avatarId) issues.push('missing-avatar-id');
  if (!audioPath || !fs.existsSync(audioPath)) issues.push('missing-audio');
  else {
    audioSha256 = sha256File(audioPath);
    const voice = findVoice(audioMeta, segment.id);
    audioDurationS = Number(firstDefined(voice?.duration_s, voice?.durationSeconds, segment.durationSeconds, segment.duration_s)) || null;
  }
  if (transcriptPath && !fs.existsSync(transcriptPath)) issues.push('missing-transcript');

  const fingerprintInput = {
    provider: 'heygen',
    segmentId: segment.id,
    avatarId,
    audioSha256,
    sourceText,
    ttsText,
    aspectRatio: segment.aspectRatio || projectManifest.aspectRatio || '9:16',
    resolution: segment.resolution || projectManifest.resolution || '1080p',
  };
  const requestFingerprint = sha256Json(fingerprintInput);
  const matchingPaid = findPaidAsset(paidAssets, segment.id, requestFingerprint);
  const fallbackPaid = matchingPaid || findPaidAsset(paidAssets, segment.id);
  const matchingFrozen = Boolean(
    matchingPaid?.localPath
    && fs.existsSync(resolveProjectPath(projectDir, matchingPaid.localPath, `Paid asset for ${segment.id}`)),
  );
  const localOutputWithoutFingerprint = Boolean(!matchingFrozen && fs.existsSync(outputPath));
  if (localOutputWithoutFingerprint) issues.push('local-output-without-matching-fingerprint');
  issues.push(...paidAvatarPolicyIssues(segment, {
    sourceText,
    ttsText,
    audioDurationS,
  }, options));
  const status = matchingFrozen ? 'frozen' : issues.length ? 'blocked' : 'ready';

  return {
    job: {
      jobId: segment.heygenJobId || `heygen-${segment.id}`,
      segmentId: segment.id,
      kind: 'avatar',
      provider: 'heygen',
      status,
      issues,
      requestFingerprint,
      avatarId: avatarId || null,
      audioPath: audioRel || null,
      audioSha256,
      audioDurationS,
      transcriptPath: transcriptRel || null,
      sourceText,
      ttsText,
      outputPath: outputRel,
      remote: {
        videoId: fallbackPaid?.remote?.videoId || fallbackPaid?.remoteId || null,
        sessionId: fallbackPaid?.remote?.sessionId || fallbackPaid?.sessionId || null,
        pageUrl: fallbackPaid?.remote?.pageUrl || fallbackPaid?.pageUrl || null,
        downloadUrl: fallbackPaid?.remote?.downloadUrl || fallbackPaid?.downloadUrl || null,
        runManifestPath: fallbackPaid?.remote?.runManifestPath || fallbackPaid?.runManifestPath || null,
      },
      claim: {
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
        claimToken: null,
      },
      attempts: [],
      error: null,
      maxConcurrency: options.maxConcurrency,
      paidAvatarPolicy: {
        modularDefault: true,
        allowFullAvatar: Boolean(options.allowFullAvatar),
        maxAvatarDurationS: options.maxAvatarDurationS,
        maxAvatarTextChars: options.maxAvatarTextChars,
      },
      createdAt: segment.heygenJobCreatedAt || now,
      updatedAt: now,
    },
    segmentPatch: {
      heygenJobId: segment.heygenJobId || `heygen-${segment.id}`,
      paidAssetId: segment.paidAssetId || segment.id,
      avatarPath: outputRel,
    },
  };
}

function mergeJobs(existing, planned) {
  const byId = new Map((existing.jobs || []).map((job) => [job.jobId, job]));
  const jobs = [];
  for (const plannedJob of planned) {
    const previous = byId.get(plannedJob.jobId);
    const preserveInFlight = previous
      && ['claimed', 'submitted', 'processing', 'waiting'].includes(previous.status)
      && previous.requestFingerprint === plannedJob.requestFingerprint;
    jobs.push(preserveInFlight
      ? {
        ...plannedJob,
        ...previous,
        issues: plannedJob.issues,
        updatedAt: plannedJob.updatedAt,
      }
      : {
        ...previous,
        ...plannedJob,
        attempts: previous?.attempts || plannedJob.attempts,
        createdAt: previous?.createdAt || plannedJob.createdAt,
        updatedAt: plannedJob.updatedAt,
      });
    byId.delete(plannedJob.jobId);
  }
  return [...jobs, ...byId.values()];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || (!args.all && !args.segments.length)) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const manifestsDir = path.join(projectDir, 'manifests');
  const projectPath = path.join(manifestsDir, 'project.json');
  const segmentsPath = path.join(manifestsDir, 'segments.json');
  const audioRequestPath = path.join(manifestsDir, 'audio-request.json');
  const audioMetaPath = path.join(manifestsDir, 'audio-meta.json');
  const paidAssetsPath = path.join(manifestsDir, 'paid-assets.json');
  const jobsPath = path.join(manifestsDir, 'heygen-jobs.json');

  const projectManifest = readJson(projectPath, {});
  const segmentsManifest = normalizeSegmentsManifest(readJson(segmentsPath, { schemaVersion: 1, segments: [] }));
  const audioRequest = readJson(audioRequestPath, {});
  const audioMeta = readJson(audioMetaPath, {});
  const paidAssets = readJson(paidAssetsPath, {});
  const existingJobs = readJson(jobsPath, { schemaVersion: 1, provider: 'heygen', maxConcurrency: args.concurrency || 2, jobs: [] });
  const selected = new Set(args.segments);
  const maxConcurrency = args.concurrency || existingJobs.maxConcurrency || 2;
  const options = {
    maxConcurrency,
    allowFullAvatar: Boolean(args.allowFullAvatar),
    maxAvatarDurationS: args.maxAvatarDurationS,
    maxAvatarTextChars: args.maxAvatarTextChars,
  };

  const planned = [];
  for (const segment of segmentsManifest.segments) {
    const explicitlySelected = selected.has(segment.id);
    if (!args.all && !explicitlySelected) continue;
    if (!isHeyGenSegment(segment, explicitlySelected)) continue;
    const { job, segmentPatch } = buildJob(projectDir, projectManifest, audioMeta, audioRequest, paidAssets, segment, options);
    planned.push(job);
    Object.assign(segment, segmentPatch);
  }

  const jobsManifest = {
    schemaVersion: 1,
    provider: 'heygen',
    maxConcurrency,
    jobs: mergeJobs(existingJobs, planned),
  };
  writeJsonAtomic(jobsPath, jobsManifest);
  writeJsonAtomic(segmentsPath, segmentsManifest);

  console.log(JSON.stringify({
    ok: true,
    project: projectDir,
    manifest: jobsPath,
    paidAvatarPolicy: {
      modularDefault: true,
      allowFullAvatar: options.allowFullAvatar,
      maxAvatarDurationS: options.maxAvatarDurationS,
      maxAvatarTextChars: options.maxAvatarTextChars,
      plannedAudioDurationS: Number(planned.reduce((sum, job) => sum + (Number(job.audioDurationS) || 0), 0).toFixed(3)),
      expectedPaidDurationS: Number(planned
        .filter((job) => job.status !== 'blocked')
        .reduce((sum, job) => sum + (Number(job.audioDurationS) || 0), 0).toFixed(3)),
      blockedJobs: planned.filter((job) => job.status === 'blocked').map((job) => ({
        jobId: job.jobId,
        segmentId: job.segmentId,
        issues: job.issues,
      })),
    },
    planned: planned.map((job) => ({
      jobId: job.jobId,
      segmentId: job.segmentId,
      status: job.status,
      issues: job.issues,
      outputPath: job.outputPath,
      requestFingerprint: job.requestFingerprint,
    })),
  }, null, 2));
}

main();
