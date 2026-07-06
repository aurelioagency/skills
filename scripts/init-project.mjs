#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error(`Usage:
  node init-project.mjs --project <project-root> [--slug <slug>] [--script <script.md>] [--avatar-id <heygen-avatar-id>] [--voice-id <elevenlabs-voice-id>]

Creates the canonical single-folder project layout for modular HeyGen avatar videos.
Existing files are preserved unless they are missing.`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--project') args.project = argv[++i];
    else if (item === '--slug') args.slug = argv[++i];
    else if (item === '--script') args.script = argv[++i];
    else if (item === '--avatar-id') args.avatarId = argv[++i];
    else if (item === '--voice-id') args.voiceId = argv[++i];
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function writeJsonIfMissing(filePath, value) {
  if (fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return true;
}

function copyIfMissing(source, target) {
  if (!source || fs.existsSync(target)) return false;
  const resolvedSource = path.resolve(source);
  if (!fs.existsSync(resolvedSource)) throw new Error(`Missing script source: ${resolvedSource}`);
  fs.copyFileSync(resolvedSource, target);
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const projectDir = path.resolve(args.project);
  const slug = args.slug || path.basename(projectDir);
  const now = new Date().toISOString();

  const dirs = [
    'source',
    'manifests',
    'manifests/audits',
    'assets/voice',
    'assets/avatar',
    'assets/logos',
    'assets/music',
    'public',
    'renders/segments',
    'renders/final',
    'snapshots',
  ];

  for (const dir of dirs) fs.mkdirSync(path.join(projectDir, dir), { recursive: true });

  const created = [];
  const projectScript = path.join(projectDir, 'source', 'script.md');
  if (copyIfMissing(args.script, projectScript)) created.push('source/script.md');

  const projectCreated = writeJsonIfMissing(path.join(projectDir, 'manifests', 'project.json'), {
    schemaVersion: 1,
    layoutVersion: 1,
    slug,
    createdAt: now,
    sourceScript: args.script ? path.resolve(args.script) : null,
    projectScript: 'source/script.md',
    avatarId: args.avatarId || null,
    elevenLabsVoiceId: args.voiceId || null,
  });
  if (projectCreated) created.push('manifests/project.json');

  if (writeJsonIfMissing(path.join(projectDir, 'manifests', 'segments.json'), {
    schemaVersion: 1,
    segments: [],
  })) created.push('manifests/segments.json');

  if (writeJsonIfMissing(path.join(projectDir, 'manifests', 'audio-request.json'), {
    lines: [],
  })) created.push('manifests/audio-request.json');

  if (writeJsonIfMissing(path.join(projectDir, 'manifests', 'audio-meta.json'), {
    tts_provider: 'elevenlabs',
    voices: [],
  })) created.push('manifests/audio-meta.json');

  if (writeJsonIfMissing(path.join(projectDir, 'manifests', 'paid-assets.json'), {
    schemaVersion: 1,
    paidAssets: [],
  })) created.push('manifests/paid-assets.json');

  if (writeJsonIfMissing(path.join(projectDir, 'manifests', 'heygen-jobs.json'), {
    schemaVersion: 1,
    provider: 'heygen',
    maxConcurrency: 2,
    jobs: [],
  })) created.push('manifests/heygen-jobs.json');

  if (writeJsonIfMissing(path.join(projectDir, 'manifests', 'assemble.json'), {
    schemaVersion: 1,
    mode: 'auto',
    variants: [],
  })) created.push('manifests/assemble.json');

  console.log(JSON.stringify({
    ok: true,
    project: projectDir,
    created,
    directories: dirs,
  }, null, 2));
}

main();
