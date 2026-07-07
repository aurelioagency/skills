#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error(`Usage:
  node audit-splice-silence.mjs --project <project-root> [--noise -35dB] [--min-silence 0.3] [--max-head 0.45] [--max-tail 0.45] [--max-splice-gap 0.9] [--output manifests/audits/splice-silence.json]

Read-only audio gate. Measures head/tail silence of every segment audio (generated
and user-provided) with ffmpeg silencedetect, projects the dead-air pause at every
splice (tail of previous segment + head of next segment, per assemble.json variant),
and fails before any render when a head, tail, or projected splice gap exceeds the
budget. Audit output must stay under manifests/audits/.`);
}

function parseArgs(argv) {
  const args = {
    noise: '-35dB',
    minSilenceS: 0.3,
    maxHeadS: 0.45,
    maxTailS: 0.45,
    maxSpliceGapS: 0.9,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--noise') args.noise = String(argv[++i]);
    else if (item === '--min-silence') args.minSilenceS = Number(argv[++i]);
    else if (item === '--max-head') args.maxHeadS = Number(argv[++i]);
    else if (item === '--max-tail') args.maxTailS = Number(argv[++i]);
    else if (item === '--max-splice-gap') args.maxSpliceGapS = Number(argv[++i]);
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--output') args.output = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  if (!/dB$/i.test(args.noise)) args.noise = `${args.noise}dB`;
  for (const key of ['minSilenceS', 'maxHeadS', 'maxTailS', 'maxSpliceGapS']) {
    if (!Number.isFinite(args[key]) || args[key] < 0) throw new Error(`Invalid --${key.replace(/S$/, '').replace(/([A-Z])/g, '-$1').toLowerCase()}: ${args[key]}`);
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

function findFfmpeg(explicit) {
  const ffmpeg = explicit || process.env.FFMPEG_PATH || 'ffmpeg';
  return ffmpeg;
}

function normalizeSegments(raw) {
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw?.segments) ? raw.segments : [];
}

function normalizeAudioMeta(raw) {
  const map = new Map();
  if (raw && typeof raw.segments === 'object' && raw.segments && !Array.isArray(raw.segments)) {
    for (const [id, entry] of Object.entries(raw.segments)) map.set(id, entry || {});
  }
  const voices = Array.isArray(raw?.voices) ? raw.voices : [];
  for (const voice of voices) {
    const id = voice?.id || voice?.segment;
    if (id && !map.has(id)) map.set(id, voice);
  }
  return map;
}

function metaDuration(entry) {
  const value = Number(entry?.durationSec ?? entry?.durationSeconds ?? entry?.duration_s ?? 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function resolveSegmentAudio(projectDir, segment, metaEntry) {
  const candidates = [
    { rel: segment.audioPath, kind: 'segment-audio' },
    { rel: `assets/voice/${segment.id}.wav`, kind: 'voice-wav' },
    { rel: metaEntry?.source, kind: 'audio-meta-source' },
    { rel: segment.renderPath, kind: 'avatar-clip' },
    { rel: segment.avatarPath, kind: 'avatar-clip' },
  ];
  for (const candidate of candidates) {
    if (!candidate.rel) continue;
    const resolved = path.resolve(projectDir, String(candidate.rel).replace(/\//g, path.sep));
    if (!fs.existsSync(resolved)) continue;
    assertInside(projectDir, resolved, 'Segment audio');
    return { path: resolved, rel: path.relative(projectDir, resolved).replace(/\\/g, '/'), kind: candidate.kind };
  }
  return null;
}

function parseClock(text) {
  const match = /(\d+):(\d\d):(\d\d(?:\.\d+)?)/.exec(text);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function measureSilence(ffmpeg, filePath, noise, minSilenceS) {
  const proc = spawnSync(ffmpeg, [
    '-hide_banner',
    '-i', filePath,
    '-vn',
    '-af', `silencedetect=noise=${noise}:d=${minSilenceS}`,
    '-f', 'null', '-',
  ], { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (proc.error) throw proc.error;
  const stderr = String(proc.stderr || '');
  if (proc.status !== 0) {
    return { error: `ffmpeg exited with status ${proc.status}: ${stderr.trim().split('\n').slice(-3).join(' | ')}` };
  }

  let headerDurationS = null;
  const durationMatch = /Duration:\s*([\d:.]+)/.exec(stderr);
  if (durationMatch) headerDurationS = parseClock(durationMatch[1]);
  let decodedDurationS = null;
  const timeMatches = stderr.match(/time=([\d:.]+)/g);
  if (timeMatches && timeMatches.length) decodedDurationS = parseClock(timeMatches[timeMatches.length - 1]);
  const fileDurationS = decodedDurationS || headerDurationS;

  const silences = [];
  let open = null;
  const lineRe = /silence_(start|end):\s*(-?[\d.eE+]+)/g;
  let match;
  while ((match = lineRe.exec(stderr)) !== null) {
    const value = Number(match[2]);
    if (match[1] === 'start') {
      open = { startS: Math.max(0, value), endS: null };
      silences.push(open);
    } else if (open) {
      open.endS = value;
      open = null;
    }
  }
  // A file that ends while still silent reports silence_start with no silence_end.
  for (const interval of silences) {
    if (interval.endS === null && fileDurationS !== null) interval.endS = fileDurationS;
  }
  return { fileDurationS, silences };
}

function headTail(silences, effectiveEndS) {
  let headSilenceS = 0;
  let tailSilenceS = 0;
  for (const interval of silences) {
    const endS = interval.endS === null ? effectiveEndS : interval.endS;
    if (interval.startS <= 0.05) {
      headSilenceS = Math.max(headSilenceS, Math.min(endS, effectiveEndS) - interval.startS);
    }
    if (interval.startS < effectiveEndS && endS >= effectiveEndS - 0.05) {
      tailSilenceS = Math.max(tailSilenceS, effectiveEndS - interval.startS);
    }
  }
  return {
    headSilenceS: Number(Math.max(0, headSilenceS).toFixed(3)),
    tailSilenceS: Number(Math.max(0, tailSilenceS).toFixed(3)),
  };
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
  const segmentsPath = path.join(manifestsDir, 'segments.json');
  const audioMetaPath = path.join(manifestsDir, 'audio-meta.json');
  const assemblePath = path.join(manifestsDir, 'assemble.json');
  const outputPath = path.resolve(projectDir, args.output || 'manifests/audits/splice-silence.json');
  assertInside(projectDir, outputPath, 'Audit output');
  assertAuditOutput(projectDir, outputPath);
  const ffmpeg = findFfmpeg(args.ffmpeg);

  const issues = [];
  const recommendations = [];
  if (!fs.existsSync(segmentsPath)) addIssue(issues, 'error', 'missing-manifest', 'Missing segments manifest.', { path: 'manifests/segments.json' });
  if (!fs.existsSync(audioMetaPath)) addIssue(issues, 'warning', 'missing-manifest', 'Missing audio-meta manifest; effective durations fall back to file/segment durations.', { path: 'manifests/audio-meta.json' });

  const segments = normalizeSegments(readJson(segmentsPath, { segments: [] }));
  const audioMeta = normalizeAudioMeta(readJson(audioMetaPath, {}));
  const assemble = readJson(assemblePath, null);

  const measured = new Map();
  const segmentReports = [];
  for (const segment of segments) {
    const id = segment.id || segment.segmentId;
    if (!id) continue;
    const metaEntry = audioMeta.get(id) || null;
    const audio = resolveSegmentAudio(projectDir, { ...segment, id }, metaEntry);
    if (!audio) {
      addIssue(issues, 'error', 'audio-not-found', `No audio source found for segment "${id}".`, { segmentId: id });
      continue;
    }
    const result = measureSilence(ffmpeg, audio.path, args.noise, args.minSilenceS);
    if (result.error) {
      addIssue(issues, 'error', 'silencedetect-failed', `silencedetect failed for segment "${id}".`, { segmentId: id, audio: audio.rel, detail: result.error });
      continue;
    }

    const manifestDurations = [metaDuration(metaEntry), metaDuration(segment)].filter((value) => value !== null);
    const fileDurationS = result.fileDurationS;
    // Effective end honors manifest trims (durationSec shorter than the file means
    // the segment is cut by duration without modifying the source file).
    let effectiveEndS = fileDurationS;
    if (manifestDurations.length) {
      const manifestMin = Math.min(...manifestDurations);
      effectiveEndS = fileDurationS === null ? manifestMin : Math.min(manifestMin, fileDurationS);
    }
    if (!Number.isFinite(effectiveEndS) || effectiveEndS === null || effectiveEndS <= 0) {
      addIssue(issues, 'error', 'unknown-duration', `Could not determine effective duration for segment "${id}".`, { segmentId: id, audio: audio.rel });
      continue;
    }

    const { headSilenceS, tailSilenceS } = headTail(result.silences, effectiveEndS);
    const report = {
      segmentId: id,
      audio: audio.rel,
      audioSourceKind: audio.kind,
      fileDurationS: fileDurationS === null ? null : Number(fileDurationS.toFixed(3)),
      effectiveDurationS: Number(effectiveEndS.toFixed(3)),
      headSilenceS,
      tailSilenceS,
      silences: result.silences.map((interval) => ({
        startS: Number(interval.startS.toFixed(3)),
        endS: interval.endS === null ? null : Number(interval.endS.toFixed(3)),
      })),
    };
    measured.set(id, report);
    segmentReports.push(report);

    if (headSilenceS > args.maxHeadS) {
      const trimS = Number((headSilenceS - 0.3).toFixed(2));
      addIssue(issues, 'error', 'head-silence-too-long', `Segment "${id}" starts with ${headSilenceS}s of recorded silence (max ${args.maxHeadS}s).`, { segmentId: id, audio: audio.rel, headSilenceS });
      recommendations.push(`Segment "${id}": trim ~${trimS}s from the head of ${audio.rel}, leaving ~0.25-0.35s before the voice. Preserve the original as ${id}-original.${audio.rel.split('.').pop()} and shift ALL word-level transcript timestamps by -${trimS}s (clamp to >= 0), then re-render only the affected segments.`);
    }
    if (tailSilenceS > args.maxTailS) {
      const newDurationS = Number((effectiveEndS - (tailSilenceS - 0.3)).toFixed(3));
      addIssue(issues, 'error', 'tail-silence-too-long', `Segment "${id}" ends with ${tailSilenceS}s of mute tail (max ${args.maxTailS}s).`, { segmentId: id, audio: audio.rel, tailSilenceS });
      recommendations.push(`Segment "${id}": cut the segment duration to last word +0.3s by setting durationSec ~= ${newDurationS} in manifests/audio-meta.json (do not modify the source file), then re-render only the affected segments.`);
    }
  }

  const splices = [];
  const variants = Array.isArray(assemble?.variants) ? assemble.variants : [];
  for (const variant of variants) {
    const parts = Array.isArray(variant.segments) ? variant.segments : [];
    const ids = parts.map((part) => path.basename(String(part), path.extname(String(part))));
    for (let i = 0; i + 1 < ids.length; i += 1) {
      const fromReport = measured.get(ids[i]);
      const toReport = measured.get(ids[i + 1]);
      if (!fromReport || !toReport) {
        addIssue(issues, 'warning', 'splice-segment-not-measured', `Variant "${variant.id}" splice ${ids[i]} -> ${ids[i + 1]} references an unmeasured segment.`, { variant: variant.id, from: ids[i], to: ids[i + 1] });
        continue;
      }
      const projectedGapS = Number((fromReport.tailSilenceS + toReport.headSilenceS).toFixed(3));
      const exceeds = projectedGapS > args.maxSpliceGapS;
      splices.push({
        variant: variant.id,
        from: ids[i],
        to: ids[i + 1],
        tailSilenceS: fromReport.tailSilenceS,
        headSilenceS: toReport.headSilenceS,
        projectedGapS,
        exceeds,
      });
      if (exceeds) {
        addIssue(issues, 'error', 'splice-gap-too-long', `Variant "${variant.id}" splice ${ids[i]} -> ${ids[i + 1]} projects ${projectedGapS}s of dead air (max ${args.maxSpliceGapS}s).`, { variant: variant.id, from: ids[i], to: ids[i + 1], projectedGapS });
        recommendations.push(`Splice ${ids[i]} -> ${ids[i + 1]} (variant "${variant.id}"): reduce tail of "${ids[i]}" (${fromReport.tailSilenceS}s) and/or head of "${ids[i + 1]}" (${toReport.headSilenceS}s) so tail + head <= ${args.maxSpliceGapS}s.`);
      }
    }
  }
  if (!assemble) {
    addIssue(issues, 'warning', 'missing-assemble', 'No assemble.json found; only head/tail silence per segment was audited, splice gaps were not projected.', { path: 'manifests/assemble.json' });
  }

  const report = {
    ok: !issues.some((issue) => issue.severity === 'error'),
    project: projectDir,
    checkedAt: new Date().toISOString(),
    policy: {
      noise: args.noise,
      minSilenceS: args.minSilenceS,
      maxHeadS: args.maxHeadS,
      maxTailS: args.maxTailS,
      maxSpliceGapS: args.maxSpliceGapS,
    },
    segments: segmentReports,
    splices,
    issues,
    recommendations,
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
}

main();
