#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error(`Usage:
  node audit-modular-plan.mjs --project <project-root> [--max-avatar-duration 20] [--max-total-paid-duration 40] [--output manifests/audits/plan-audit.json]

Audits modular script-to-video manifests before any paid HeyGen submission.
Fails on body/middle/full-script paid avatar jobs, mojibake, missing manifests, or blocked provider jobs.
Audit output must stay under manifests/audits/.`);
}

function parseArgs(argv) {
  const args = { maxAvatarDurationS: 20, maxTotalPaidDurationS: 40 };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--max-avatar-duration') args.maxAvatarDurationS = Math.max(1, Number(argv[++i]) || 20);
    else if (item === '--max-total-paid-duration') args.maxTotalPaidDurationS = Math.max(1, Number(argv[++i]) || 40);
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, filePath);
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside project root: ${target}`);
  }
}

function assertAuditOutput(projectDir, target) {
  const auditsDir = path.join(projectDir, 'manifests', 'audits');
  const relative = path.relative(auditsDir, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Audit output must stay under manifests/audits/: ${target}`);
  }
}

function normalizeSegments(raw) {
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw?.segments) ? raw.segments : [];
}

function normalizeLines(raw) {
  return Array.isArray(raw?.lines) ? raw.lines : [];
}

function normalizeJobs(raw) {
  return Array.isArray(raw?.jobs) ? raw.jobs : [];
}

function normalizeVoices(raw) {
  return Array.isArray(raw?.voices) ? raw.voices : [];
}

function compact(value) {
  return String(value || '').trim().toLowerCase();
}

function hasPattern(values, pattern) {
  return values.some((value) => pattern.test(compact(value)));
}

function segmentIdentity(item) {
  return [
    item?.id,
    item?.jobId,
    item?.segmentId,
    item?.kind,
    item?.role,
    item?.type,
    item?.group,
    item?.segmentGroup,
  ];
}

function isPaidJob(job) {
  return job.provider === 'heygen'
    || job.kind === 'avatar'
    || Boolean(job.avatarId)
    || Boolean(job.outputPath && String(job.outputPath).includes('assets/avatar'));
}

function isSubmittable(job) {
  return ['ready', 'claimed', 'submitted', 'processing', 'waiting', 'frozen'].includes(job.status);
}

function findSegment(segments, id) {
  return segments.find((segment) => segment.id === id || segment.segmentId === id) || null;
}

function findVoice(audioMeta, id) {
  return normalizeVoices(audioMeta).find((voice) => voice.id === id || voice.segment === id) || null;
}

function durationFor(job, audioMeta) {
  const voice = findVoice(audioMeta, job.segmentId || job.id);
  return Number(
    job.audioDurationS
    || job.durationSeconds
    || job.duration_s
    || voice?.durationSeconds
    || voice?.duration_s
    || 0,
  ) || 0;
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

function detectMojibake(value) {
  const strings = collectStrings(value);
  const pattern = /Ã|Â|â€|â€œ|â€\u009d|�|podÃ|dÃ|sÃ|quÃ|cuÃ|tenÃ|soluciÃ|especificaciÃ/i;
  return strings
    .filter((text) => pattern.test(text))
    .slice(0, 25)
    .map((text) => text.length > 180 ? `${text.slice(0, 177)}...` : text);
}

function addIssue(issues, severity, code, message, data = {}) {
  issues.push({ severity, code, message, ...data });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const manifestsDir = path.join(projectDir, 'manifests');
  const paths = {
    project: path.join(manifestsDir, 'project.json'),
    segments: path.join(manifestsDir, 'segments.json'),
    audioRequest: path.join(manifestsDir, 'audio-request.json'),
    audioMeta: path.join(manifestsDir, 'audio-meta.json'),
    heygenJobs: path.join(manifestsDir, 'heygen-jobs.json'),
    paidAssets: path.join(manifestsDir, 'paid-assets.json'),
  };
  const outputPath = path.resolve(projectDir, args.output || 'manifests/audits/plan-audit.json');
  assertInside(projectDir, outputPath, 'Audit output');
  assertAuditOutput(projectDir, outputPath);

  const issues = [];
  for (const [name, filePath] of Object.entries(paths)) {
    if (!fs.existsSync(filePath)) addIssue(issues, 'error', 'missing-manifest', `Missing ${name} manifest.`, { path: path.relative(projectDir, filePath).replace(/\\/g, '/') });
  }

  const project = readJson(paths.project, {});
  const segmentsManifest = readJson(paths.segments, { segments: [] });
  const audioRequest = readJson(paths.audioRequest, { lines: [] });
  const audioMeta = readJson(paths.audioMeta, { voices: [] });
  const jobsManifest = readJson(paths.heygenJobs, { jobs: [] });
  const segments = normalizeSegments(segmentsManifest);
  const lines = normalizeLines(audioRequest);
  const jobs = normalizeJobs(jobsManifest);

  const sourceScript = project.sourceScript || project.scriptPath || project.projectScript || null;
  if (sourceScript && !String(sourceScript).match(/\.(md|markdown|txt)$/i)) {
    addIssue(issues, 'warning', 'unexpected-source-extension', 'Source script is not a Markdown/text path.', { sourceScript });
  }

  for (const [name, value] of [
    ['segments', segmentsManifest],
    ['audio-request', audioRequest],
    ['heygen-jobs', jobsManifest],
  ]) {
    const mojibake = detectMojibake(value);
    if (mojibake.length) {
      addIssue(issues, 'error', 'mojibake-detected', `Detected mojibake in ${name}; fix UTF-8 before TTS/provider work.`, { examples: mojibake });
    }
  }

  const compositePattern = /(^|[-_])(full|whole|complete|combined|all|deliverable)([-_]|$)/i;
  const bodyPattern = /(^|[-_])(body|middle|animation|motion|shared[-_]body|shared[-_]middle)(\d+)?([-_]|$)/i;
  const avatarAllowedPattern = /^(opening|intro|outro|closing)(\d+)?([-_].*)?$/i;

  for (const segment of segments) {
    const id = compact(segment.id);
    const marksHeyGen = segment.provider === 'heygen'
      || segment.requiresHeyGen === true
      || segment.heygen === true
      || segment.kind === 'avatar'
      || Boolean(segment.heygenJobId);
    if (!marksHeyGen) continue;
    if (hasPattern(segmentIdentity(segment), compositePattern)) {
      addIssue(issues, 'error', 'composite-avatar-segment', 'Composite/full segment is marked for HeyGen.', { segmentId: segment.id });
    }
    if (hasPattern(segmentIdentity(segment), bodyPattern)) {
      addIssue(issues, 'error', 'body-middle-avatar-segment', 'Body/middle segment is marked for HeyGen instead of local animation.', { segmentId: segment.id });
    }
    if (!avatarAllowedPattern.test(id)) {
      addIssue(issues, 'error', 'avatar-segment-id-not-opening-or-outro', 'HeyGen segment id must be opening/intro/outro/closing in modular workflow.', { segmentId: segment.id });
    }
  }

  for (const line of lines) {
    if (hasPattern(segmentIdentity(line), compositePattern)) {
      addIssue(issues, 'error', 'composite-audio-line', 'Audio request includes a full/composite line. Split intro, body, and outro before TTS/provider work.', { lineId: line.id, role: line.role });
    }
  }

  const paidJobs = jobs.filter(isPaidJob);
  const submittablePaidJobs = paidJobs.filter(isSubmittable);
  const blockedJobs = paidJobs.filter((job) => job.status === 'blocked' || (Array.isArray(job.issues) && job.issues.length));
  for (const job of paidJobs) {
    const segment = findSegment(segments, job.segmentId) || {};
    const id = compact(job.segmentId || job.jobId);
    const identities = [...segmentIdentity(job), ...segmentIdentity(segment)];
    const duration = durationFor(job, audioMeta);
    if (hasPattern(identities, compositePattern)) {
      addIssue(issues, 'error', 'composite-paid-job', 'Paid HeyGen job is a composite/full-script segment.', { jobId: job.jobId, segmentId: job.segmentId, status: job.status });
    }
    if (hasPattern(identities, bodyPattern)) {
      addIssue(issues, 'error', 'body-middle-paid-job', 'Paid HeyGen job targets body/middle animation content.', { jobId: job.jobId, segmentId: job.segmentId, status: job.status });
    }
    if (!avatarAllowedPattern.test(id)) {
      addIssue(issues, 'error', 'paid-job-id-not-opening-or-outro', 'Paid HeyGen job id must target opening/intro/outro/closing only.', { jobId: job.jobId, segmentId: job.segmentId, status: job.status });
    }
    if (duration > args.maxAvatarDurationS) {
      addIssue(issues, 'error', 'paid-job-too-long', `Paid HeyGen job exceeds ${args.maxAvatarDurationS}s per-segment limit.`, { jobId: job.jobId, segmentId: job.segmentId, durationSeconds: duration });
    }
  }

  for (const job of blockedJobs) {
    addIssue(issues, 'error', 'blocked-heygen-job-present', 'Fix blocked HeyGen jobs before provider submission.', { jobId: job.jobId, segmentId: job.segmentId, status: job.status, jobIssues: job.issues || [] });
  }

  const expectedPaidDurationS = Number(submittablePaidJobs.reduce((sum, job) => sum + durationFor(job, audioMeta), 0).toFixed(3));
  if (expectedPaidDurationS > args.maxTotalPaidDurationS) {
    addIssue(issues, 'error', 'total-paid-duration-too-long', `Expected paid HeyGen duration exceeds ${args.maxTotalPaidDurationS}s total.`, { expectedPaidDurationS });
  }

  const bodySegments = segments.filter((segment) => hasPattern(segmentIdentity(segment), bodyPattern));
  const bodyMarkedLocal = bodySegments.filter((segment) => !(
    segment.provider === 'heygen'
    || segment.requiresHeyGen === true
    || segment.heygen === true
    || segment.kind === 'avatar'
  )).length;

  const report = {
    ok: !issues.some((issue) => issue.severity === 'error'),
    project: projectDir,
    checkedAt: new Date().toISOString(),
    policy: {
      modularDefault: true,
      maxAvatarDurationS: args.maxAvatarDurationS,
      maxTotalPaidDurationS: args.maxTotalPaidDurationS,
    },
    summary: {
      sourceScript,
      segments: segments.length,
      audioLines: lines.length,
      heygenJobs: paidJobs.length,
      submittablePaidJobs: submittablePaidJobs.map((job) => ({
        jobId: job.jobId,
        segmentId: job.segmentId,
        status: job.status,
        durationSeconds: durationFor(job, audioMeta),
      })),
      expectedPaidDurationS,
      bodyOrMiddleSegments: bodySegments.length,
      bodyOrMiddleMarkedLocal: bodyMarkedLocal,
    },
    issues,
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main();
