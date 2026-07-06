#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  console.error(`Usage:
  node render-avatar-video-project.mjs --project <project-root> --segment middle
  node render-avatar-video-project.mjs --project <project-root> --variant opening2
  node render-avatar-video-project.mjs --project <project-root> --assemble-only
  node render-avatar-video-project.mjs --project <project-root> --all

Options:
  --concurrency <n>   Run independent dirty segment renders in parallel. Default: 1.
  --force             Rebuild selected segments and assemblies even when outputs are newer.
  --plan-only         Print the dirty plan without running build/render/assemble commands.
  --skip-assemble     Render selected dirty segments but do not assemble final variants.
  --ffmpeg <path>     Pass an ffmpeg path through to render/assemble scripts.

Reads manifests/*.json, prepares segment-specific public/index.html plus a storyboard under
manifests/.render-work/, skips clean outputs, and assembles affected variants.`);
}

function parseArgs(argv) {
  const args = {
    segments: [],
    variants: [],
    concurrency: 1,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--segment') args.segments.push(argv[++i]);
    else if (item === '--variant') args.variants.push(argv[++i]);
    else if (item === '--all') args.all = true;
    else if (item === '--assemble-only') args.assembleOnly = true;
    else if (item === '--skip-assemble') args.skipAssemble = true;
    else if (item === '--force') args.force = true;
    else if (item === '--plan-only') args.planOnly = true;
    else if (item === '--concurrency') args.concurrency = Math.max(1, Number(argv[++i]) || 1);
    else if (item === '--ffmpeg') args.ffmpeg = argv[++i];
    else if (item === '--renderer') args.renderer = argv[++i];
    else if (item === '--assembler') args.assembler = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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

function resolveProjectPath(projectDir, value, label) {
  if (!value || /^https?:\/\//i.test(String(value))) return null;
  const target = path.resolve(projectDir, String(value));
  assertInside(projectDir, target, label);
  return target;
}

function relativeProjectPath(projectDir, target) {
  return toPosix(path.relative(projectDir, target));
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim());
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function firstExistingPath(...values) {
  return values.find((value) => value && fs.existsSync(value)) || values.find(Boolean);
}

function findVoice(audioMeta, id) {
  const voices = Array.isArray(audioMeta?.voices) ? audioMeta.voices : [];
  return voices.find((voice) => voice.id === id || voice.segment === id) || null;
}

function findPaidAsset(paidAssets, id) {
  const assets = Array.isArray(paidAssets?.paidAssets) ? paidAssets.paidAssets : [];
  return assets.find((asset) => asset.assetId === id || asset.segment === id || asset.id === id) || null;
}

function normalizeSegmentsManifest(raw) {
  if (Array.isArray(raw)) return { schemaVersion: 1, segments: raw };
  if (!raw || typeof raw !== 'object') return { schemaVersion: 1, segments: [] };
  if (!Array.isArray(raw.segments)) raw.segments = [];
  return raw;
}

function segmentOutputRel(segment) {
  return firstString(
    segment.renderPath,
    segment.outputPath,
    segment.output,
    segment.render?.path,
    segment.render?.output,
    `renders/segments/${segment.id}.mp4`,
  );
}

function segmentStoryboardRel(segment) {
  return firstString(
    segment.storyboardPath,
    segment.storyboard,
    segment.render?.storyboard,
    segment.composition?.storyboard,
    `manifests/.render-work/${segment.id}.storyboard.json`,
  );
}

function segmentIndexSourceRel(segment) {
  return firstString(
    segment.indexHtml,
    segment.html,
    segment.publicIndex,
    segment.render?.indexHtml,
    segment.composition?.indexHtml,
  );
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

function segmentAudioBrowserSrc(projectDir, publicDir, segment, audioMeta) {
  const voice = findVoice(audioMeta, segment.id);
  if (voice?.browserSrc) return voice.browserSrc;
  const rel = segmentAudioRel(segment, audioMeta);
  if (!rel) return null;
  const audioPath = resolveProjectPath(projectDir, rel, `Audio for ${segment.id}`);
  return audioPath ? toPosix(path.relative(publicDir, audioPath)) : null;
}

function segmentAvatarRel(segment, paidAssets) {
  const paid = findPaidAsset(paidAssets, segment.id);
  return firstString(
    segment.avatarPath,
    segment.avatar,
    segment.avatar?.path,
    segment.render?.avatarPath,
    paid?.localPath,
  );
}

function addDependency(dependencies, projectDir, relOrAbs, label) {
  if (!relOrAbs || /^https?:\/\//i.test(String(relOrAbs))) return;
  const target = path.isAbsolute(String(relOrAbs))
    ? path.resolve(String(relOrAbs))
    : path.resolve(projectDir, String(relOrAbs));
  assertInside(projectDir, target, label);
  dependencies.add(target);
}

function segmentDependencies(context, segment) {
  const deps = new Set([
    context.projectManifestPath,
    context.segmentsManifestPath,
  ]);
  if (fs.existsSync(context.audioMetaPath)) deps.add(context.audioMetaPath);
  if (fs.existsSync(context.paidAssetsPath)) deps.add(context.paidAssetsPath);
  if (fs.existsSync(context.sourceBuildCompositionPath)) deps.add(context.sourceBuildCompositionPath);
  if (fs.existsSync(context.legacyBuildCompositionPath)) deps.add(context.legacyBuildCompositionPath);
  if (fs.existsSync(context.projectScriptPath)) deps.add(context.projectScriptPath);
  if (fs.existsSync(context.legacyProjectScriptPath)) deps.add(context.legacyProjectScriptPath);

  addDependency(deps, context.projectDir, segment.sourcePath, `Source for ${segment.id}`);
  addDependency(deps, context.projectDir, segmentIndexSourceRel(segment), `Index source for ${segment.id}`);
  addDependency(deps, context.projectDir, segmentStoryboardRel(segment), `Storyboard for ${segment.id}`);
  addDependency(deps, context.projectDir, segmentAudioRel(segment, context.audioMeta), `Audio for ${segment.id}`);
  addDependency(deps, context.projectDir, segmentAvatarRel(segment, context.paidAssets), `Avatar for ${segment.id}`);

  const extra = segment.dependencies || segment.render?.dependencies || segment.composition?.dependencies || [];
  for (const item of Array.isArray(extra) ? extra : [extra]) {
    addDependency(deps, context.projectDir, item, `Dependency for ${segment.id}`);
  }
  return Array.from(deps);
}

function newestMtime(paths) {
  let newest = 0;
  for (const item of paths) {
    if (!item || !fs.existsSync(item)) continue;
    newest = Math.max(newest, fs.statSync(item).mtimeMs);
  }
  return newest;
}

function isSegmentDirty(context, segment) {
  const outputRel = segmentOutputRel(segment);
  const output = resolveProjectPath(context.projectDir, outputRel, `Output for ${segment.id}`);
  const dependencies = segmentDependencies(context, segment);
  const reasons = [];
  if (context.args.force) reasons.push('forced');
  if (segment.dirty === true || segment.status === 'dirty') reasons.push('manifest-dirty');
  if (!fs.existsSync(output)) reasons.push('missing-output');
  else if (newestMtime(dependencies) > fs.statSync(output).mtimeMs) reasons.push('dependency-newer-than-output');
  return {
    id: segment.id,
    output: outputRel,
    outputPath: output,
    dependencies: dependencies.map((item) => relativeProjectPath(context.projectDir, item)),
    dirty: reasons.length > 0,
    reasons,
  };
}

function variantOutputRel(context, variant) {
  const slug = context.projectManifest.slug || path.basename(context.projectDir);
  return firstString(variant.output, variant.renderPath, `renders/final/${slug}-${variant.id}.mp4`);
}

function segmentEntryToId(context, entry) {
  if (typeof entry === 'object' && entry) return entry.id || entry.segment || null;
  if (typeof entry !== 'string') return null;
  if (context.segmentMap.has(entry)) return entry;
  for (const segment of context.segments) {
    const outputRel = segmentOutputRel(segment);
    if (toPosix(entry) === outputRel || path.basename(entry, path.extname(entry)) === segment.id) return segment.id;
  }
  return null;
}

function segmentEntryToPath(context, entry) {
  if (typeof entry === 'object' && entry) {
    const id = entry.id || entry.segment;
    if (id && context.segmentMap.has(id)) return segmentOutputRel(context.segmentMap.get(id));
    return firstString(entry.path, entry.output, entry.renderPath);
  }
  if (typeof entry === 'string' && context.segmentMap.has(entry)) return segmentOutputRel(context.segmentMap.get(entry));
  return entry;
}

function normalizeVariantForAssembly(context, variant) {
  return {
    ...variant,
    segments: (variant.segments || []).map((entry) => segmentEntryToPath(context, entry)),
    output: variantOutputRel(context, variant),
  };
}

function postprocessForVariant(context, variant) {
  return {
    ...(context.assembleManifest.postprocess || {}),
    ...(variant.postprocess || {}),
  };
}

function variantDependencies(context, variant) {
  const normalized = normalizeVariantForAssembly(context, variant);
  const segmentPaths = normalized.segments.map((item) => resolveProjectPath(context.projectDir, item, `Segment for variant ${variant.id}`));
  const dependencies = [context.assembleManifestPath, ...segmentPaths];
  const musicPath = postprocessForVariant(context, variant).backgroundMusic?.path;
  if (musicPath) {
    dependencies.push(resolveProjectPath(context.projectDir, musicPath, `Background music for variant ${variant.id}`));
  }
  return dependencies.filter(Boolean);
}

function variantUsesSegment(context, variant, segmentId) {
  return (variant.segments || []).some((entry) => segmentEntryToId(context, entry) === segmentId);
}

function isVariantDirty(context, variant) {
  const normalized = normalizeVariantForAssembly(context, variant);
  const output = resolveProjectPath(context.projectDir, normalized.output, `Output for variant ${variant.id}`);
  const dependencies = variantDependencies(context, variant);
  const reasons = [];
  if (context.args.force) reasons.push('forced');
  if (variant.dirty === true || variant.status === 'dirty') reasons.push('manifest-dirty');
  if (!fs.existsSync(output)) reasons.push('missing-output');
  else if (newestMtime(dependencies) > fs.statSync(output).mtimeMs) {
    reasons.push('dependency-newer-than-output');
  }
  return {
    id: variant.id,
    output: normalized.output,
    segments: normalized.segments,
    dependencies: dependencies.map((item) => relativeProjectPath(context.projectDir, item)),
    dirty: reasons.length > 0,
    reasons,
  };
}

function replaceTokens(value, replacements) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (Object.hasOwn(replacements, key)) return replacements[key];
    return match;
  });
}

function manifestCommand(context, segment, storyboardPath) {
  const command = segment.buildCommand
    || segment.build?.command
    || segment.render?.buildCommand
    || context.projectManifest.segmentBuildCommand
    || context.projectManifest.buildCommand;
  if (!command) return null;
  const output = resolveProjectPath(context.projectDir, segmentOutputRel(segment), `Output for ${segment.id}`);
  const replacements = {
    project: context.projectDir,
    public: context.publicDir,
    index: context.indexPath,
    segment: segment.id,
    output,
    storyboard: storyboardPath,
    sourceScript: context.projectScriptPath,
    sourceDir: path.join(context.projectDir, 'source'),
    buildComposition: context.buildCompositionPath,
    script: context.projectScriptPath,
  };
  if (Array.isArray(command)) return command.map((item) => replaceTokens(item, replacements));
  return replaceTokens(command, replacements);
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const printable = Array.isArray(command) ? command.join(' ') : command;
    console.log(printable);
    const child = Array.isArray(command)
      ? spawn(command[0], command.slice(1), { stdio: 'inherit', windowsHide: true, ...options })
      : spawn(command, { stdio: 'inherit', shell: true, windowsHide: true, ...options });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with status ${code}: ${printable}`));
    });
  });
}

function createFallbackStoryboard(context, segment, storyboardPath) {
  if (fs.existsSync(storyboardPath)) return false;
  const voice = findVoice(context.audioMeta, segment.id);
  const duration = Number(firstDefined(
    segment.durationSeconds,
    segment.duration_s,
    segment.duration,
    voice?.duration_s,
    voice?.durationSeconds,
  )) || 1;
  const audio = segmentAudioBrowserSrc(context.projectDir, context.publicDir, segment, context.audioMeta);
  const storyboard = {
    schemaVersion: 1,
    segment: segment.id,
    composition: {
      width: Number(segment.width || context.projectManifest.width || 1080),
      height: Number(segment.height || context.projectManifest.height || 1920),
      fps: Number(segment.fps || context.projectManifest.fps || 30),
      durationSeconds: duration,
    },
    segments: audio ? [{ id: segment.id, start: 0, durationSeconds: duration, audio }] : [],
  };
  writeJson(storyboardPath, storyboard);
  return true;
}

async function prepareSegment(context, segment) {
  const storyboardRel = segmentStoryboardRel(segment);
  const storyboardPath = resolveProjectPath(context.projectDir, storyboardRel, `Storyboard for ${segment.id}`);
  fs.mkdirSync(path.dirname(storyboardPath), { recursive: true });
  fs.mkdirSync(context.publicDir, { recursive: true });

  const buildCommand = manifestCommand(context, segment, storyboardPath);
  if (buildCommand) {
    await runCommand(buildCommand, { cwd: context.projectDir });
  } else {
    const sourceIndexRel = segmentIndexSourceRel(segment);
    if (sourceIndexRel) {
      const sourceIndex = resolveProjectPath(context.projectDir, sourceIndexRel, `Index source for ${segment.id}`);
      if (!fs.existsSync(sourceIndex)) throw new Error(`Missing index source for ${segment.id}: ${sourceIndex}`);
      if (path.resolve(sourceIndex) !== path.resolve(context.indexPath)) fs.copyFileSync(sourceIndex, context.indexPath);
    } else if (fs.existsSync(context.buildCompositionPath)) {
      await runCommand([
        process.execPath,
        context.buildCompositionPath,
        '--project',
        context.projectDir,
        '--segment',
        segment.id,
        '--out',
        context.indexPath,
        '--storyboard',
        storyboardPath,
      ], { cwd: context.projectDir });
    } else if (!fs.existsSync(context.indexPath)) {
      throw new Error(`Missing ${context.indexPath}. Add a segment buildCommand or indexHtml in manifests/segments.json.`);
    }
  }

  createFallbackStoryboard(context, segment, storyboardPath);
  if (!fs.existsSync(storyboardPath)) throw new Error(`Missing storyboard for ${segment.id}: ${storyboardPath}`);
  return storyboardRel;
}

async function renderSegment(context, plan) {
  const segment = context.segmentMap.get(plan.id);
  const storyboardRel = await prepareSegment(context, segment);
  const command = [
    process.execPath,
    context.rendererPath,
    '--project',
    context.projectDir,
    '--output',
    plan.output,
    '--storyboard',
    storyboardRel,
  ];
  if (context.args.ffmpeg) command.push('--ffmpeg', context.args.ffmpeg);
  await runCommand(command, { cwd: context.projectDir });
  segment.renderPath = plan.output;
  segment.dirty = false;
  segment.renderedAt = new Date().toISOString();
}

async function assembleVariants(context, variants) {
  if (!variants.length) return;
  const manifestPath = path.join(context.manifestsDir, `.assemble-selected-${process.pid}-${Date.now()}.json`);
  const selected = {
    ...context.assembleManifest,
    variants: variants.map((variant) => normalizeVariantForAssembly(context, variant)),
  };
  writeJson(manifestPath, selected);
  try {
    const command = [process.execPath, context.assemblerPath, '--manifest', manifestPath];
    if (context.args.ffmpeg) command.push('--ffmpeg', context.args.ffmpeg);
    await runCommand(command, { cwd: context.projectDir });
  } finally {
    fs.rmSync(manifestPath, { force: true });
  }
}

async function runQueue(items, limit, worker) {
  const queue = items.slice();
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(workers);
}

function selectedSegments(context) {
  if (context.args.all) return context.segments;
  const selected = new Set(context.args.segments);
  for (const variantId of context.args.variants) {
    const variant = context.variants.find((item) => item.id === variantId);
    if (!variant) throw new Error(`Unknown variant: ${variantId}`);
    for (const entry of variant.segments || []) {
      const id = segmentEntryToId(context, entry);
      if (id) selected.add(id);
    }
  }
  return Array.from(selected).map((id) => {
    const segment = context.segmentMap.get(id);
    if (!segment) throw new Error(`Unknown segment: ${id}`);
    return segment;
  });
}

function selectedVariants(context) {
  if (context.args.skipAssemble) return [];
  if (context.args.all || context.args.assembleOnly) return context.variants;
  if (context.args.variants.length) {
    return context.args.variants.map((id) => {
      const variant = context.variants.find((item) => item.id === id);
      if (!variant) throw new Error(`Unknown variant: ${id}`);
      return variant;
    });
  }
  if (context.args.segments.length) {
    return context.variants.filter((variant) => context.args.segments.some((id) => variantUsesSegment(context, variant, id)));
  }
  return [];
}

function createContext(args) {
  const projectDir = path.resolve(args.project);
  const manifestsDir = path.join(projectDir, 'manifests');
  const projectManifestPath = path.join(manifestsDir, 'project.json');
  const segmentsManifestPath = path.join(manifestsDir, 'segments.json');
  const audioMetaPath = path.join(manifestsDir, 'audio-meta.json');
  const paidAssetsPath = path.join(manifestsDir, 'paid-assets.json');
  const assembleManifestPath = path.join(manifestsDir, 'assemble.json');
  const projectManifest = readJson(projectManifestPath, {});
  const segmentsManifest = normalizeSegmentsManifest(readJson(segmentsManifestPath, { schemaVersion: 1, segments: [] }));
  const audioMeta = readJson(audioMetaPath, {});
  const paidAssets = readJson(paidAssetsPath, {});
  const assembleManifest = readJson(assembleManifestPath, { schemaVersion: 1, variants: [] });
  const segments = segmentsManifest.segments;
  const segmentMap = new Map(segments.map((segment) => [segment.id, segment]));
  const variants = Array.isArray(assembleManifest.variants) ? assembleManifest.variants : [];
  const publicDir = path.join(projectDir, 'public');
  const sourceBuildCompositionPath = path.join(projectDir, 'source', 'build-composition.mjs');
  const legacyBuildCompositionPath = path.join(projectDir, 'build-composition.mjs');
  const manifestBuildCompositionPath = projectManifest.buildCompositionPath
    ? resolveProjectPath(projectDir, projectManifest.buildCompositionPath, 'Build composition')
    : null;
  const buildCompositionPath = firstExistingPath(
    manifestBuildCompositionPath,
    sourceBuildCompositionPath,
    legacyBuildCompositionPath,
  );

  for (const segment of segments) {
    if (!segment.id) throw new Error('Every segment in manifests/segments.json needs an id.');
  }
  for (const variant of variants) {
    if (!variant.id) throw new Error('Every variant in manifests/assemble.json needs an id.');
  }

  return {
    args,
    projectDir,
    manifestsDir,
    publicDir,
    indexPath: path.join(publicDir, 'index.html'),
    buildCompositionPath,
    sourceBuildCompositionPath,
    legacyBuildCompositionPath,
    projectScriptPath: path.join(projectDir, 'source', 'script.md'),
    legacyProjectScriptPath: path.join(projectDir, 'script.md'),
    rendererPath: path.resolve(args.renderer || path.join(__dirname, 'render-segment.cjs')),
    assemblerPath: path.resolve(args.assembler || path.join(__dirname, 'assemble-variants.mjs')),
    projectManifestPath,
    segmentsManifestPath,
    audioMetaPath,
    paidAssetsPath,
    assembleManifestPath,
    projectManifest,
    segmentsManifest,
    audioMeta,
    paidAssets,
    assembleManifest,
    segments,
    segmentMap,
    variants,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project || (!args.all && !args.assembleOnly && !args.segments.length && !args.variants.length)) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const context = createContext(args);
  const segmentPlans = args.assembleOnly ? [] : selectedSegments(context).map((segment) => isSegmentDirty(context, segment));
  const variantsForSelection = selectedVariants(context);
  const variantPlans = variantsForSelection.map((variant) => isVariantDirty(context, variant));
  const dirtySegmentPlans = segmentPlans.filter((plan) => plan.dirty);
  const dirtyVariantIds = new Set(variantPlans.filter((plan) => plan.dirty).map((plan) => plan.id));
  const dirtyVariants = variantsForSelection.filter((variant) => dirtyVariantIds.has(variant.id));

  const plan = {
    ok: true,
    project: context.projectDir,
    segments: segmentPlans.map(({ id, output, dirty, reasons, dependencies }) => ({ id, output, dirty, reasons, dependencies })),
    variants: variantPlans,
    assembleOnly: args.assembleOnly || false,
    planOnly: args.planOnly || false,
  };
  console.log(JSON.stringify(plan, null, 2));

  if (args.planOnly) return;

  if (dirtySegmentPlans.length) {
    await runQueue(dirtySegmentPlans, args.concurrency, (item) => renderSegment(context, item));
    writeJson(context.segmentsManifestPath, context.segmentsManifest);
  }

  if (!args.skipAssemble && dirtyVariants.length) {
    await assembleVariants(context, dirtyVariants);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
