#!/usr/bin/env node
// QA DE SERIE: lo que no se ve mirando una placa sola.
//
// render-and-audit.mjs juzga cada placa por separado y por eso no ve el defecto mas
// caro del carrusel: que las nueve se lean desprolijas sin que ninguna este mal.
// Dos piezas del mismo rol a 44px y 52px pasan las dos. Un titular que arranca 180px
// mas abajo que los demas pasa. Nueve placas con el mismo recurso pasan. El mismo
// icono repetido por inercia pasa.
//
// Uso (desde la carpeta del paquete, con el server local levantado):
//   node <skill-dir>/scripts/audit-serie.mjs --port 8765
//
// Sale con codigo 3 si hay red issues.
//
// Excepciones: `window.CAROUSEL.seriesExceptions` en slide-data.js baja un chequeo a
// nota. Ids validos:
//   arranque-por-rol | cuerpo-por-rol | variedad-de-recurso | recurso-consecutivo
//   | icono-repetido | acento-consecutivo | fila-despoblada
// Como toda excepcion: la decide el usuario y va tambien en manifest.json.
// `repeticion-deliberada` (06-handmade) implica variedad-de-recurso y
// recurso-consecutivo.
import fs from 'node:fs';
import path from 'node:path';
import { loadChromium } from './lib/load-chromium.mjs';

const chromium = await loadChromium();
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const pkg = path.resolve(arg('package', process.cwd()));
const port = Number(arg('port', 8765));

const dataFile = fs.readFileSync(path.join(pkg, 'slide-data.js'), 'utf8');
const W = Number(dataFile.match(/width:\s*(\d+)/)?.[1] ?? 1080);
const H = Number(dataFile.match(/height:\s*(\d+)/)?.[1] ?? 1440);
const count = (dataFile.match(/^\s{4}\{/gm) || []).length;
if (!count) { console.error('No pude contar las slides en slide-data.js'); process.exit(1); }

// Roles logicos. El nombre de clase cambia por template; el rol es el mismo, y es lo
// que tiene que medir igual en las nueve placas.
const ROLES = {
  rotulo:  '.kicker, .eyebrow, .tab',
  titular: 'h1, h2',
  bajada:  '.lede, .body-copy, .sub, .bajada',
  cierre:  '.close, .punch, .verdict, .remate',
  footer:  '.footer, .cartucho',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const slides = [];

for (let i = 1; i <= count; i++) {
  await page.goto(`http://127.0.0.1:${port}/index.html?slide=${i}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const s = await page.evaluate(({ ROLES, W, H }) => {
    const d = window.CAROUSEL || {};
    const idx = Number(new URLSearchParams(location.search).get('slide')) - 1;
    const sd = (d.slides || [])[idx] || {};
    const vis = el => {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const roles = {};
    for (const [name, sel] of Object.entries(ROLES)) {
      // Debajo de 20px no es el rol: es un rotulo de eje, un contador o una marca
      // decorativa que comparte clase. Contarlo produce avisos que no significan nada.
      const el = [...document.querySelectorAll(sel)]
        .find(e => vis(e) && parseFloat(getComputedStyle(e).fontSize) >= 20);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      roles[name] = {
        top: Math.round(r.top),
        size: Math.round(parseFloat(getComputedStyle(el).fontSize)),
        cls: (typeof el.className === 'string' && el.className.trim()) || el.tagName.toLowerCase(),
      };
    }

    // Iconos: la forma dibujada, no el elemento. Dos <path> iguales son el mismo icono.
    const icons = [...document.querySelectorAll('svg path[d]')]
      .filter(p => vis(p.closest('svg')))
      .map(p => p.getAttribute('d'))
      .filter(dd => dd && dd.length > 24 && dd.length < 4000);

    // Acento de la placa: la clase de color que lleva el rotulo del encabezado.
    const accentEl = document.querySelector('.eyebrow, .kicker, .tab');
    const accent = accentEl
      ? [...accentEl.classList].filter(c => !['eyebrow', 'kicker', 'tab'].includes(c)).join(' ')
      : '';

    // Ocupacion por franja horizontal: para cada banda de 180px dentro del area
    // segura, que porcentaje del ancho tiene contenido. Una franja con un solo
    // elemento chico (la mascota sola) queda muy por debajo del resto.
    const BAND = 180, top = H * 0.10, bot = H * 0.90;
    const bands = [];
    for (let y = top; y + BAND <= bot; y += BAND) bands.push({ y: Math.round(y), l: Infinity, r: -Infinity, h: 0 });
    document.querySelectorAll('.slide *').forEach(el => {
      if (['SCRIPT', 'STYLE', 'BR', 'DEFS'].includes(el.tagName)) return;
      if (el.closest('.footer')) return;
      if (!vis(el)) return;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width >= W * 0.95 && r.height >= H * 0.95) return;
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || el.tagName === 'IMG' || el.tagName === 'svg';
      if (!hasText && !painted) return;
      for (const b of bands) {
        if (r.bottom <= b.y || r.top >= b.y + BAND) continue;
        b.l = Math.min(b.l, r.left); b.r = Math.max(b.r, r.right);
        b.h = Math.max(b.h, r.height);
      }
    });
    const fill = bands.map(b => ({
      y: b.y,
      pct: isFinite(b.l) ? Math.round((b.r - b.l) / W * 100) : 0,
      h: Math.round(b.h),
    }));

    return {
      type: sd.type || '(sin type)',
      isCover: sd.type === 'cover' || !!document.querySelector('.s-cover'),
      isCTA: sd.type === 'cta' || !!document.querySelector('.s-cta, .cta-base'),
      exceptions: d.seriesExceptions || [],
      roles, icons, accent, fill,
    };
  }, { ROLES, W, H });
  slides.push(s);
}
await browser.close();

// ---------------------------------------------------------------- informe
const exc = new Set(slides[0]?.exceptions || []);
if (exc.has('repeticion-deliberada')) { exc.add('variedad-de-recurso'); exc.add('recurso-consecutivo'); }
const red = [], warn = [], note = [];
const push = (id, level, msg) => (exc.has(id) ? note : level === 'red' ? red : warn).push(`[${id}] ${msg}`);
const contenido = slides.map((s, i) => ({ ...s, n: i + 1 })).filter(s => !s.isCTA);
// La portada es otro rol: titular mas grande y arranque propio por diseno. Los
// chequeos de consistencia corren sobre las placas de contenido, sin ella.
const cuerpo = contenido.filter(s => !s.isCover);

// 1. Cuerpo por rol: dos piezas que cumplen el mismo rol llevan el mismo cuerpo.
for (const rol of Object.keys(ROLES)) {
  const sizes = new Map();
  for (const s of cuerpo) {
    const r = s.roles[rol]; if (!r) continue;
    if (!sizes.has(r.size)) sizes.set(r.size, []);
    sizes.get(r.size).push(`${s.n} (.${r.cls.split(/\s+/)[0]})`);
  }
  if (sizes.size > 1) {
    const detalle = [...sizes.entries()].sort((a, b) => b[1].length - a[1].length)
      .map(([px, ns]) => `${px}px en ${ns.join(', ')}`).join(' · ');
    push('cuerpo-por-rol', 'red',
      `el rol "${rol}" se compone a cuerpos distintos: ${detalle}. El arreglo va en el template, no en el paquete: si dos piezas del estilo estan desalineadas, todo carrusel que lo use las hereda.`);
  }
}

// 2. Arranque por rol: la altura donde empieza cada rol es la misma en toda la serie.
const TOL = 12;
for (const rol of ['rotulo', 'titular']) {
  const tops = cuerpo.filter(s => s.roles[rol]).map(s => ({ n: s.n, top: s.roles[rol].top }));
  if (tops.length < 3) continue;
  const counts = new Map();
  tops.forEach(t => counts.set(t.top, (counts.get(t.top) || 0) + 1));
  const base = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const fuera = tops.filter(t => Math.abs(t.top - base) > TOL);
  if (fuera.length) {
    push('arranque-por-rol', 'red',
      `"${rol}" arranca en ${base}px en el resto de la serie, y en ${fuera.map(f => `${f.n} (${f.top}px)`).join(', ')} no. ` +
      'Lo que alinea la serie no se toca para cerrar un hueco: a esa placa le falta contenido.');
  }
}

// 3. Variedad de recurso.
const tipos = new Map();
contenido.forEach(s => tipos.set(s.type, (tipos.get(s.type) || 0) + 1));
const techo = Math.max(1, Math.floor(contenido.length * 0.4));
for (const [t, n] of tipos) {
  if (n > techo) push('variedad-de-recurso', 'warn',
    `"${t}" ocupa ${n} de ${contenido.length} placas (techo ${techo}). Si la repeticion es la estructura del contenido, declarala con el motivo; si no, es inercia.`);
}
for (let i = 1; i < contenido.length; i++) {
  if (contenido[i].type === contenido[i - 1].type) {
    push('recurso-consecutivo', 'warn',
      `placas ${contenido[i - 1].n} y ${contenido[i].n} llevan el mismo recurso ("${contenido[i].type}") una detras de otra.`);
  }
}

// 4. Icono repetido.
const porIcono = new Map();
contenido.forEach(s => new Set(s.icons).forEach(d => {
  if (!porIcono.has(d)) porIcono.set(d, []);
  porIcono.get(d).push(s.n);
}));
for (const [, ns] of porIcono) {
  if (ns.length > 1) {
    push('icono-repetido', 'warn',
      `el mismo icono aparece en las placas ${ns.join(', ')}. Una forma por concepto, no por placa: si no es el mismo concepto, cambialo.`);
  }
}

// 5. Acento repetido. Dos placas seguidas con el mismo acento es normal donde el
//    acento tiene funcion asignada (verde = evidencia): dos evidencias seguidas van
//    las dos en verde. Tres o mas ya se lee como una tira del mismo color.
{
  let run = [];
  const cerrar = () => {
    if (run.length >= 3) {
      push('acento-consecutivo', 'warn',
        `placas ${run.map(s => s.n).join(', ')} llevan el mismo acento ("${run[0].accent}") seguidas. Con funcion asignada, dos seguidas es normal; tres se lee como una tira de un solo color.`);
    }
    run = [];
  };
  for (const s of cuerpo) {
    if (s.accent && run.length && run[0].accent === s.accent) run.push(s);
    else { cerrar(); run = s.accent ? [s] : []; }
  }
  cerrar();
}

// 6. Fila despoblada: una franja ocupada por un solo bloque angosto, con el resto
//    del ancho vacio a la misma altura. Solo cuenta si lo que hay ahi es un bloque
//    de verdad (>120px de alto): un renglon de rotulos de eje es angosto por
//    definicion y no es un hueco.
for (const s of contenido) {
  const llenas = s.fill.filter(f => f.pct > 70).length;
  const flacas = s.fill.filter(f => f.pct > 0 && f.pct < 35 && f.h > 120);
  if (llenas >= 1 && flacas.length) {
    push('fila-despoblada', 'warn',
      `placa ${s.n}: la franja en y=${flacas.map(f => f.y).join(',')} ocupa menos del 35% del ancho mientras otras pasan el 70%. ` +
      'El hueco que se nota esta AL LADO del elemento, a la misma altura: apilar algo arriba o abajo no lo arregla.');
  }
}

// ---------------------------------------------------------------- salida
const linea = (t, xs) => { if (!xs.length) return; console.log(`\n${t}`); xs.forEach(x => console.log('  ' + x)); };
console.log(`QA de serie — ${contenido.length} placas de contenido${slides.length > contenido.length ? ' + CTA' : ''}`);
console.log(`recursos: ${[...tipos.entries()].map(([t, n]) => `${t}x${n}`).join(' · ')}`);
linea('RED ISSUES (bloquean la entrega):', red);
linea('AVISOS (leelos, no bloquean):', warn);
linea('NOTAS (excepcion declarada):', note);
if (!red.length && !warn.length) console.log('\nSin hallazgos de serie.');
console.log('\nEsto no reemplaza mirar las placas: el ritmo, el sentido y la repeticion');
console.log('de composicion se ven en el contact sheet, no en un script.');
process.exit(red.length ? 3 : 0);
