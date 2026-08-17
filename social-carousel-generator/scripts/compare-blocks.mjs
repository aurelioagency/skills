#!/usr/bin/env node
// Compara dos PNGs bloque por bloque: posicion vertical y ancho de cada bloque de tinta.
//
// Para que sirve: antes de reemplazar un asset fijo (una CTA, un logo compuesto), corre
// esto contra la version anterior. Si la maqueta no tenia que moverse, la tabla lo prueba;
// si se movio, lo muestra en px antes de que el cambio llegue a publicacion.
//
// Uso:
//   node <skill-dir>/scripts/compare-blocks.mjs anterior.png nuevo.png
//
// Flags:
//   --threshold <n>  brillo minimo para considerar tinta (default 110, sobre 255)
//   --gap <n>        filas vacias que separan dos bloques (default 6)
//
// Las dos imagenes pueden tener tamanos distintos: la posicion se informa como % del alto
// y el ancho como px y como % del ancho, para que la comparacion sirva entre formatos.
// Sale con codigo 3 si cambio la cantidad de bloques.
import fs from 'node:fs';
import path from 'node:path';


import { loadChromium } from './lib/load-chromium.mjs';
function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
}
const files = process.argv.slice(2).filter(a => !a.startsWith('--') && /\.png$/i.test(a));
if (files.length !== 2) {
  console.error('Uso: node compare-blocks.mjs anterior.png nuevo.png');
  process.exit(1);
}
const threshold = Number(arg('threshold', 110));
const gap = Number(arg('gap', 6));

const chromium = await loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage();

async function blocks(file) {
  const b64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ b64, threshold, gap }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;

    const rows = [];
    for (let y = 0; y < H; y++) {
      let min = -1, max = -1;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if ((d[i] + d[i + 1] + d[i + 2]) / 3 > threshold) { if (min < 0) min = x; max = x; }
      }
      if (min >= 0) rows.push([y, min, max]);
    }
    if (!rows.length) return { W, H, blocks: [] };

    const groups = [];
    let cur = [rows[0]];
    for (const r of rows.slice(1)) {
      if (r[0] - cur[cur.length - 1][0] <= gap) cur.push(r);
      else { groups.push(cur); cur = [r]; }
    }
    groups.push(cur);

    return {
      W, H,
      blocks: groups.map(g => {
        const y0 = g[0][0], y1 = g[g.length - 1][0];
        const x0 = Math.min(...g.map(r => r[1])), x1 = Math.max(...g.map(r => r[2]));
        return {
          yPct: +(((y0 + y1) / 2) / H * 100).toFixed(1),
          w: x1 - x0 + 1,
          wPct: +(((x1 - x0 + 1) / W) * 100).toFixed(1),
          h: y1 - y0 + 1
        };
      })
    };
  }, { b64, threshold, gap });
}

const A = await blocks(files[0]);
const B = await blocks(files[1]);
await browser.close();

console.log(`A: ${path.basename(files[0])} (${A.W}x${A.H}) — ${A.blocks.length} bloques`);
console.log(`B: ${path.basename(files[1])} (${B.W}x${B.H}) — ${B.blocks.length} bloques\n`);

const n = Math.max(A.blocks.length, B.blocks.length);
console.log('  #        A: y / ancho          B: y / ancho          diferencia');
let moved = 0;
for (let i = 0; i < n; i++) {
  const a = A.blocks[i], b = B.blocks[i];
  if (!a || !b) { console.log(`  ${String(i + 1).padEnd(6)} ${a ? 'solo en A' : 'solo en B'}`); continue; }
  const dy = +(b.yPct - a.yPct).toFixed(1);
  const dw = b.w - a.w;
  if (Math.abs(dy) > 0.05 || dw !== 0) moved++;
  const flag = (Math.abs(dy) > 0.5 || Math.abs(dw) > 4) ? '  <-- se movio' : '';
  console.log(
    `  ${String(i + 1).padEnd(6)} ${String(a.yPct).padStart(6)}% ${String(a.w).padStart(5)}px      ` +
    `${String(b.yPct).padStart(6)}% ${String(b.w).padStart(5)}px      ` +
    `${(dy >= 0 ? '+' : '') + dy}% ${(dw >= 0 ? '+' : '') + dw}px${flag}`
  );
}

if (A.blocks.length !== B.blocks.length) {
  console.log('\nLA CANTIDAD DE BLOQUES CAMBIO. O aparecio/desaparecio un elemento, o dos se fusionaron.');
  process.exit(3);
}
console.log(moved === 0
  ? '\nMaqueta identica: ningun bloque se movio.'
  : `\n${moved} bloque(s) con diferencia. Si el cambio pedido no era de maqueta, esto no deberia pasar.`);
