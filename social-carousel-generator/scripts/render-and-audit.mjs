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
//   | density-budget | slide-grammar | typography-floor | safe-area | internal-gap
//
// typography-floor y safe-area son las mas caras de conceder: bajan a nota TODOS los
// avisos de su tipo, incluido el error real que se cuele entre ellos. Van solo cuando
// el template las tiene como decision de disenio (02-editorial-oscuro-v2 usa ambas) y
// nunca para acallar un slide suelto que no entra.
// Toda excepcion tiene que estar decidida por el usuario y registrada en manifest.json
// bajo `layout_exceptions`, con el motivo.
import fs from 'node:fs';
import path from 'node:path';

import { loadChromium } from './lib/load-chromium.mjs';
// Playwright puede estar instalado en el paquete, en la skill, o en otra skill de la coleccion.
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
    // Etiquetas y referencias DENTRO de un grafico o diagrama: rotulos de eje, marcas
    // de escala, leyendas. No son texto de lectura, son referencia de lo que se mira,
    // y al mismo cuerpo que un subtitulo compiten con el y se chocan entre columnas.
    // Se marca con la clase `chart` o `diagram` en el contenedor. Titular, cuerpo,
    // veredicto, checklist, footer y CTA NO entran aca: esos siguen en 40.
    const FLOOR_CHART = 24 * scale;
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
    const small = [], outside = [], orphans = [], overFoot = [];

    // Pie anclado: los estilos que lo sacan del flujo (`position: absolute`) ganan que
    // este siempre a la misma altura, pero a cambio el contenido que no entra ya no lo
    // empuja — se le mete debajo y ningun otro chequeo lo ve. Este lo mira.
    const footEl = document.querySelector('.footer, .cartucho, .foot');
    const footTop = footEl && getComputedStyle(footEl).position === 'absolute'
      ? footEl.getBoundingClientRect().top : null;
    const walk = (el) => {
      if (SKIP.has(el.tagName)) return;
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          const p = node.parentElement;
          const size = parseFloat(getComputedStyle(p).fontSize);
          const txt = node.textContent.trim().slice(0, 40);
          const numericOnly = /^[0-9/]+$/.test(node.textContent.trim());
          const inChart = !!(p.closest && p.closest('.chart, .diagram'));
          const floor = numericOnly ? FLOOR_NUM : inChart ? FLOOR_CHART : FLOOR;
          if (size < floor - 0.5) small.push({ txt, size: Math.round(size), floor: Math.round(floor) });

          const r = p.getBoundingClientRect();
          if (r.width && (r.left < padX - 0.5 || r.right > W - padX + 0.5 ||
                          r.top < padTop - 0.5 || r.bottom > padBot + 0.5)) {
            outside.push({ txt, box: [r.left, r.top, r.right, r.bottom].map(Math.round) });
          }

          if (footTop !== null && !p.closest('.footer, .cartucho, .foot') && r.height &&
              r.bottom > footTop + 0.5) {
            overFoot.push({ txt, invade: Math.round(r.bottom - footTop) });
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

    // 6b) gramatica de la marca: kicker + titular en todo slide de contenido.
    //     Es la regla que ningun otro chequeo ve. Un carrusel entero salio con
    //     `kicker + parrafo` y sin titular, paso tamano, piso, safe area y balance,
    //     y aun asi no era la marca. Se mide la presencia, no el contenido.
    //     El titular no siempre es un <h1>: en los slides de cifra, la cifra grande
    //     HACE de titular (un "25,6%" a 110px manda el slide igual que un titular).
    //     Por eso cuenta como titular cualquier elemento de 90px o mas. Un cuerpo
    //     inflado a 64-70px no llega, que es justo lo que hay que agarrar.
    const bigType = [...document.querySelectorAll('.slide *')].some(el => {
      if (!el.textContent || !el.textContent.trim()) return false;
      return parseFloat(getComputedStyle(el).fontSize) >= 90 * scale;
    });
    //     El nombre de la clase varia por template, pero el elemento es el mismo:
    //     el rotulo corto que encabeza el slide. 01-editorial-oscuro lo llama
    //     `.kicker`, 02-editorial-oscuro-v2 `.eyebrow`, 03-cuaderno-de-taller y
    //     05-plano-de-taller `.tab` (la pestania de ficha). Cuentan todos.
    const grammar = {
      kicker: !!document.querySelector('.kicker, .eyebrow, .tab'),
      // Cuenta cualquier etiqueta de titular, no solo h1: 04-plano-en-negativo usa
      // h2 a 88px y quedaba 2px por debajo del umbral de cifra dominante, con lo
      // que un slide con titular se reportaba como si no lo tuviera. Lo que el
      // chequeo busca es que el slide tenga un titular, y un h2 lo es.
      h1: !!document.querySelector('h1, h2') || bigType
    };

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

    return { exceptions, densityBudget, isCTA, isCover, fixedAsset, grammar, fontsMissing, small, outside, orphans, overFoot, overflow, brokenImages, hook, balance, counter, chrome };
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

    // "Tinta" es lo que CONTRASTA con el campo, no lo que es claro. Medido como
    // brillo > 110 fijo, un template de fondo claro da 95% de cobertura y un solo
    // renglon: el campo entero cuenta como tinta y el analisis se vuelve basura.
    // Se mide el brillo modal (el campo domina el lienzo) y se cuenta lo que se
    // aparta de el mas que el umbral. Sobre campo oscuro (brillo ~5) eso da
    // exactamente el ">110" original, asi que las bandas medidas sobre el set de
    // La Casa siguen valiendo sin recalibrar.
    const INK_DELTA = 105;
    const hist = new Uint32Array(256);
    for (let y = 0; y < H2; y += 2) {
      for (let x = 0; x < W2; x += 2) {
        const i = (y * W2 + x) * 4;
        hist[Math.round((d[i] + d[i + 1] + d[i + 2]) / 3)]++;
      }
    }
    let field = 0;
    for (let v = 1; v < 256; v++) if (hist[v] > hist[field]) field = v;

    const rows = [];
    let total = 0;
    for (let y = 0; y < H2; y += 2) {
      let n = 0;
      for (let x = 0; x < W2; x += 2) {
        const i = (y * W2 + x) * 4;
        if (Math.abs((d[i] + d[i + 1] + d[i + 2]) / 3 - field) > INK_DELTA) n++;
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
    // Hueco interno mas grande: la distancia vertical mas larga sin nada de tinta
    // ENTRE el primer y el ultimo bloque de contenido. El chequeo de balance vertical
    // solo mira los extremos, asi que un slide con todo pegado arriba y abajo y un
    // agujero enorme en el medio le pasa con delta cero. Esto lo agarra.
    let gap = 0, gapAt = 0;
    for (let i = 1; i < rows.length; i++) {
      const d = rows[i] - rows[i - 1];
      if (d > gap) { gap = d; gapAt = rows[i - 1]; }
    }

    return {
      coverage: +(total / ((W2 / 2) * (H2 / 2)) * 100).toFixed(1),
      lines: runs(8),
      blocks: runs(30),
      gap: Math.round(gap * (H2 > 1500 ? 1 : 1)),
      gapAt: Math.round(gapAt)
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
// MEDIDO sobre el set publicado de La Casa en 1080x1440: 45 slides, 8 portadas y 37 de
// contenido, de 8 carruseles. Percentiles:
//   contenido  cobertura min 4,8 / p10 6,6 / p50 9,3 / p90 18,9 / max 20,9
//              renglones 7 / 9,6 / 14 / 17 / 19      bloques 5 / 6 / 8 / 10 / 11
//   portada    cobertura min 6,5 / p10 7,6 / p50 9,8 / p90 10,4 / max 10,6
//              renglones 8 / 8,7 / 10,5 / 14,6 / 16  bloques 6 / 6 / 7,5 / 8,3 / 9
//
// Antes estas bandas eran las de 1080x1920 DERIVADAS por area, no medidas, y rechazaban
// en rojo slides realmente publicados en 1080x1440. Ahora la referencia es 1080x1440 y
// el factor de area escala hacia los otros tamanos, no desde ellos.
//
// Fuera de la banda = aviso. Fuera del limite duro = red issue, en las dos direcciones.
// La cobertura escala con el area del lienzo; los conteos de renglones y bloques no
// escalan, son contenido.
const areaFactor = (1080 * 1440) / (W * H);
// Bandas por defecto: las de La Casa de Aurelio, medidas sobre SU set publicado.
// Otra marca no se juzga con estas. Su preset define las propias en slide-data.js:
//   densityBudget: { cover: {...}, content: {...} }
// y lo que declare pisa solo esas claves. Si no las midio todavia, la salida honesta
// es la excepcion documentada 'density-budget', no heredar estos numeros en silencio.
const DEFAULT_BUDGET = {
  // Principio que fija los limites duros: el set del que sale la banda no puede quedar
  // rechazado por ella. Por eso cada `Hard` cubre el min y el max medidos con margen.
  cover:   { cov: [7.0, 10.5], covHard: [6.0, 11.5], lines: [8, 16],  linesHard: [7, 18], blocks: [6, 9],  blocksHard: [5, 10] },
  content: { cov: [6.0, 19.0], covHard: [4.5, 21.5], lines: [9, 17],  linesHard: [6, 20], blocks: [6, 10], blocksHard: [4, 12] }
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
  for (const s of r.small) at(excepted('typography-floor') ? notes : red, `"${s.txt}" a ${s.size}px, piso ${s.floor}px`);
  for (const o of r.outside) at(excepted('safe-area') ? notes : red, `"${o.txt}" fuera del safe area [${o.box}]`);
  for (const o of r.orphans) at(red, `posible huerfana: "${o.txt}" — ultima linea ${o.lastLine}px vs ${o.widest}px`);
  // Contenido metido debajo del pie anclado. No lo agarra ningun otro chequeo: con el pie
  // fuera del flujo, el desbalance vertical ya no se dispara y el safe area suele estar
  // exceptuado. Es red issue siempre — un texto tapado por el pie no se entrega.
  for (const o of r.overFoot) at(red, `"${o.txt}" queda debajo del pie anclado (invade ${o.invade}px). Acorta el contenido; no corras el pie ni achiques el cuerpo.`);
  for (const b of r.brokenImages) at(red, `asset no cargado: ${b}`);
  if (r.overflow.h > H + 1 || r.overflow.w > W + 1) at(red, `overflow ${r.overflow.w}x${r.overflow.h} (canvas ${W}x${H})`);

  // gramatica de la marca: kicker + titular en todo slide de contenido.
  // La portada y la CTA quedan afuera: la portada tiene su propia composicion y la CTA
  // es un asset fijo.
  if (!r.isCTA && !r.isCover && r.grammar) {
    const falta = [!r.grammar.kicker && 'kicker', !r.grammar.h1 && 'titular'].filter(Boolean);
    if (falta.length) {
      at(excepted('slide-grammar') ? notes : red,
         `slide de contenido sin ${falta.join(' ni ')}. La gramatica de la marca es ` +
         `kicker + titular + cuerpo + componente; sin el titular el slide queda vacio y ` +
         `la salida facil es agrandar el texto, que no es la salida.`);
    }
  }

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

  // hueco interno: el vacio vertical mas largo ENTRE bloques de contenido.
  //
  // El balance vertical de arriba solo compara los extremos — el hueco sobre el primer
  // elemento contra el hueco bajo el ultimo. Un slide con todo pegado arriba y abajo y
  // un agujero enorme en el medio le pasa con delta cero, y ese es justo el defecto que
  // se ve de lejos: "las cosas quedaron re separadas".
  //
  // Los cortes salen de inspeccion visual sobre el set de ejemplos (2026-08-26): 252px
  // se leyo como aire deliberado y 290px como agujero. Aviso en 260, bloqueo en 280.
  // Escalan con el alto del lienzo.
  //
  // EL ARREGLO ES MAS CONTENIDO O MENOS SEPARACION, NUNCA AGRANDAR LO QUE YA ESTA.
  // Escalar tipografia o graficos para tapar el hueco da un slide mas grande que dice
  // lo mismo, y saca al carrusel de la marca.
  if (r.density && r.density.gap != null && !r.isCTA) {
    const k = H / 1440;
    const warn = 260 * k, stop = 280 * k;
    if (r.density.gap > warn) {
      const msg = `hueco interno de ${r.density.gap}px a la altura y=${r.density.gapAt} ` +
                  `(limite ${Math.round(stop)}px). Sumale contenido a ese espacio o junta los ` +
                  `bloques; no agrandes lo que ya esta.`;
      if (r.density.gap > stop) at(excepted('internal-gap') ? notes : red, msg);
      else notes.push(`slide ${r.slide}: ${msg}`);
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
