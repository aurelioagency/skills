#!/usr/bin/env node
// Arma el MP4 vertical (YouTube Short) a partir de las slides ya aprobadas del
// carrusel, con musica de fondo instrumental.
//
// Uso (después de renderizar las placas aprobadas):
//   node <skill-dir>/scripts/build-short.mjs --out <carpeta-de-entrega>/short.mp4
//
// Flags:
//   --package <dir>   carpeta del paquete (default: cwd)
//   --out <archivo>   MP4 de salida (default: <package>/short.mp4)
//   --music <archivo> usa esta pista en vez de buscar una
//   --item <id>       toma la pista de ese item de archive.org, sin usar el buscador
//   --seconds-per <n> fuerza N segundos fijos por slide (apaga el reparto por texto)
//   --no-music        deja el video mudo
//
// El total nunca pasa MAX_TOTAL (55s): YouTube bloquea por Content ID mucho mas
// agresivo a los shorts de un minuto o mas. --seconds-per se saltea este tope
// a proposito (uso explicito, no automatico).
//
// Cada frame usa el PNG aprobado, sin otra composición ni relleno.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararMusica } from './fetch-music.mjs';
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const pkg = path.resolve(arg('package', process.cwd()));
const OUT = path.resolve(arg('out', path.join(pkg, 'short.mp4')));
const MUSIC = arg('music', null);
// --item <id> saltea el buscador de archive.org y toma la pista de un item conocido.
// Existe porque el buscador se cae solo mientras las descargas siguen andando: sin
// esto, una caida del buscador deja el carrusel sin video. El identificador sale de
// la URL del item (archive.org/details/<id>) o del manifest de un carrusel anterior.
const ITEM = arg('item', null);
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
// YouTube bloquea por Content ID mucho mas agresivo pasado el minuto: un short de
// 63.4s quedo bloqueado dos veces seguidas (con dos musicas de fondo distintas) y
// el mismo video recortado a 40s se subio sin problema. Tope duro, no sugerencia.
const MAX_TOTAL = 55.0;
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
let TOTAL = Math.round(tiempos.reduce((a, b) => a + b, 0) * 10) / 10;

// Tope duro de duracion total: si el reparto por texto se pasa de MAX_TOTAL, se
// escala todo proporcionalmente (nunca por debajo de MIN_SLIDE/CTA_SLIDE quedan
// slides ilegibles porque el escalado es el mismo factor para todos).
if (!FIXED && TOTAL > MAX_TOTAL) {
  const factor = MAX_TOTAL / TOTAL;
  for (let i = 0; i < tiempos.length; i++) tiempos[i] = Math.round(tiempos[i] * factor * 10) / 10;
  TOTAL = Math.round(tiempos.reduce((a, b) => a + b, 0) * 10) / 10;
}

console.log('slide  tipo         palabras  segundos');
slides.forEach((s, i) => console.log(`  ${String(i + 1).padEnd(4)} ${s.type.padEnd(12)} ${String(pesos[i]).padStart(6)} ${String(tiempos[i]).padStart(9)}`));
console.log(`\nvideo: ${TOTAL}s\n`);

// ---------- placas aprobadas, sin cambios de composición ----------
// El Short usa exactamente los PNG de la entrega. No re-renderiza una variante
// ni amplía el lienzo: esa transformación alteraba las placas aprobadas.
const frames = slides.map((_, i) => path.join(path.dirname(OUT), `${String(i + 1).padStart(2, '0')}.png`));
for (const frame of frames) {
  if (!fs.existsSync(frame)) throw new Error(`Falta la placa aprobada: ${frame}`);
}
console.log(`frames: ${frames.length} PNG aprobados (${W}x${H})`);

// ---------- musica ----------
let music = MUSIC, info = null;
if (!NOMUSIC && !music) {
  music = path.join(pkg, 'assets', 'music.mp3');
  info = await prepararMusica({ seconds: TOTAL, out: music, item: ITEM });
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
  lista.push(`file '${frames[i].replace(/\\/g, '/')}'`);
  lista.push(`duration ${tiempos[i]}`);
}
lista.push(`file '${frames.at(-1).replace(/\\/g, '/')}'`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'short-concat-'));
const concat = path.join(tmp, 'frames.txt');
fs.writeFileSync(concat, lista.join('\n'));

const vf = 'format=yuv420p,fps=30';

const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concat];
if (music && !NOMUSIC) args.push('-i', music);
args.push('-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-t', String(TOTAL));
if (music && !NOMUSIC) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push(OUT);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
try {
  const run = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(`ffmpeg termino con codigo ${run.status}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nlisto: ${OUT}  (${TOTAL}s, ${W}x${H})`);
if (info) {
  console.log('\nMOSTRALE LA PISTA AL USUARIO Y ESPERA SU OK ANTES DE PUBLICAR.');
  console.log('El filtro trabaja sobre titulos: puede pasar un tema que se llame bien y suene mal.');
}
