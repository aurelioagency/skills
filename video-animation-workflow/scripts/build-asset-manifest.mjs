#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(skillRoot, 'assets');
const outputFile = path.join(assetsRoot, 'manifest.json');

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && fullPath !== outputFile) files.push(fullPath);
  }
  return files;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function describe(relative) {
  const normalized = relative.replaceAll('\\', '/');
  if (normalized.includes('/fonts/')) {
    return {
      category: 'open-font',
      purpose: 'Redistributable typography starter or license text',
      license: 'SIL Open Font License 1.1',
    };
  }
  if (normalized.startsWith('starter-library/sfx/')) {
    return {
      category: 'semantic-sfx',
      purpose: path.basename(relative, path.extname(relative)).replaceAll('_', ' '),
      license: 'Reference package: noncommercial use; see LICENSE and ORIGINAL_ASSET_INDEX.md',
    };
  }
  if (normalized.startsWith('starter-library/images/source/')) {
    return {
      category: 'imagegen-source',
      purpose: 'Untouched source generation retained for identity and regeneration evidence',
      license: 'Reference package: noncommercial use; see LICENSE',
    };
  }
  if (normalized.startsWith('starter-library/images/production/')) {
    return {
      category: 'production-image',
      purpose: path.basename(relative, path.extname(relative)).replaceAll('_', ' '),
      license: 'Reference package: noncommercial use; see LICENSE',
    };
  }
  if (normalized.startsWith('starter-library/guides/')) {
    return {
      category: 'production-guide',
      purpose: 'Reusable caption, typography, motion, or asset-usage guidance',
      license: 'PolyForm Noncommercial 1.0.0; see LICENSE',
    };
  }
  if (normalized.startsWith('reference-projects/')) {
    return {
      category: 'editable-reference-project',
      purpose: 'Editable HyperFrames source, media, or project evidence',
      license: normalized.includes('voiceover')
        ? 'Reference-only noncommercial voice-over; do not reuse as another creator identity'
        : 'PolyForm Noncommercial 1.0.0 or file-specific third-party license',
    };
  }
  if (normalized.startsWith('reference-proof/renders/')) {
    return {
      category: 'reference-render',
      purpose: 'Final approved encoded MP4 demonstrating the complete workflow',
      license: 'Reference-only noncommercial use; see LICENSE',
    };
  }
  if (normalized.startsWith('reference-proof/storyboards/')) {
    return {
      category: 'storyboard-proof',
      purpose: 'Approved format-specific storyboard sheet',
      license: 'PolyForm Noncommercial 1.0.0; see LICENSE',
    };
  }
  if (normalized.startsWith('reference-proof/snapshots/')) {
    return {
      category: 'checkpoint-proof',
      purpose: 'Approved animation checkpoint or contact sheet',
      license: 'PolyForm Noncommercial 1.0.0; see LICENSE',
    };
  }
  if (normalized.startsWith('reference-proof/imagegen-prompts/')) {
    return {
      category: 'imagegen-prompt',
      purpose: 'Prompt record for storyboard or production raster generation',
      license: 'PolyForm Noncommercial 1.0.0; see LICENSE',
    };
  }
  return {
    category: 'reference-document',
    purpose: 'Production decision, validation, source, or manifest evidence',
    license: 'PolyForm Noncommercial 1.0.0 or file-specific third-party license',
  };
}

function buildManifest() {
  const files = walk(assetsRoot)
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const relative = path.relative(assetsRoot, file).replaceAll('\\', '/');
      const stat = fs.statSync(file);
      return {
        path: relative,
        bytes: stat.size,
        sha256: sha256(file),
        ...describe(relative),
      };
    });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceProduction: 'video-intro-ai-workflow',
    formats: ['1920x1080', '1080x1920'],
    license: {
      originalPackage: 'PolyForm Noncommercial 1.0.0',
      openFonts: 'SIL Open Font License 1.1',
      note: 'A file-specific license or notice overrides the package default.',
    },
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    files,
  };
}

const write = process.argv.includes('--write');
const manifest = buildManifest();
if (write) {
  fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${manifest.fileCount} files to ${outputFile}`);
} else {
  console.log(JSON.stringify(manifest, null, 2));
}
