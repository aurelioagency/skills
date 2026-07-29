#!/usr/bin/env node
// Arma el contact sheet de un paquete de carrusel: todos los PNG de exports/ en una
// grilla, para la revision visual que render-and-audit.mjs no puede hacer (sentido del
// texto, solapamientos, ritmo, agujeros en la composicion).
//
// Uso (desde la carpeta del paquete):
//   node <skill-dir>/scripts/contact-sheet.mjs
//
// Flags:
//   --package <dir>  carpeta del paquete (default: cwd)
//   --cols <n>       columnas de la grilla (default: 4)
//   --out <archivo>  salida (default: <package>/contact-sheet.png)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

async function loadChromium() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const bases = [
    process.cwd(),
    path.join(here, '..'),
    here,
    path.join(os.homedir(), '.claude', 'skills', 'heygen-ai-avatar-video')
  ];
  for (const base of bases) {
    try {
      const req = createRequire(path.join(base, 'noop.js'));
      const mod = req('playwright');
      if (mod?.chromium) return mod.chromium;
    } catch { /* siguiente base */ }
  }
  console.error('No encontre Playwright. Instalalo con:  npm i playwright');
  process.exit(1);
}
const chromium = await loadChromium();

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
}
// path.resolve siempre: con una ruta relativa el file:// queda mal formado y
// Playwright falla con ERR_FILE_NOT_FOUND.
const pkg = path.resolve(arg('package', process.cwd()));
const cols = Number(arg('cols', 4));
const out = path.resolve(arg('out', path.join(pkg, 'contact-sheet.png')));

const dir = path.join(pkg, 'exports');
const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png')).sort();
if (!files.length) {
  console.error(`No hay PNG en ${dir}`);
  process.exit(1);
}

const figures = files.map(f => {
  const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
  return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${f}</figcaption></figure>`;
}).join('');

const html = `<meta charset="utf-8"><style>
body { background:#111; margin:0; padding:20px; display:grid;
       grid-template-columns:repeat(${cols},1fr); gap:20px;
       font:16px ui-monospace,monospace; color:#ddd }
figure { margin:0 }
img { width:100%; display:block; border:1px solid #333 }
figcaption { text-align:center; padding-top:6px }
</style>${figures}`;

const tmp = path.join(pkg, '.contact-sheet.tmp.html');
fs.writeFileSync(tmp, html);
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1 });
  await page.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
} finally {
  fs.unlinkSync(tmp);
}
console.log(`${path.relative(pkg, out) || out} — ${files.length} slides en ${cols} columnas`);
