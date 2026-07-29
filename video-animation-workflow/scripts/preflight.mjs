#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const HYPERFRAMES_SOURCE = 'https://github.com/heygen-com/hyperframes';
const HUMANIZER_SOURCE = 'https://github.com/blader/humanizer.git';
const REQUIRED_HYPERFRAMES_SKILLS = [
  'hyperframes',
  'hyperframes-core',
  'hyperframes-animation',
  'hyperframes-keyframes',
  'hyperframes-cli',
  'media-use',
];

function parseArgs(argv) {
  const args = { json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--json') args.json = true;
    else if (item === '--project') args.project = path.resolve(argv[++i]);
    else if (item === '--agent') args.agent = argv[++i];
    else if (item === '--skills-dir') args.skillsDir = path.resolve(argv[++i]);
    else if (item === '--help' || item === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => path.resolve(value)))];
}

function commandAvailable(command, args = ['--version']) {
  const isWindowsShim = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
  const executable = isWindowsShim ? process.env.ComSpec || 'cmd.exe' : command;
  const executableArgs = isWindowsShim
    ? ['/d', '/s', '/c', [command, ...args].join(' ')]
    : args;
  const result = spawnSync(executable, executableArgs, {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    available: !result.error && result.status === 0,
    version: (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || null,
  };
}

function detectAgent(explicit) {
  if (explicit) return explicit.toLowerCase();
  if (process.env.CODEX_HOME || process.env.CODEX_THREAD_ID || process.env.CODEX_SANDBOX) return 'codex';
  if (process.env.CLAUDECODE || process.env.CLAUDE_CODE || process.env.CLAUDE_CONFIG_DIR) return 'claude-code';
  if (process.env.GEMINI_CLI || process.env.GEMINI_HOME) return 'gemini-cli';
  if (process.env.OPENCODE_CONFIG || process.env.OPENCODE) return 'opencode';
  return 'unknown';
}

function skillRoots(explicit) {
  const home = os.homedir();
  return unique([
    explicit,
    process.env.CODEX_HOME && path.join(process.env.CODEX_HOME, 'skills'),
    process.env.CLAUDE_CONFIG_DIR && path.join(process.env.CLAUDE_CONFIG_DIR, 'skills'),
    process.env.GEMINI_HOME && path.join(process.env.GEMINI_HOME, 'skills'),
    path.join(home, '.codex', 'skills'),
    path.join(home, '.claude', 'skills'),
    path.join(home, '.gemini', 'skills'),
    path.join(home, '.agents', 'skills'),
    path.join(home, '.config', 'opencode', 'skills'),
  ]);
}

function findSkill(name, roots) {
  for (const root of roots) {
    const skillFile = path.join(root, name, 'SKILL.md');
    if (fs.existsSync(skillFile)) return { root, path: path.dirname(skillFile), skillFile };
  }
  return null;
}

function verifyHumanizerSource(found) {
  if (!found) return { verified: false, reason: 'not-installed' };
  const candidates = [
    path.join(found.path, 'README.md'),
    path.join(found.path, '.installed-from.json'),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const text = fs.readFileSync(candidate, 'utf8');
    if (/github\.com\/blader\/humanizer/i.test(text)) {
      return { verified: true, evidence: candidate };
    }
  }
  return {
    verified: false,
    reason: 'source-unverified',
    note: 'The skill exists, but its installed files do not prove it came from blader/humanizer.',
  };
}

function defaultInstallRoot(agent, roots) {
  const home = os.homedir();
  if (agent === 'codex') return path.join(process.env.CODEX_HOME || path.join(home, '.codex'), 'skills');
  if (agent === 'gemini-cli') return path.join(process.env.GEMINI_HOME || path.join(home, '.gemini'), 'skills');
  if (agent === 'opencode') return path.join(home, '.config', 'opencode', 'skills');
  if (agent === 'claude-code') {
    return path.join(process.env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'skills');
  }
  return roots.find((root) => fs.existsSync(root)) || path.join(home, '.claude', 'skills');
}

function quote(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function buildReport(args) {
  const agent = detectAgent(args.agent);
  const roots = skillRoots(args.skillsDir);
  const installRoot = defaultInstallRoot(agent, roots);
  const hyperframes = REQUIRED_HYPERFRAMES_SKILLS.map((name) => ({
    name,
    found: findSkill(name, roots),
  }));
  const missingHyperframes = hyperframes.filter((item) => !item.found).map((item) => item.name);
  const humanizer = findSkill('humanizer', roots);
  const humanizerSource = verifyHumanizerSource(humanizer);
  const commands = {
    hyperframesCheck: 'npx hyperframes skills check --json',
    hyperframesInstallAll: 'npx skills add heygen-com/hyperframes --all',
    hyperframesUpdate: 'npx hyperframes skills update',
    humanizerInstall: `git clone ${HUMANIZER_SOURCE} ${quote(path.join(installRoot, 'humanizer'))}`,
  };

  return {
    schemaVersion: 1,
    operatingSystem: {
      platform: process.platform,
      release: os.release(),
      architecture: process.arch,
    },
    runtime: {
      agent,
      node: { available: true, version: process.version },
      npm: commandAvailable(process.platform === 'win32' ? 'npm.cmd' : 'npm'),
      npx: commandAvailable(process.platform === 'win32' ? 'npx.cmd' : 'npx'),
      git: commandAvailable('git'),
      ffmpeg: commandAvailable('ffmpeg'),
    },
    projectRoot: args.project || process.cwd(),
    skillRoots: roots,
    recommendedSkillRoot: installRoot,
    dependencies: {
      hyperframes: {
        source: HYPERFRAMES_SOURCE,
        complete: missingHyperframes.length === 0,
        missing: missingHyperframes,
        installed: hyperframes.filter((item) => item.found).map((item) => ({
          name: item.name,
          path: item.found.path,
        })),
      },
      humanizer: {
        source: HUMANIZER_SOURCE,
        installed: Boolean(humanizer),
        path: humanizer?.path || null,
        sourceVerification: humanizerSource,
      },
    },
    imageGeneration: {
      status: 'agent-capability-check-required',
      instruction:
        'Inspect the active tool registry for a callable raster image generator. Do not infer capability from the agent brand.',
    },
    brandHome: process.env.VIDEO_ANIMATION_WORKFLOW_HOME
      ? path.resolve(process.env.VIDEO_ANIMATION_WORKFLOW_HOME)
      : path.join(os.homedir(), '.video-animation-workflow'),
    approvalRequiredBefore: [
      'running any install command',
      'running any update command',
      'replacing an existing humanizer installation whose source is unverified',
      'performing a paid or generative capability probe',
    ],
    suggestedCommands: commands,
  };
}

function printHuman(report) {
  console.log('Video Animation Workflow preflight');
  console.log(`Agent: ${report.runtime.agent}`);
  console.log(`OS: ${report.operatingSystem.platform} ${report.operatingSystem.release} (${report.operatingSystem.architecture})`);
  console.log(`Project: ${report.projectRoot}`);
  console.log(`Skill root: ${report.recommendedSkillRoot}`);
  console.log(`HyperFrames core: ${report.dependencies.hyperframes.complete ? 'ready' : 'missing'}`);
  if (!report.dependencies.hyperframes.complete) {
    console.log(`  Missing: ${report.dependencies.hyperframes.missing.join(', ')}`);
  }
  console.log(
    `Humanizer: ${
      report.dependencies.humanizer.sourceVerification.verified
        ? 'ready (blader/humanizer verified)'
        : report.dependencies.humanizer.installed
          ? 'installed, source unverified'
          : 'missing'
    }`,
  );
  console.log('Image generation: inspect the active agent tool registry.');
  console.log(`Persistent brand home: ${report.brandHome}`);
  console.log('');
  console.log('Do not run an install or update command until the user approves it.');
  if (!report.dependencies.hyperframes.complete) {
    console.log(`Suggested HyperFrames install: ${report.suggestedCommands.hyperframesInstallAll}`);
  } else {
    console.log(`Optional freshness check: ${report.suggestedCommands.hyperframesCheck}`);
  }
  if (!report.dependencies.humanizer.installed) {
    console.log(`Suggested humanizer install: ${report.suggestedCommands.humanizerInstall}`);
  }
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log('Usage: node scripts/preflight.mjs [--project <path>] [--agent <name>] [--skills-dir <path>] [--json]');
  process.exit(0);
}

const report = buildReport(args);
if (args.json) console.log(JSON.stringify(report, null, 2));
else printHuman(report);
