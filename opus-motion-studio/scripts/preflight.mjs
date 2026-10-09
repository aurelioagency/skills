#!/usr/bin/env node
// Chequea el entorno necesario para opus-motion-studio. Nunca instala nada:
// solo reporta qué falta y el comando exacto para instalarlo, para que
// quien use la skill lo muestre al usuario y pida permiso antes de correrlo.

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function run(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() };
  } catch {
    return { ok: false, out: null };
  }
}

const asJson = process.argv.includes("--json");

const checks = {};

const node = run("node -v");
checks.node = { present: node.ok, version: node.out, installCommand: null };

const ffmpeg = run("ffmpeg -version");
checks.ffmpeg = {
  present: ffmpeg.ok,
  version: ffmpeg.ok ? ffmpeg.out.split("\n")[0] : null,
  installCommand: ffmpeg.ok
    ? null
    : "winget install Gyan.FFmpeg   (o: choco install ffmpeg / brew install ffmpeg según el sistema)",
};

const npx = run("npx --version");
checks.npx = { present: npx.ok, version: npx.out, installCommand: npx.ok ? null : "viene con Node — reinstalar Node" };

// Playwright: chequear si el paquete está disponible y si algún build de
// Chromium ya está descargado en la caché local, sin instalar nada.
const pwVersion = run("npx --yes playwright --version");
let chromiumInstalled = false;
const pwCacheDir = join(homedir(), "AppData", "Local", "ms-playwright");
if (existsSync(pwCacheDir)) {
  chromiumInstalled = readdirSync(pwCacheDir).some((name) => name.startsWith("chromium"));
}
checks.playwright = {
  present: pwVersion.ok,
  version: pwVersion.out,
  chromiumInstalled,
  installCommand: pwVersion.ok
    ? chromiumInstalled
      ? null
      : "npx playwright install chromium"
    : "npm install playwright && npx playwright install chromium",
};

const allReady = checks.node.present && checks.ffmpeg.present && checks.playwright.present && checks.playwright.chromiumInstalled;

const result = { ready: allReady, checks };

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log("opus-motion-studio — preflight");
  console.log("-------------------------------");
  for (const [name, info] of Object.entries(checks)) {
    const status = info.present === false ? "FALTA" : name === "playwright" && !info.chromiumInstalled ? "FALTA chromium" : "OK";
    console.log(`${name}: ${status}${info.version ? `  (${info.version})` : ""}`);
    if (info.installCommand) console.log(`  -> instalar con: ${info.installCommand}`);
  }
  console.log(allReady ? "\nTodo listo." : "\nFalta instalar algo — mostrar el comando al usuario y pedir confirmación antes de correrlo.");
}

process.exit(allReady ? 0 : 1);
