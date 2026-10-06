#!/usr/bin/env node
// Agrega una página de recurso a la web de Aurelio Agency (/blog/<slug>, sin listar),
// hace commit + push a main y espera a que quede online. NO modifica el dm-reply: solo
// lo lee para sacar el link del recurso. La URL final se imprime en la última línea
// ("ONLINE: <url>") y se la pasa a replykaro-automation con --link.
//
// Uso:
//   node add-resource.mjs --slug scrapling --name "Scrapling" \
//     --summary-es "..." --summary-en "..." --summary-br "..." \
//     [--github <url>] [--reel <url>] [--dm-reply <ruta, solo lectura>] \
//     [--repo <ruta>] [--wait <segundos>] [--dry-run] [--no-git]
//
// Sin --github, se toma el primer link del --dm-reply que no sea Skool ni aurelioagency.com.
// Códigos de salida: 0 online · 4 subido pero todavía no online · 1 error.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SITE = "https://www.aurelioagency.com";
const DATA_FILE = join("src", "lib", "resource-drops.ts");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: "utf8", shell: process.platform === "win32" && cmd === "npx" });
}

const args = parseArgs(process.argv.slice(2));
const repo = args.repo || join(homedir(), "Documents", "Aurelio-Agency-Website");
const dryRun = Boolean(args["dry-run"]);
const noGit = Boolean(args["no-git"]);
const waitSeconds = Number(args.wait ?? 300);

const slug = args.slug;
const name = args.name;
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail("--slug es obligatorio: minúsculas, números y guiones (ej. scrapling).");
if (!name || name === true) fail("--name es obligatorio.");
for (const k of ["summary-es", "summary-en", "summary-br"]) {
  if (!args[k] || args[k] === true) fail(`--${k} es obligatorio (las tres lenguas, sin inventar nada que el recurso no haga).`);
}

// Link del recurso: --github o el primero útil del dm-reply.
let dmText = null;
if (args["dm-reply"] && args["dm-reply"] !== true) {
  if (!existsSync(args["dm-reply"])) fail(`No existe el dm-reply: ${args["dm-reply"]}`);
  dmText = readFileSync(args["dm-reply"], "utf8");
}
let githubUrl = args.github && args.github !== true ? args.github : null;
if (!githubUrl && dmText) {
  const urls = dmText.match(/https?:\/\/[^\s)>\]]+/g) ?? [];
  githubUrl = urls.find((u) => !/skool\.com|aurelioagency\.com/i.test(u)) ?? null;
}
if (!githubUrl) fail("No hay link del recurso: pasá --github o un --dm-reply que lo tenga.");
if (!/^https:\/\//.test(githubUrl)) fail(`El link del recurso tiene que ser https: ${githubUrl}`);

if (!existsSync(join(repo, DATA_FILE))) fail(`No encuentro ${DATA_FILE} en ${repo}. Clonar https://github.com/aurelioagency/Aurelio-Agency-Website.git ahí o pasar --repo.`);

if (!noGit && !dryRun) {
  if (run("git", ["status", "--porcelain"], repo).trim()) fail("El repo de la web tiene cambios sin commitear; no los toco. Resolver primero.");
  run("git", ["pull", "--ff-only", "origin", "main"], repo);
}

const file = join(repo, DATA_FILE);
let source = readFileSync(file, "utf8");
if (source.includes(`slug: ${JSON.stringify(slug)}`)) fail(`El slug "${slug}" ya existe en resource-drops.ts. Elegir otro o editar el existente a mano.`);

const q = (s) => JSON.stringify(s);
const block = [
  "  {",
  `    slug: ${q(slug)},`,
  `    name: ${q(name)},`,
  `    githubUrl: ${q(githubUrl)},`,
  ...(args.reel && args.reel !== true ? [`    reelUrl: ${q(args.reel)},`] : []),
  "    summary: {",
  `      es: ${q(args["summary-es"])},`,
  `      en: ${q(args["summary-en"])},`,
  `      br: ${q(args["summary-br"])},`,
  "    },",
  "  },",
].join("\n");

const start = source.indexOf("export const resourceDrops: ResourceDrop[] = [");
if (start === -1) fail("No encuentro el array resourceDrops en el archivo (¿cambió la estructura?).");
const end = source.indexOf("\n];", start);
if (end === -1) fail("No encuentro el cierre del array resourceDrops.");
const updated = source.slice(0, end) + "\n" + block + source.slice(end);

const pageUrl = `${SITE}/blog/${slug}`;
if (dryRun) {
  console.log("--dry-run: no se escribe nada. Se agregaría:\n" + block);
  console.log(`URL: ${pageUrl}`);
  process.exit(0);
}

writeFileSync(file, updated, "utf8");

if (!noGit) {
  if (!existsSync(join(repo, "node_modules"))) {
    run("npm", ["install"], repo);
    run("git", ["checkout", "package-lock.json"], repo);
  }
  try {
    run("npx", ["tsc", "--noEmit"], repo);
  } catch (e) {
    run("git", ["checkout", DATA_FILE], repo);
    fail(`tsc falló, revertí el archivo: ${e.stdout || e.message}`);
  }
  // Sin Co-Authored-By: ningún commit de esta máquina lleva atribución a Claude.
  run("git", ["add", DATA_FILE], repo);
  run("git", ["commit", "-m", `Add resource page: ${slug}`], repo);
  try {
    run("git", ["push", "origin", "main"], repo);
  } catch {
    run("git", ["pull", "--rebase", "origin", "main"], repo);
    run("git", ["push", "origin", "main"], repo);
  }
  console.log(`Subido a main: ${slug}`);
} else {
  console.log("--no-git: archivo editado, sin commit ni push.");
}

if (noGit) { console.log(`URL: ${pageUrl}`); process.exit(0); }

// Esperar a que la página esté online (el deploy tarda).
const deadline = Date.now() + waitSeconds * 1000;
let status = 0;
while (Date.now() < deadline) {
  try {
    status = (await fetch(pageUrl, { redirect: "follow" })).status;
  } catch { status = 0; }
  if (status === 200) { console.log(`ONLINE: ${pageUrl}`); process.exit(0); }
  await new Promise((r) => setTimeout(r, 15000));
}

let deploy = "sin datos";
try {
  const sha = run("git", ["rev-parse", "HEAD"], repo).trim();
  const id = run("gh", ["api", `repos/aurelioagency/Aurelio-Agency-Website/deployments?sha=${sha}`, "--jq", ".[0].id"], repo).trim();
  if (id) deploy = run("gh", ["api", `repos/aurelioagency/Aurelio-Agency-Website/deployments/${id}/statuses`, "--jq", ".[0].state + \": \" + .[0].description"], repo).trim();
} catch { /* gh no disponible */ }
console.error(`NO ONLINE después de ${waitSeconds}s (último HTTP ${status}). Deploy: ${deploy}\nURL: ${pageUrl}`);
process.exit(4);
