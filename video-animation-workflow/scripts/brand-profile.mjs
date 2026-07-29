#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function parseArgs(argv) {
  const args = { command: argv[2] || 'list', json: false };
  for (let i = 3; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--name') args.name = argv[++i];
    else if (item === '--root') args.root = path.resolve(argv[++i]);
    else if (item === '--project') args.project = path.resolve(argv[++i]);
    else if (item === '--json') args.json = true;
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function workflowHome(explicit) {
  if (explicit) return explicit;
  if (process.env.VIDEO_ANIMATION_WORKFLOW_HOME) {
    return path.resolve(process.env.VIDEO_ANIMATION_WORKFLOW_HOME);
  }
  return path.join(os.homedir(), '.video-animation-workflow');
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function profilePaths(root, name) {
  const slug = slugify(name);
  if (!slug) throw new Error('Brand name must contain at least one letter or number.');
  const brandRoot = path.join(root, 'brands', slug);
  return {
    root,
    slug,
    brandRoot,
    json: path.join(brandRoot, 'brand-profile.json'),
    markdown: path.join(brandRoot, 'brand-profile.md'),
    voice: path.join(brandRoot, 'voice-profile.md'),
    manifest: path.join(brandRoot, 'asset-manifest.json'),
  };
}

function writeIfMissing(file, contents) {
  if (fs.existsSync(file)) return false;
  fs.writeFileSync(file, contents, 'utf8');
  return true;
}

function initialize(args) {
  if (!args.name) throw new Error('init requires --name <brand name>.');
  const root = workflowHome(args.root);
  const files = profilePaths(root, args.name);
  for (const directory of [
    files.brandRoot,
    path.join(files.brandRoot, 'assets', 'logos'),
    path.join(files.brandRoot, 'assets', 'fonts'),
    path.join(files.brandRoot, 'assets', 'images'),
    path.join(files.brandRoot, 'references'),
    path.join(files.brandRoot, 'samples', 'writing'),
    path.join(files.brandRoot, 'samples', 'audio'),
    path.join(files.brandRoot, 'samples', 'video'),
  ]) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const now = new Date().toISOString();
  const jsonCreated = writeIfMissing(
    files.json,
    `${JSON.stringify({
      schemaVersion: 1,
      brandName: args.name,
      slug: files.slug,
      createdAt: now,
      updatedAt: now,
      sourceProject: args.project || null,
      websites: [],
      audiences: [],
      colors: {
        primary: null,
        secondary: [],
        background: null,
        text: null,
        valueCue: null,
      },
      typography: {
        anchor: null,
        connector: null,
        editorial: null,
        userSuppliedFontFiles: [],
      },
      logos: [],
      visualTone: [],
      motionTone: [],
      captionRules: [],
      soundRules: [],
      claimsAndProof: [],
      forbiddenTreatments: [],
      evidence: [],
    }, null, 2)}\n`,
  );
  const markdownCreated = writeIfMissing(
    files.markdown,
    `# ${args.name} brand profile

This file is the human-readable authority for branded video work. Fill only facts supported by a supplied asset, published page, prior approved video, or an explicit user decision.

## Identity

- Brand name: ${args.name}
- Website:
- Audience:
- Offer or subject:

## Palette

- Primary:
- Secondary:
- Background:
- Text:
- Value or money cue:

## Typography

- Anchor:
- Connector:
- Editorial accent:
- Licensed local font files:

## Visual and motion tone

- Visual tone:
- Motion tone:
- Caption behavior:
- Sound behavior:

## Assets

- Primary logo:
- Alternate logos:
- Approved imagery:

## Guardrails

- Required:
- Forbidden:

## Evidence

- Source project: ${args.project || ''}
- Brand guide:
- Published pages:
- Approved videos:
`,
  );
  const voiceCreated = writeIfMissing(
    files.voice,
    `# ${args.name} voice profile

Store conclusions from the user's own writing or speaking samples. Do not invent mannerisms.

## Default language and region

- Language:
- Regional form:

## Rhythm

- Sentence length:
- Pace:
- Pauses:
- Repeated structures:

## Vocabulary

- Preferred words:
- Words to avoid:
- Technical level:

## Personality

- Tone:
- Humor:
- Directness:
- Sales intensity:

## Samples and evidence

- Writing samples:
- Audio or video samples:
- Approved scripts:
`,
  );
  const manifestCreated = writeIfMissing(
    files.manifest,
    `${JSON.stringify({
      schemaVersion: 1,
      brand: args.name,
      files: [],
      note: 'Record relative path, source path or URL, purpose, approval status, and SHA-256 for every copied brand asset.',
    }, null, 2)}\n`,
  );

  return {
    action: 'init',
    brand: args.name,
    slug: files.slug,
    path: files.brandRoot,
    created: {
      brandProfileJson: jsonCreated,
      brandProfileMarkdown: markdownCreated,
      voiceProfile: voiceCreated,
      assetManifest: manifestCreated,
    },
    existingFilesWerePreserved: true,
  };
}

function list(args) {
  const root = workflowHome(args.root);
  const brandsRoot = path.join(root, 'brands');
  if (!fs.existsSync(brandsRoot)) return { action: 'list', root, brands: [] };
  const brands = fs
    .readdirSync(brandsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(brandsRoot, entry.name, 'brand-profile.json');
      try {
        const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
        return { slug: entry.name, name: profile.brandName || entry.name, path: path.dirname(file) };
      } catch {
        return { slug: entry.name, name: entry.name, path: path.join(brandsRoot, entry.name), invalidProfile: true };
      }
    });
  return { action: 'list', root, brands };
}

function show(args) {
  if (!args.name) throw new Error('show requires --name <brand name or slug>.');
  const root = workflowHome(args.root);
  const files = profilePaths(root, args.name);
  if (!fs.existsSync(files.json)) throw new Error(`Brand profile not found: ${files.brandRoot}`);
  return {
    action: 'show',
    path: files.brandRoot,
    profile: JSON.parse(fs.readFileSync(files.json, 'utf8')),
  };
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log('Usage:');
  console.log('  node scripts/brand-profile.mjs list [--root <path>] [--json]');
  console.log('  node scripts/brand-profile.mjs init --name <brand> [--project <path>] [--root <path>] [--json]');
  console.log('  node scripts/brand-profile.mjs show --name <brand> [--root <path>] [--json]');
  process.exit(0);
}

let result;
if (args.command === 'init') result = initialize(args);
else if (args.command === 'show') result = show(args);
else if (args.command === 'list') result = list(args);
else throw new Error(`Unknown command: ${args.command}`);

if (args.json) console.log(JSON.stringify(result, null, 2));
else if (result.action === 'list') {
  console.log(`Brand home: ${result.root}`);
  if (result.brands.length === 0) console.log('No reusable brand profiles found.');
  for (const brand of result.brands) console.log(`${brand.name} -> ${brand.path}`);
} else {
  console.log(`${result.action}: ${result.path}`);
  if (result.created) {
    for (const [name, created] of Object.entries(result.created)) {
      console.log(`  ${name}: ${created ? 'created' : 'preserved'}`);
    }
  }
}
