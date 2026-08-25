// Biblioteca de figuras de 05-plano-de-taller. 24 formas x 6 tramas = 144
// combinaciones. El catalogo con cuando usar cada una esta en figures.md.
//
// LAS TRES REGLAS QUE HACEN QUE TODO PERTENEZCA A LA MISMA FAMILIA:
//   1. Contorno negro de grosor unico.
//   2. Relleno solo por trama, nunca color plano.
//   3. Cero sombras, cero degradados.
//
// COMPENSACION DE TRAZO: el contorno se dibuja en unidades del propio viewBox, asi
// que al achicar la figura el trazo se afina y la vinieta se ve gris al lado del
// texto. `figure()` calcula el stroke-width para mantener el grosor real constante:
//   stroke-width ≈ 600 / tamanio en px   ->  44px→13 · 80px→7 · 150px→4 · 300px→2

window.FIGURES = (() => {
  // Cada figura es una funcion (fill, bg) que devuelve el interior del SVG.
  // `fill` es la url() de la trama; `bg` es el color del campo, para los huecos.
  const A = {
    'A-01': (f) => `<circle cx="50" cy="50" r="38" fill="${f}"/>`,
    'A-02': (f) => `<rect x="14" y="14" width="72" height="72" fill="${f}"/>`,
    'A-03': (f) => `<path d="M50 12 L88 78 L12 78 Z" fill="${f}"/>`,
    'A-04': (f) => `<path d="M50 12 L88 50 L50 88 L12 50 Z" fill="${f}"/>`,
    'A-05': (f) => `<path d="M31 14 L69 14 L88 50 L69 86 L31 86 L12 50 Z" fill="${f}"/>`,
    'A-06': (f) => `<path d="M30 18 L70 18 L88 82 L12 82 Z" fill="${f}"/>`,
    'A-07': (f) => `<path d="M12 68 A38 38 0 0 1 88 68 Z" fill="${f}"/>`,
    'A-08': (f) => `<path d="M14 24 L86 24 L86 50 L60 50 L60 86 L14 86 Z" fill="${f}"/>`,
    'A-09': (f) => `<path d="M14 14 L66 14 L86 34 L86 86 L14 86 Z" fill="${f}"/>`,
    'A-10': (f) => `<path d="M38 12 L62 12 L62 38 L88 38 L88 62 L62 62 L62 88 L38 88 L38 62 L12 62 L12 38 L38 38 Z" fill="${f}"/>`,
    'A-11': (f) => `<path d="M12 34 L58 34 L58 16 L90 50 L58 84 L58 66 L12 66 Z" fill="${f}"/>`,
    'A-12': (f) => `<circle cx="50" cy="50" r="38" fill="none"/><path d="M50 50 L50 12 A38 38 0 0 1 88 50 Z" fill="${f}"/>`
  };

  const B = {
    'B-01': (f, bg) => `<circle cx="50" cy="50" r="38" fill="${f}"/><circle cx="50" cy="50" r="14" fill="${bg}"/>`,
    'B-02': (f, bg) => `<rect x="14" y="14" width="72" height="72" fill="${f}"/><path d="M50 26 L74 50 L50 74 L26 50 Z" fill="${bg}"/>`,
    'B-03': (f, bg) => `<rect x="14" y="14" width="72" height="72" fill="${f}"/><path d="M38 30 L68 50 L38 70 Z" fill="${bg}"/>`,
    'B-04': (f, bg) => `<circle cx="50" cy="50" r="38" fill="${f}"/><rect x="30" y="30" width="40" height="40" fill="${bg}"/>`,
    'B-05': (f, bg) => `<circle cx="50" cy="50" r="38" fill="none"/><circle cx="50" cy="50" r="25" fill="${f}"/><circle cx="50" cy="50" r="11" fill="${bg}"/>`,
    'B-06': (f) => `<rect x="14" y="14" width="72" height="72" fill="none"/><rect x="14" y="14" width="36" height="72" fill="${f}"/>`,
    'B-07': (f) => `<rect x="14" y="14" width="36" height="36" fill="${f}"/><rect x="50" y="14" width="36" height="36" fill="none"/><rect x="14" y="50" width="36" height="36" fill="none"/><rect x="50" y="50" width="36" height="36" fill="${f}"/>`,
    'B-08': (f, bg) => `<rect x="14" y="14" width="72" height="72" fill="${f}"/><circle cx="32" cy="32" r="7" fill="${bg}"/><circle cx="68" cy="32" r="7" fill="${bg}"/><circle cx="32" cy="68" r="7" fill="${bg}"/><circle cx="68" cy="68" r="7" fill="${bg}"/>`,
    'B-09': (f, bg) => `<rect x="14" y="26" width="72" height="48" fill="${f}"/><rect x="30" y="42" width="40" height="16" rx="8" fill="${bg}"/>`,
    'B-10': (f) => `<circle cx="34" cy="50" r="26" fill="${f}"/><circle cx="72" cy="50" r="16" fill="none"/>`,
    'B-11': (f, bg) => `<path d="M50 12 L88 50 L50 88 L12 50 Z" fill="${f}"/><path d="M50 32 L68 50 L50 68 L32 50 Z" fill="${bg}"/>`,
    'B-12': (f) => `<rect x="14" y="16" width="72" height="20" fill="${f}"/><rect x="14" y="40" width="72" height="20" fill="url(#hr)"/><rect x="14" y="64" width="72" height="20" fill="none"/>`
  };

  const SHAPES = { ...A, ...B };

  // Las seis tramas. El id es el que usa el <defs> del index.html.
  // El relleno DICE QUE ES: no se elige por gusto estetico.
  const TRAMAS = {
    normal:   'hb',   // 45° normal      · el caso base
    invert:   'hr',   // 45° invertida   · la otra pieza
    densa:    'hd',   // densa           · mas carga / mas peso
    cruzada:  'hx',   // cruzada         · bloqueado / no toca
    azul:     'hz',   // azul            · lo bueno / lo nuevo
    naranja:  'hn'    // naranja         · el problema
  };

  // Cuatro tamanios medidos sobre lienzo de 1080. `figure()` los usa para elegir el
  // trazo, pero acepta cualquier px: la formula vale igual.
  const ESCALA = {
    vineta:       { px: 48,  grupo: 'A' },   // al lado de una linea de texto
    item:         { px: 80,  grupo: 'AB' },  // encabeza un bloque de 2-3 lineas
    nodo:         { px: 150, grupo: 'AB' },  // pieza de un flujo con flechas
    protagonista: { px: 320, grupo: 'AB' }   // una sola figura sosteniendo la placa
  };

  // Devuelve el SVG completo. `bg` tiene que ser el color del campo donde se apoya
  // la figura, o los huecos se ven negros.
  function figure(id, px, trama = 'normal', bg = '#edeae3') {
    const shape = SHAPES[id];
    if (!shape) return '';
    const sw = Math.round((600 / px) * 10) / 10;   // compensacion de trazo
    const fill = `url(#${TRAMAS[trama] || 'hb'})`;
    return `<svg viewBox="0 0 100 100" style="width:${px}px;height:${px}px;flex:none"
      stroke="#14171a" stroke-width="${sw}" stroke-linejoin="round" fill="none">${shape(fill, bg)}</svg>`;
  }

  return { SHAPES, TRAMAS, ESCALA, figure };
})();
