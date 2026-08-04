#!/usr/bin/env node
// Renderiza cada slide de un paquete de carrusel al viewport exacto de la plataforma
// y corre la QA programatica antes de aceptar los PNG.
//
// Uso (desde la carpeta del paquete, con el server local levantado):
//   node <skill-dir>/scripts/render-and-audit.mjs --port 8765
//
// Flags:
//   --package <dir>  carpeta del paquete (default: cwd)
//   --port <n>       puerto del server local (default: 8765)
//   --out <dir>      salida de PNGs (default: <package>/exports)
//   --audit-only     audita sin escribir PNGs
//
// Sale con codigo 3 si hay red issues. Un red issue bloquea la entrega:
// se arregla el fuente (HTML/CSS/datos) y se vuelve a renderizar. Nunca se parchea el PNG.
//
// Los AVISOS no bloquean pero hay que leerlos: senalan desequilibrios opticos que el
// DOM no ve (la caja es simetrica, la tinta no).
//
// Excepciones documentadas: si `window.CAROUSEL.layoutExceptions` incluye el id de un
// chequeo, ese chequeo baja a nota informativa. Ids validos:
//   cover-hook-centered | vertical-balance | counter-centered | optical-padding
// Toda excepcion tiene que estar decidida por el usuario y registrada en manifest.json
// bajo `layout_exceptions`, con el motivo.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Playwright puede estar instalado en el paquete, en la skill, o en otra skill de la coleccion.
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
      const mod = req('playwright');           // playwright es CJS
      if (mod?.chromium) return mod.chromium;
    } catch { /* siguiente base */ }
  }
  console.error(
    'No encontre Playwright. Instalalo con:  npm i playwright\n' +
    '(desde la carpeta del paquete del carrusel o desde la carpeta de la skill).'
  );
  process.exit(1);
}
const chromium = await loadChromium();

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
}
const pkg = path.resolve(arg('package', process.cwd()));
const port = Number(arg('port', 8765));
const outDir = path.resolve(arg('out', path.join(pkg, 'exports')));
const auditOnly = process.argv.includes('--audit-only');

const dataFile = fs.readFileSync(path.join(pkg, 'slide-data.js'), 'utf8');
const W = Number(dataFile.match(/width:\s*(\d+)/)?.[1] ?? 1080);
const H = Number(dataFile.match(/height:\s*(\d+)/)?.[1] ?? 1920);
const count = (dataFile.match(/^\s{4}\{/gm) || []).length;
if (!count) {
  console.error('No pude contar las slides en slide-data.js');
  process.exit(1);
}

if (!auditOnly) fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

const report = [];
for (let i = 1; i <= count; i++) {
  await page.goto(`http://127.0.0.1:${port}/index.html?slide=${i}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const audit = await page.evaluate(async ({ W, H }) => {
    const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE', 'svg', 'SVG']);
    const scale = W / 1080;
    const FLOOR = 40 * scale;        // piso tipografico general
    const FLOOR_NUM = 24 * scale;    // solo contadores puramente numericos
    const padX = W * 0.05;
    const padTop = H * 0.10;
    const padBot = H * 0.90;

    // Range.getClientRects() devuelve un rect por fragmento inline, no por linea: un texto
    // con dos fuentes ("Swipe 👉" = sans + emoji) da 2 rects en UNA sola linea. Agrupamos
    // por solapamiento vertical para contar lineas de verdad.
    const lineBoxes = (el) => {
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const rects = [...rg.getClientRects()].filter(x => x.width > 1 && x.height > 1);
      const lines = [];
      for (const r of rects) {
        const hit = lines.find(l =>
          Math.min(l.bottom, r.bottom) - Math.max(l.top, r.top) > Math.min(l.bottom - l.top, r.height) * 0.5);
        if (hit) {
          hit.top = Math.min(hit.top, r.top);
          hit.bottom = Math.max(hit.bottom, r.bottom);
          hit.left = Math.min(hit.left, r.left);
          hit.right = Math.max(hit.right, r.right);
        } else {
          lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
        }
      }
      return lines
        .map(l => ({ ...l, width: l.right - l.left }))
        .sort((a, b) => a.top - b.top);
    };

    const exceptions = (window.CAROUSEL && window.CAROUSEL.layoutExceptions) || [];
    // Bandas de densidad propias de la marca, si su preset las define. Sin esto, se
    // usan las de La Casa, que estan medidas sobre SU set publicado.
    const densityBudget = (window.CAROUSEL && window.CAROUSEL.densityBudget) || null;
    const slideEl = document.querySelector('.slide');
    const slideCls = (slideEl && typeof slideEl.className === 'string') ? slideEl.className : '';
    const isCTA = /\bs-cta\b/.test(slideCls);
    const isCover = /\bs-cover\b/.test(slideCls);

    // 1) fuentes realmente cargadas (solo las que usa algun texto de la slide)
    const used = new Set();
    document.querySelectorAll('.slide *').forEach(el => {
      if (el.textContent && el.textContent.trim() && !el.querySelector('*')) {
        used.add(getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim());
      }
    });
    const webFonts = [...used].filter(f => [...document.fonts].some(ff => ff.family === f));
    await Promise.all(webFonts.map(f => document.fonts.load(`${FLOOR}px "${f}"`)));
    const fontsMissing = webFonts.filter(f => !document.fonts.check(`${FLOOR}px "${f}"`));

    // 2) piso tipografico + 3) safe area + 6) huerfanas
    const small = [], outside = [], orphans = [];
    const walk = (el) => {
      if (SKIP.has(el.tagName)) return;
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          const p = node.parentElement;
          const size = parseFloat(getComputedStyle(p).fontSize);
          const txt = node.textContent.trim().slice(0, 40);
          const numericOnly = /^[0-9/]+$/.test(node.textContent.trim());
          const floor = numericOnly ? FLOOR_NUM : FLOOR;
          if (size < floor - 0.5) small.push({ txt, size: Math.round(size), floor: Math.round(floor) });

          const r = p.getBoundingClientRect();
          if (r.width && (r.left < padX - 0.5 || r.right > W - padX + 0.5 ||
                          r.top < padTop - 0.5 || r.bottom > padBot + 0.5)) {
            outside.push({ txt, box: [r.left, r.top, r.right, r.bottom].map(Math.round) });
          }

          // huerfana: la ultima linea del bloque es mucho mas angosta que la mas ancha
          const lines = lineBoxes(p);
          if (lines.length > 1) {
            const widest = Math.max(...lines.map(l => l.width));
            const last = lines[lines.length - 1].width;
            if (last / widest < 0.22) {
              orphans.push({ txt, lastLine: Math.round(last), widest: Math.round(widest) });
            }
          }
        } else if (node.nodeType === 1) walk(node);
      }
    };
    walk(document.body);

    // 4) overflow del canvas
    const doc = document.documentElement;
    const overflow = { w: doc.scrollWidth, h: doc.scrollHeight };

    // 5) imagenes/assets efectivamente cargados
    const brokenImages = [...document.images]
      .filter(im => !im.complete || im.naturalWidth === 0)
      .map(im => im.getAttribute('src'));

    // 7) hook de portada centrado
    let hook = null;
    const h1 = document.querySelector('h1');
    if (h1) {
      const r = h1.getBoundingClientRect();
      hook = {
        centerOffset: Math.round(Math.abs((r.left + r.right) / 2 - W / 2)),
        align: getComputedStyle(h1).textAlign
      };
    }

    // 8) balance vertical: negro arriba contra negro abajo.
    //    Un elemento que se elimina (un badge, un logo) suele dejar viva la constante de
    //    layout que existia para esquivarlo. Esto lo detecta.
    let minTop = Infinity, maxBot = -Infinity;
    document.querySelectorAll('.slide *').forEach(el => {
      if (SKIP.has(el.tagName) || el.classList.contains('contours')) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width >= W * 0.95 && r.height >= H * 0.95) return;   // fondo a sangre
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                      parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 ||
                      el.tagName === 'IMG';
      if (!hasText && !painted) return;
      minTop = Math.min(minTop, r.top);
      maxBot = Math.max(maxBot, r.bottom);
    });
    const balance = isFinite(minTop)
      ? { top: Math.round(minTop), bottom: Math.round(H - maxBot) }
      : null;

    // 9) contador: centrado en el canvas, no repartido entre marca y swipe
    let counter = null;
    const cEl = document.querySelector('.footer .counter') || document.querySelector('.counter');
    if (cEl) {
      const r = cEl.getBoundingClientRect();
      counter = {
        offset: Math.round(Math.abs((r.left + r.right) / 2 - W / 2)),
        size: Math.round(parseFloat(getComputedStyle(cEl).fontSize)),
        rect: [r.left, r.top, r.width, r.height].map(Math.round)
      };
    }
    // ¿la slide compone overlays sobre un asset fijo? Entonces hay que verificar que
    // el overlay no aterrice encima de la artwork: el asset no se puede reflowear.
    const fixedAsset = !!document.querySelector('.cta-base');

    // 10) cajas de cromo compactas para el chequeo optico a nivel pixel.
    //     El DOM no sirve para esto: la caja es simetrica, la tinta no. La caja de linea
    //     de una tipografia reserva espacio muerto sobre la mayuscula que abajo no existe,
    //     y los emoji traen su propio bearing lateral.
    const chrome = [];
    document.querySelectorAll('.slide *').forEach(el => {
      if (SKIP.has(el.tagName)) return;
      const cs = getComputedStyle(el);
      const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (!m) return;
      const parts = m[1].split(',').map(Number);
      if (parts.length > 3 && parts[3] < 0.9) return;      // casi transparente: el pixel no es fiable
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width >= W * 0.95 && r.height >= H * 0.95) return;
      if (r.height > 140 * scale) return;                  // solo cromo compacto: pildoras, chips, botones
      const txt = el.textContent.trim();
      if (!txt) return;
      if (lineBoxes(el).length !== 1) return;              // multilinea: el centrado optico no aplica igual
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      const bw = parseFloat(cs.borderTopWidth) || 0;
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      chrome.push({
        cls: (typeof el.className === 'string' && el.className) || el.tagName,
        txt: txt.slice(0, 24),
        inFooter: !!el.closest('.footer'),
        // en texto puramente numerico el bearing cambia con cada digito (un "2" no ocupa lo
        // mismo que un "1"): chequear el centrado horizontal ahi es ruido, no una falla
        checkH: padL > 0 && padR > 0 && r.width < W * 0.6 && !/^[0-9/\s]+$/.test(txt),
        inset: Math.max(2, Math.min(Math.ceil(radius + bw + 2), Math.floor(Math.min(r.width, r.height) / 2) - 1)),
        bg: parts.slice(0, 3).map(Math.round),
        rect: [
          Math.max(0, Math.round(r.left)),
          Math.max(0, Math.round(r.top)),
          Math.min(W, Math.round(r.width)),
          Math.min(H, Math.round(r.height))
        ]
      });
    });

    return { exceptions, densityBudget, isCTA, isCover, fixedAsset, fontsMissing, small, outside, orphans, overflow, brokenImages, hook, balance, counter, chrome };
  }, { W, H });

  // El PNG se saca siempre: el chequeo optico se hace sobre pixeles reales.
  const shot = await page.screenshot();
  if (!auditOnly) {
    fs.writeFileSync(path.join(outDir, String(i).padStart(2, '0') + '.png'), shot);
  }

  // Devolvemos el PNG al browser para medir la tinta dentro de cada caja de cromo.
  const optical = audit.chrome.length
    ? await page.evaluate(async ({ b64, boxes }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const out = [];
        for (const b of boxes) {
          const [x, y, w, h] = b.rect;
          if (w < 8 || h < 8) continue;
          const data = ctx.getImageData(x, y, w, h).data;
          const isInk = (px, py) => {
            const idx = (py * w + px) * 4;
            return Math.max(
              Math.abs(data[idx] - b.bg[0]),
              Math.abs(data[idx + 1] - b.bg[1]),
              Math.abs(data[idx + 2] - b.bg[2])
            ) > 40;
          };
          const ins = b.inset;
          let top = -1, bot = -1, left = -1, right = -1;
          for (let py = 0; py < h; py++) {
            for (let px = ins; px < w - ins; px++) {
              if (isInk(px, py)) { if (top < 0) top = py; bot = py; break; }
            }
          }
          for (let px = 0; px < w; px++) {
            for (let py = ins; py < h - ins; py++) {
              if (isInk(px, py)) { if (left < 0) left = px; right = px; break; }
            }
          }
          if (top < 0 || left < 0) continue;
          out.push({
            cls: b.cls, txt: b.txt, inFooter: b.inFooter, checkH: b.checkH,
            above: top, below: h - 1 - bot,
            leftGap: left, rightGap: w - 1 - right
          });
        }
        return out;
      }, { b64: shot.toString('base64'), boxes: audit.chrome })
    : [];

  // Densidad: se mide sobre el PNG, que es lo que ve quien scrollea. Tres metricas
  // independientes de la tipografia: cobertura de tinta, renglones y bloques visuales.
  const density = audit.isCTA ? null : await page.evaluate(async ({ b64 }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const W2 = c.width, H2 = c.height;
    const d = ctx.getImageData(0, 0, W2, H2).data;
    const rows = [];
    let total = 0;
    for (let y = 0; y < H2; y += 2) {
      let n = 0;
      for (let x = 0; x < W2; x += 2) {
        const i = (y * W2 + x) * 4;
        if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 110) n++;
      }
      total += n;
      if (n > 2) rows.push(y);
    }
    const runs = (gap) => {
      if (!rows.length) return 0;
      let k = 1;
      for (let i = 1; i < rows.length; i++) if (rows[i] - rows[i - 1] > gap) k++;
      return k;
    };
    return {
      coverage: +(total / ((W2 / 2) * (H2 / 2)) * 100).toFixed(1),
      lines: runs(8),
      blocks: runs(30)
    };
  }, { b64: shot.toString('base64') });

  // Overlay sobre asset fijo: la artwork no se puede reflowear, asi que el overlay tiene
  // que caer en zona vacia. Miramos el anillo alrededor del contador en el PNG ya compuesto.
  let overlayClash = null;
  if (audit.fixedAsset && audit.counter) {
    overlayClash = await page.evaluate(async ({ b64, rect, pad }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const [x, y, w, h] = rect;
      const X = Math.max(0, x - pad), Y = Math.max(0, y - pad);
      const Wd = Math.min(c.width - X, w + pad * 2), Hd = Math.min(c.height - Y, h + pad * 2);
      const d = ctx.getImageData(X, Y, Wd, Hd).data;
      let hits = 0;
      for (let py = 0; py < Hd; py++) {
        for (let px2 = 0; px2 < Wd; px2++) {
          const ax = X + px2, ay = Y + py;
          if (ax >= x && ax < x + w && ay >= y && ay < y + h) continue;  // dentro de la pildora
          const idx = (py * Wd + px2) * 4;
          if ((d[idx] + d[idx + 1] + d[idx + 2]) / 3 > 90) hits++;
        }
      }
      return hits;
    }, { b64: shot.toString('base64'), rect: audit.counter.rect, pad: 14 });
  }

  delete audit.chrome;
  report.push({ slide: i, ...audit, optical, overlayClash, density });
}
await browser.close();

fs.writeFileSync(path.join(pkg, 'qa-report.json'), JSON.stringify(report, null, 2));

const scale = W / 1080;

// PRESUPUESTO DE DENSIDAD — banda con piso Y techo, no solo techo. Un slide vacio es
// tan poco entregable como un muro, y corregir en una direccion sin limite en la otra
// es como se llega al problema opuesto.
//
// Derivado de los percentiles del set publicado de La Casa (44 slides, 1080x1920):
//   contenido  cobertura p10 4,2 / p50 5,2 / p90 11,2 / max 12,1
//              renglones 10 / 13 / 18 / 19      bloques 6 / 8 / 11 / 14
//   portada    cobertura p10 6,1 / p50 6,5 / p90 8,2 / max 8,3
//              renglones 8 / 12 / 16 / 16       bloques 6 / 8 / 8 / 8
//
// Fuera de la banda = aviso. Fuera del limite duro = red issue, en las dos direcciones.
// La cobertura escala con el area del lienzo (el mismo contenido en 3:4 cubre ~33% mas);
// los conteos de renglones y bloques no escalan, son contenido.
//
// NOTA: la banda de cobertura para 1080x1440 esta DERIVADA por area, no medida. Cuando
// haya set publicado de Instagram, medilo con el mismo metodo y reemplaza estos numeros.
const areaFactor = (1080 * 1920) / (W * H);
// Bandas por defecto: las de La Casa de Aurelio, medidas sobre SU set publicado.
// Otra marca no se juzga con estas. Su preset define las propias en slide-data.js:
//   densityBudget: { cover: {...}, content: {...} }
// y lo que declare pisa solo esas claves. Si no las midio todavia, la salida honesta
// es la excepcion documentada 'density-budget', no heredar estos numeros en silencio.
const DEFAULT_BUDGET = {
  // El piso de cobertura de portada es 4,0 y no 4,5 (el p10 del set) por un principio:
  // el set del que se deriva la banda no puede quedar rechazado por ella. A 4,5 una
  // portada publicada caia en rojo por 0,01 puntos. Validacion sobre las 44 slides:
  // 73% limpias, 25% aviso, 0% rojo.
  cover:   { cov: [6.0, 8.5],  covHard: [4.0, 10.5], lines: [8, 16],  linesHard: [6, 20], blocks: [6, 8],  blocksHard: [4, 11] },
  content: { cov: [4.0, 11.5], covHard: [3.0, 13.5], lines: [10, 18], linesHard: [7, 22], blocks: [6, 11], blocksHard: [4, 14] }
};
const customBudget = report[0]?.densityBudget || null;
const BUDGET = {
  cover:   { ...DEFAULT_BUDGET.cover,   ...(customBudget?.cover   || {}) },
  content: { ...DEFAULT_BUDGET.content, ...(customBudget?.content || {}) }
};
if (customBudget) {
  const keys = [...new Set([...Object.keys(customBudget.cover || {}), ...Object.keys(customBudget.content || {})])];
  console.log(`Presupuesto de densidad propio de la marca (${keys.join(', ') || 'sin claves'}); el resto sale de las bandas por defecto.`);
}

const red = [];
const warn = [];
const notes = [];
const exceptions = report[0]?.exceptions || [];
const excepted = (id) => exceptions.includes(id);

for (const r of report) {
  const at = (list, m) => list.push(`slide ${r.slide}: ${m}`);

  for (const f of r.fontsMissing) at(red, `la fuente "${f}" no cargo (fallback silencioso a fuente de sistema)`);
  for (const s of r.small) at(red, `"${s.txt}" a ${s.size}px, piso ${s.floor}px`);
  for (const o of r.outside) at(red, `"${o.txt}" fuera del safe area [${o.box}]`);
  for (const o of r.orphans) at(red, `posible huerfana: "${o.txt}" — ultima linea ${o.lastLine}px vs ${o.widest}px`);
  for (const b of r.brokenImages) at(red, `asset no cargado: ${b}`);
  if (r.overflow.h > H + 1 || r.overflow.w > W + 1) at(red, `overflow ${r.overflow.w}x${r.overflow.h} (canvas ${W}x${H})`);

  // hook de portada
  if (r.slide === 1 && r.hook && (r.hook.centerOffset > 2 || r.hook.align !== 'center')) {
    const msg = `hook de portada no centrado (offset ${r.hook.centerOffset}px, text-align ${r.hook.align})`;
    at(excepted('cover-hook-centered') ? notes : red, msg);
  }

  // balance vertical (la CTA es asset fijo: conserva su propia distribucion)
  if (r.balance && !r.isCTA) {
    const delta = Math.abs(r.balance.top - r.balance.bottom);
    const limit = H * 0.04;
    if (delta > limit) {
      const msg = `desbalance vertical: ${r.balance.top}px arriba contra ${r.balance.bottom}px abajo ` +
                  `(${Math.round(delta)}px de diferencia, limite ${Math.round(limit)}px). ` +
                  `Si sacaste un elemento, revisa la constante de layout que existia para el.`;
      at(excepted('vertical-balance') ? notes : red, msg);
    }
  }

  // contador
  if (r.counter) {
    if (r.counter.offset > 2) {
      const msg = `contador desplazado ${r.counter.offset}px del centro del canvas ` +
                  `(centrar en x=${W / 2}, no repartir el espacio entre marca y swipe)`;
      at(excepted('counter-centered') ? notes : red, msg);
    }
    if (r.overlayClash) {
      at(red, `el contador se apoya sobre la artwork del asset fijo (${r.overlayClash}px de tinta a menos de 14px de la pildora). ` +
              `El asset no se reflowea: hay que regenerarlo dejando libre la banda del contador.`);
    }
    if (r.counter.size > 30 * scale) {
      at(warn, `contador a ${r.counter.size}px: el cromo numerico va chico (24-26px a 1080 de ancho)`);
    }
  }

  // densidad: ni muro ni pagina vacia
  if (r.density) {
    const B = r.isCover ? BUDGET.cover : BUDGET.content;
    const band = (b) => [b[0] * areaFactor, b[1] * areaFactor];
    const check = (val, soft, hard, name, unit) => {
      const over = val > hard[1], under = val < hard[0];
      if (over || under) {
        const msg = over
          ? `${name} ${val}${unit}: pasa el limite de ${hard[1].toFixed(1)}${unit}. Saca una capa de informacion o parti el slide en dos. No bajes el cuerpo ni aprietes margenes.`
          : `${name} ${val}${unit}: por debajo de ${hard[0].toFixed(1)}${unit}, el slide quedo vacio. Agranda el contenido o sumale una capa.`;
        at(excepted('density-budget') ? notes : red, msg);
      } else if (val > soft[1] || val < soft[0]) {
        at(warn, `${name} ${val}${unit} fuera de la banda del set publicado (${soft[0].toFixed(1)}-${soft[1].toFixed(1)}${unit}): ` +
                 (val > soft[1] ? 'va cargado.' : 'va flojo.'));
      }
    };
    check(r.density.coverage, band(B.cov), band(B.covHard), 'cobertura de tinta', '%');
    check(r.density.lines, B.lines, B.linesHard, 'renglones', '');
    check(r.density.blocks, B.blocks, B.blocksHard, 'bloques visuales', '');
  }

  // centrado optico dentro de cajas de cromo
  for (const o of r.optical || []) {
    const dv = Math.abs(o.above - o.below);
    const dh = Math.abs(o.leftGap - o.rightGap);
    // Vertical mas tolerante que horizontal a proposito: una palabra con descendente
    // ("Swipe", "Investigar") siempre deja menos aire abajo si se centra opticamente
    // sobre la mayuscula, que es lo correcto. Recien pasados los 8px el desbalance
    // deja de ser la sombra del descendente y pasa a ser un error de caja.
    const limV = 8 * scale;
    const limH = 4 * scale;
    if (dv > limV) {
      const msg = `"${o.txt}" (.${o.cls}): ${o.above}px de fondo sobre la tinta contra ${o.below}px debajo. ` +
                  `Es la caja de linea de la fuente, no el padding: compensa con padding asimetrico o translateY.`;
      at(excepted('optical-padding') ? notes : (o.inFooter ? red : warn), msg);
    }
    if (o.checkH && dh > limH) {
      const msg = `"${o.txt}" (.${o.cls}): ${o.leftGap}px de fondo a la izquierda de la tinta contra ${o.rightGap}px a la derecha ` +
                  `(los emoji traen bearing propio: compensa con padding asimetrico).`;
      at(excepted('optical-padding') ? notes : (o.inFooter ? red : warn), msg);
    }
  }
}

if (notes.length) {
  console.log(`\n${notes.length} excepcion(es) documentada(s) — no bloquean:`);
  notes.forEach(m => console.log('  · ' + m));
}
if (warn.length) {
  console.log(`\n${warn.length} AVISO(S) — no bloquean, pero miralos:`);
  warn.forEach(m => console.log('  ! ' + m));
}
if (red.length) {
  console.log(`\n${red.length} RED ISSUE(S) — bloquean la entrega:`);
  red.forEach(m => console.log('  - ' + m));
  console.log('\nArregla el fuente y volve a renderizar. No parchees el PNG.');
  process.exit(3);
}
console.log(`\nQA automatica OK: ${count} slides, sin red issues.`);
console.log('Falta la revision visual del contact sheet: sentido del texto, solapamientos, ritmo.');
