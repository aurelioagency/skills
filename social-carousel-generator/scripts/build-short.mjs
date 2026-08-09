#!/usr/bin/env node
// Arma el MP4 vertical (YouTube Short) a partir de las slides ya aprobadas del
// carrusel, con musica de fondo instrumental.
//
// Uso (desde la carpeta del paquete, con el server local levantado):
//   node <skill-dir>/scripts/build-short.mjs --port 8765 --out <carpeta-de-entrega>/short.mp4
//
// Flags:
//   --package <dir>   carpeta del paquete (default: cwd)
//   --port <n>        puerto del server local (default: 8765)
//   --out <archivo>   MP4 de salida (default: <package>/short.mp4)
//   --music <archivo> usa esta pista en vez de buscar una
//   --seconds-per <n> fuerza N segundos fijos por slide (apaga el reparto por texto)
//   --no-music        deja el video mudo
//
// Los frames se renderizan con ?video=1, que omite el prompt de swipe: en un Short
// no hay nada que deslizar. El carrusel no se toca.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { prepararMusica } from './fetch-music.mjs';

async function loadChromium() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const base of [process.cwd(), path.join(here, '..'), here,
    path.join(os.homedir(), '.claude', 'skills', 'heygen-ai-avatar-video')]) {
    try {
      const mod = createRequire(path.join(base, 'noop.js'))('playwright');
      if (mod?.chromium) return mod.chromium;
    } catch { /* siguiente */ }
  }
  console.error('No encontre Playwright. Instalalo con:  npm i playwright');
  process.exit(1);
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const pkg = path.resolve(arg('package', process.cwd()));
const port = Number(arg('port', 8765));
const OUT = path.resolve(arg('out', path.join(pkg, 'short.mp4')));
const MUSIC = arg('music', null);
const FIXED = arg('seconds-per', null);
const NOMUSIC = process.argv.includes('--no-music');

// ---------- datos del carrusel ----------
const src = fs.readFileSync(path.join(pkg, 'slide-data.js'), 'utf8');
globalThis.window = globalThis.window || {};
eval(src.replace(/^\s*\/\/.*$/gm, ''));
const data = window.CAROUSEL;
const slides = data.slides;
const W = data.width || 1080, H = data.height || 1440;

// ---------- cuanto dura cada slide ----------
// Reparto RELATIVO segun cuanto texto carga cada slide, mapeado a [MIN, MAX].
//
// NO usar "velocidad de lectura y despues clamp": se probo y TODOS los slides de
// contenido superan el tope, asi que todos terminan dando exactamente MAX y el
// reparto no reparte nada. Tiene que ser relativo al rango del propio carrusel.
//
// Esto no promete legibilidad: un slide con nota metodologica no se alcanza a
// leer en 8s. El video invita a pausar, no reemplaza al carrusel.
const MIN_SLIDE = 3.0, MAX_SLIDE = 8.0, CTA_SLIDE = 3.0;
const SKIP = new Set(['type', 'accent', 'color', 'mascot', 'asset', 'side', 'cls', 'pct', 'n']);
const textoDe = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return ' ' + v;
  if (Array.isArray(v)) return v.map(textoDe).join('');
  if (typeof v === 'object') return Object.entries(v).filter(([k]) => !SKIP.has(k)).map(([, x]) => textoDe(x)).join('');
  return '';
};
const palabrasDe = (s) => {
  const t = textoDe(s).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.split(' ').length : 0;
};

const pesos = slides.map((s) => (s.type === 'cta' ? 0 : palabrasDe(s)));
const cont = pesos.filter((_, i) => slides[i].type !== 'cta');
const lo = Math.min(...cont), hi = Math.max(...cont);
const tiempos = slides.map((s, i) => {
  if (FIXED) return Number(FIXED);
  if (s.type === 'cta') return CTA_SLIDE;
  if (hi === lo) return (MIN_SLIDE + MAX_SLIDE) / 2;
  return Math.round((MIN_SLIDE + (pesos[i] - lo) / (hi - lo) * (MAX_SLIDE - MIN_SLIDE)) * 10) / 10;
});
const TOTAL = Math.round(tiempos.reduce((a, b) => a + b, 0) * 10) / 10;

console.log('slide  tipo         palabras  segundos');
slides.forEach((s, i) => console.log(`  ${String(i + 1).padEnd(4)} ${s.type.padEnd(12)} ${String(pesos[i]).padStart(6)} ${String(tiempos[i]).padStart(9)}`));
console.log(`\nvideo: ${TOTAL}s\n`);

// ---------- frames sin el prompt de swipe ----------
const chromium = await loadChromium();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'short-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (let i = 1; i <= slides.length; i++) {
  await page.goto(`http://127.0.0.1:${port}/index.html?slide=${i}&video=1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(tmp, String(i).padStart(2, '0') + '.png') });
}
await browser.close();
console.log(`frames renderizados (?video=1, sin prompt de swipe)`);

// ---------- musica ----------
let music = MUSIC, info = null;
if (!NOMUSIC && !music) {
  music = path.join(pkg, 'assets', 'music.mp3');
  info = await prepararMusica({ seconds: TOTAL, out: music });
  console.log(`\nmusica: ${info.tema}`);
  console.log(`album:  ${info.album} (${info.duracion}s)`);
  console.log(`tramo:  ${info.segundos}s desde ${info.desde}s ${info.medido ? '(medido)' : '(FALLBACK)'}`);
  console.log(`        ${info.page}\n`);
}

// ---------- ensamblado ----------
// El demuxer concat es lo que permite una duracion distinta por imagen. El ultimo
// archivo se repite sin `duration`: sin esa linea, concat descarta el ultimo frame.
const lista = [];
for (let i = 0; i < slides.length; i++) {
  lista.push(`file '${path.join(tmp, String(i + 1).padStart(2, '0') + '.png').replace(/\\/g, '/')}'`);
  lista.push(`duration ${tiempos[i]}`);
}
lista.push(`file '${path.join(tmp, String(slides.length).padStart(2, '0') + '.png').replace(/\\/g, '/')}'`);
const concat = path.join(tmp, 'concat.txt');
fs.writeFileSync(concat, lista.join('\n'));

// El lienzo del Short es 1080x1920: la slide (1080x1440) va centrada y las bandas
// se rellenan con el color de campo de la marca, no con negro puro, para que no
// se vea el corte contra el fondo de la slide.
// Con un paquete de TikTok (1080x1920) la slide ya llena el lienzo y el relleno es 0.
const field = data.fieldColor || '0x050505';
const padY = Math.max(0, Math.round((1920 - H) / 2));
const vf = `scale=${W}:${H},pad=1080:1920:0:${padY}:${field},format=yuv420p,fps=30`;

const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concat];
if (music && !NOMUSIC) args.push('-i', music);
args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20');
if (music && !NOMUSIC) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push(OUT);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
spawnSync('ffmpeg', args, { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\nlisto: ${OUT}  (${TOTAL}s, 1080x1920)`);
if (info) {
  console.log('\nMOSTRALE LA PISTA AL USUARIO Y ESPERA SU OK ANTES DE PUBLICAR.');
  console.log('El filtro trabaja sobre titulos: puede pasar un tema que se llame bien y suene mal.');
}
