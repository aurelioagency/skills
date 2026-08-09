#!/usr/bin/env node
// Busca musica de fondo instrumental y deja un recorte del largo exacto del video.
//
// Uso:
//   node <skill-dir>/scripts/fetch-music.mjs --out assets/music.mp3 --seconds 36.2
//
// Flags:
//   --out <archivo>    donde escribir el recorte (default: ./music.mp3)
//   --seconds <n>      largo del recorte = largo del video (obligatorio en la practica)
//   --json <archivo>   escribe ahi los datos de la pista elegida (para el manifest)
//   --dry              elige y reporta sin bajar ni cortar
//
// METODOLOGIA (decidida con el usuario, no improvisar):
//   1. Una pagina AL AZAR de resultados, 20 por pagina.
//   2. Se filtran esos 20 por titulo.
//   3. Se elige UNA al azar entre las que sobreviven.
//   La proxima corrida cae en otra pagina, asi el pozo rota y no repite.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const OUT = path.resolve(arg('out', 'music.mp3'));
const NEED = Number(arg('seconds', 30));
const JSONOUT = arg('json', null);
const DRY = process.argv.includes('--dry');

const UA = { 'User-Agent': 'social-carousel-generator/1.0' };
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

// --- Duracion aceptada del TEMA (no del recorte) ---
// 1 a 5 minutos. Abajo de 1 min no hay de donde elegir tramo; arriba de 5 ya no
// son canciones sino mixes y recopilaciones de horas.
//
// Y bajarlos completos NO es gratis: ffmpeg no puede saltar limpio a un punto
// arbitrario de un mp3 largo, recorre el archivo. Medido sobre un archivo de 8h
// y 1 GB: ir al minuto 10 tardo 19s, ir a la hora 7 no termino en 7 minutos.
// Por eso el techo de duracion es lo que mantiene barata la descarga.
const MIN_TRACK = 60;
const MAX_TRACK = 300;

// --- Busqueda: SOLO terminos de genero ---
// No agregar "background music" a secas: se probo y arrastra stock corporativo,
// epico, navideno, de terror y muzak de tienda de los anos 50. Todo eso pasa
// cualquier filtro de decencia y no sirve para ambientar.
const TERMS = [
  'lofi hip hop', 'lofi beats', 'lofi beat', 'lofi chill', 'chill lofi',
  'lofi instrumental', 'lofi study', 'lofi music', 'lofi jazz', 'lo-fi beats',
  'chillhop', 'chill beats', 'study beats', 'jazzhop',
  'mellow beats', 'downtempo', 'ambient chill', 'chill instrumental'
];
const NEG = [
  'lofi version', 'vocal', 'vocals', 'karaoke', 'cover', 'remix',
  'podcast', 'audiobook', 'interview', 'speech', 'sermon', 'asmr',
  'epic', 'trailer', 'cinematic', 'corporate', 'horror', 'halloween',
  'christmas', 'scary', 'upbeat', 'dramatic', 'inspirational', 'wedding'
];
const QUERY =
  'mediatype:(audio) AND (' + TERMS.map((t) => `title:("${t}")`).join(' OR ') + ')' +
  ' AND ' + NEG.map((t) => `NOT title:("${t}")`).join(' AND ');

// --- Filtros de titulo ---
// NO hay reglas por idioma, alfabeto ni pais, y no hay que agregarlas. El lofi no
// es musica nacional de ningun lado: si la busqueda devuelve algo etiquetado por
// pais, el problema es la query. Medido sobre 200 candidatos con la query de
// genero, las reglas de cirilico/CJK/tailandes/arabe dieron CERO rechazos.
// Lo que aparecia era pop ajeno re-etiquetado como lofi, y eso lo saca la regla
// de "version o recopilacion de otro tema", que sirve igual en cualquier idioma.
const BAD = [
  [/\b(vocal|vocals|sung|singer|acapella|a cappella|choir)\b/i, 'voz'],
  [/\b(version|ver\.|mashup|playlist|nonstop|medley|cover|tribute|karaoke|vol\.?\s*\d)\b/i, 'version o recopilacion de otro tema'],
  [/(y2mate|2mate\.com|2meta\.app|ytmp3|youtube rip|yt2)/i, 'rip de YouTube'],
  [/\b(cock|dick|fuck|shit|cunt|pussy|porn|xxx|hentai|tits|bitch|whore|nigg)\b/i, 'contenido impublicable'],
  [/\b(podcast|audiobook|radio show|interview|speech|lecture|sermon)\b/i, 'no es musica'],
  [/\b(short|snippet|stinger|sting|jingle|teaser|logo)\b/i, 'muy corto'],
  [/\b(type beat)\b/i, 'type beat'],
  [/\b(epic|trailer|cinematic|corporate|horror|scary|halloween|christmas|xmas|dramatic|inspirational|advertising|commercial|wedding|muzak|upbeat|blockbuster|reggaeton|industrial|techno|dubstep|metal)\b/i, 'genero equivocado']
];
const rechazo = (t) => { for (const [re, m] of BAD) if (re.test(t || '')) return m; return null; };

// archive.org devuelve `length` a veces como "MM:SS" y a veces en segundos.
const secs = (v) => {
  if (v == null) return 0;
  const s = String(v);
  if (s.includes(':')) { const p = s.split(':').map(Number).reverse(); return (p[0] || 0) + (p[1] || 0) * 60 + (p[2] || 0) * 3600; }
  return parseFloat(s) || 0;
};

async function pagina(p) {
  const u = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(QUERY) +
    '&fl%5B%5D=identifier&fl%5B%5D=title&rows=20&page=' + p + '&output=json';
  const r = await fetch(u, { headers: UA });
  if (!r.ok) throw new Error('archive.org HTTP ' + r.status);
  const j = await r.json();
  return { docs: j.response?.docs || [], total: j.response?.numFound || 0 };
}

// Perfil de volumen del tema completo y eleccion del tramo mas parejo.
//
// DOS TRAMPAS, las dos costaron una ronda entera:
//  1. ebur128 solo emite el perfil por frame con -loglevel verbose. Sin eso no
//     hay una sola muestra y la funcion cae al fallback en silencio.
//  2. ffmpeg escribe ese perfil en stderr y SALE CON CODIGO 0. Con execFileSync
//     en un try/catch el stderr nunca se lee. Hay que usar spawnSync.
//  3. La linea intercala "TARGET:-23 LUFS" entre t: y M:, asi que un patron
//     /t:\s*([\d.]+)\s+M:/ no matchea nunca.
// `need` es obligatorio: si esta funcion cae en una constante del modulo mientras
// el corte usa otro largo, se miden ventanas de un tamano y se corta otro.
function mejorTramo(file, total, need) {
  const p = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-loglevel', 'verbose',
    '-i', file, '-af', 'ebur128=peak=none', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const pts = [];
  for (const m of (p.stderr || '').matchAll(/t:\s*([\d.]+).*?M:\s*(-?[\d.]+|-inf)/g)) {
    pts.push({ t: parseFloat(m[1]), v: m[2] === '-inf' ? -70 : parseFloat(m[2]) });
  }
  if (pts.length < 20) return { s: Math.max(0, Math.min(total * 0.3, total - need)), medido: false };

  const desde = Math.min(15, total * 0.08);                 // saltea intro
  const hasta = total - need - Math.min(10, total * 0.05);  // y outro
  let best = null;
  for (let s = desde; s <= hasta; s += 1) {
    const w = pts.filter((x) => x.t >= s && x.t < s + need);
    if (w.length < 10 || w.some((x) => x.v <= -55)) continue;   // con silencio, no
    const mean = w.reduce((a, x) => a + x.v, 0) / w.length;
    const sd = Math.sqrt(w.reduce((a, x) => a + (x.v - mean) ** 2, 0) / w.length);
    const score = mean - sd * 1.5;                              // con cuerpo y parejo
    if (!best || score > best.score) best = { s, score, mean, sd };
  }
  return best
    ? { s: best.s, medido: true, mean: +best.mean.toFixed(1), sd: +best.sd.toFixed(1) }
    : { s: Math.max(0, total * 0.3), medido: false };
}

export async function elegirPista({ seconds = NEED } = {}) {
  const primera = await pagina(1);
  const paginas = Math.max(1, Math.ceil(primera.total / 20));
  for (let intento = 0; intento < 25; intento++) {
    const p = 1 + Math.floor(Math.random() * Math.min(paginas, 50));
    const { docs } = await pagina(p);
    const limpios = docs.filter((d) => !rechazo(d.title));
    if (!limpios.length) continue;
    const album = rnd(limpios);

    const mr = await fetch(`https://archive.org/metadata/${album.identifier}`, { headers: UA });
    if (!mr.ok) continue;
    const meta = await mr.json();
    const temas = (meta.files || []).filter((f) => {
      if (!/\.mp3$/i.test(f.name)) return false;
      if (rechazo(f.title || f.name)) return false;
      const d = secs(f.length);
      return d >= Math.max(MIN_TRACK, seconds + 20) && d <= MAX_TRACK;
    });
    if (!temas.length) continue;
    const tema = rnd(temas);
    return {
      identifier: album.identifier,
      album: album.title,
      tema: tema.title || tema.name,
      archivo: tema.name,
      duracion: Math.round(secs(tema.length)),
      pagina: p, de: paginas, candidatos: docs.length, limpios: limpios.length,
      pozo: primera.total,
      url: `https://archive.org/download/${album.identifier}/${encodeURIComponent(tema.name)}`,
      page: `https://archive.org/details/${album.identifier}`
    };
  }
  throw new Error('no encontre pista despues de 25 intentos');
}

export async function prepararMusica({ seconds = NEED, out = OUT } = {}) {
  const pick = await elegirPista({ seconds });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const raw = out.replace(/\.mp3$/i, '') + '-full.mp3';

  const res = await fetch(pick.url, { headers: UA });
  if (!res.ok) throw new Error('no pude bajar la pista: HTTP ' + res.status);
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));

  const dur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration', '-of', 'csv=p=0', raw], { encoding: 'utf8' }).stdout.trim());
  const tr = mejorTramo(raw, dur, seconds);

  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(tr.s), '-t', String(seconds),
    '-i', raw,
    // -16 LUFS: queda debajo de la lectura, no encima. Fades para que no entre ni corte seco.
    '-af', `loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0, seconds - 2)}:d=2`,
    '-c:a', 'libmp3lame', '-b:a', '192k', out]);
  fs.unlinkSync(raw);

  return { ...pick, recorte: out, segundos: seconds, desde: Math.round(tr.s), medido: tr.medido, media: tr.mean, desvio: tr.sd };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('fetch-music.mjs')) {
  const r = DRY ? await elegirPista({ seconds: NEED }) : await prepararMusica({ seconds: NEED, out: OUT });
  console.log(`pozo: ${r.pozo} items · pagina ${r.pagina}/${r.de} · ${r.limpios}/${r.candidatos} candidatos limpios`);
  console.log(`pista: ${r.tema}`);
  console.log(`album: ${r.album}  (${r.duracion}s)`);
  console.log(r.page);
  if (!DRY) console.log(`recorte: ${r.segundos}s desde ${r.desde}s ${r.medido ? '(tramo medido)' : '(FALLBACK: no hubo perfil de volumen)'}`);
  if (JSONOUT) fs.writeFileSync(JSONOUT, JSON.stringify(r, null, 2));
}
