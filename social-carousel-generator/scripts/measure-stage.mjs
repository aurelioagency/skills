#!/usr/bin/env node
// Mide la altura real de cada bloque del stage, slide por slide.
//
// Correlo SIEMPRE antes de reflowear a un canvas mas corto (por ejemplo al adaptar
// 1080x1920 -> 1080x1440). Estimar alturas a ojo cuesta dos o tres rondas de correccion;
// medir primero te dice exactamente cuantos px sobran o faltan en cada slide.
//
// Uso (con el server local levantado desde la carpeta del paquete):
//   node <skill-dir>/scripts/measure-stage.mjs --port 8765 --slides 1,2,3
//
// Flags:
//   --package <dir>   carpeta del paquete (default: cwd)
//   --port <n>        puerto del server local (default: 8765)
//   --slides <lista>  slides a medir (default: todas)
//
// Lectura del reporte:
//   "contenido 1093px" contra "stage (1004px)" = te sobran 89px, hay que recortar.
//   Un spacer de 0px arriba y abajo significa que el contenido ya desborda.
//   Spacers grandes y simetricos significan que la composicion quedo chica: expandila.
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
const pkg = path.resolve(arg('package', process.cwd()));
const port = Number(arg('port', 8765));

const dataFile = fs.readFileSync(path.join(pkg, 'slide-data.js'), 'utf8');
const W = Number(dataFile.match(/width:\s*(\d+)/)?.[1] ?? 1080);
const H = Number(dataFile.match(/height:\s*(\d+)/)?.[1] ?? 1920);
const count = (dataFile.match(/^\s{4}\{/gm) || []).length;

const slides = arg('slides')
  ? String(arg('slides')).split(',').map(Number)
  : Array.from({ length: count }, (_, i) => i + 1);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const i of slides) {
  await page.goto(`http://127.0.0.1:${port}/index.html?slide=${i}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const out = await page.evaluate(() => {
    const stage = document.querySelector('.stage');
    if (!stage) return null;
    const sr = stage.getBoundingClientRect();
    const rows = [...stage.children].map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        cls: (typeof el.className === 'string' && el.className) || el.tagName,
        h: Math.round(r.height),
        mt: cs.marginTop,
        top: Math.round(r.top),
        bot: Math.round(r.bottom)
      };
    });
    const contentH = rows
      .filter(r => !/spacer/.test(r.cls))
      .reduce((a, b) => a + b.h, 0);
    const gaps = rows
      .filter(r => !/spacer/.test(r.cls))
      .reduce((a, b) => a + parseFloat(b.mt || 0), 0);
    return {
      stage: { top: Math.round(sr.top), bot: Math.round(sr.bottom), h: Math.round(sr.height) },
      rows, contentH: Math.round(contentH), gaps: Math.round(gaps)
    };
  });

  if (!out) { console.log(`--- slide ${i}: sin .stage (probablemente la CTA fija)`); continue; }

  const used = out.contentH + out.gaps;
  const slack = out.stage.h - used;
  // El desborde es un defecto medible: el contenido no entra. El aire sobrante NO lo es.
  // Hubo un umbral de "composicion chica" al 14% del stage y salio caro: empuja a rellenar
  // -texto mas grande, graficos mas grandes- en vez de agregar contenido, que es lo unico
  // que llena un slide de verdad. Aca se reporta el numero y decide quien mira.
  const verdict = slack < 0
    ? `DESBORDA por ${-slack}px -> recorta`
    : `${slack}px libres`;
  console.log(`--- slide ${i} | stage ${out.stage.top}..${out.stage.bot} (${out.stage.h}px) | bloques ${out.contentH}px + margenes ${out.gaps}px = ${used}px | ${verdict}`);
  for (const r of out.rows) {
    console.log(`   ${String(r.h).padStart(4)}px  mt:${String(r.mt).padStart(6)}  ${r.top}..${r.bot}  ${r.cls}`);
  }
}

await browser.close();
