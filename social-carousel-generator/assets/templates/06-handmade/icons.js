// Set de iconos de 06-handmade. Iconos de linea con relleno pastel plano.
//
// LAS TRES REGLAS QUE HACEN QUE TODO CONVIVA:
//   1. Contorno negro de grosor parejo.
//   2. Relleno plano de un solo pastel, nunca degradado.
//   3. Cero sombras.
//
// Esto es geometria, no ilustracion. Lo que este set NO da: escenas con personajes,
// objetos en perspectiva, texturas de lapiz, el temblor de trazo humano. Si el
// carrusel lo necesita, va un set encargado — y entonces se usa ese set y solo ese,
// porque mezclar estilos de ilustracion adentro de un carrusel se nota.
//
// El grosor se compensa por tamanio, igual que en 05-plano-de-taller: el contorno se
// dibuja en unidades del viewBox, asi que al achicar el icono el trazo se afina.

window.ICONS = (() => {
  // Cada icono es (fill) => interior del SVG. `fill` es el pastel.
  const SHAPES = {
    buscar:    (f) => `<circle cx="44" cy="42" r="26" fill="${f}"/><line x1="63" y1="61" x2="84" y2="82"/>`,
    documento: (f) => `<rect x="22" y="16" width="56" height="68" rx="9" fill="${f}"/><line x1="36" y1="38" x2="64" y2="38"/><line x1="36" y1="52" x2="64" y2="52"/><line x1="36" y1="66" x2="54" y2="66"/>`,
    crear:     (f) => `<rect x="22" y="16" width="56" height="68" rx="9" fill="${f}"/><line x1="50" y1="38" x2="50" y2="62"/><line x1="38" y1="50" x2="62" y2="50"/>`,
    sobre:     (f) => `<rect x="14" y="26" width="72" height="50" rx="8" fill="${f}"/><polyline points="14,30 50,58 86,30"/>`,
    ok:        (f) => `<circle cx="50" cy="50" r="30" fill="${f}"/><polyline points="37,51 47,61 65,41"/>`,
    alerta:    (f) => `<path d="M50 18 L84 78 L16 78 Z" fill="${f}"/><line x1="50" y1="42" x2="50" y2="58"/><line x1="50" y1="67" x2="50" y2="68"/>`,
    borrar:    (f) => `<path d="M26 34 L74 34 L68 82 L32 82 Z" fill="${f}"/><line x1="18" y1="34" x2="82" y2="34"/><line x1="40" y1="22" x2="60" y2="22"/><line x1="44" y1="48" x2="44" y2="70"/><line x1="56" y1="48" x2="56" y2="70"/>`,
    escudo:    (f) => `<path d="M50 20 L78 30 V52 C78 68 66 78 50 84 C34 78 22 68 22 52 V30 Z" fill="${f}"/><polyline points="39,50 47,58 63,42"/>`,
    objetivo:  (f, bg) => `<circle cx="50" cy="50" r="26" fill="${f}"/><circle cx="50" cy="50" r="9" fill="${bg}"/><line x1="50" y1="14" x2="50" y2="26"/><line x1="50" y1="74" x2="50" y2="86"/><line x1="14" y1="50" x2="26" y2="50"/><line x1="74" y1="50" x2="86" y2="50"/>`,
    editar:    (f) => `<path d="M24 76 L30 56 L66 20 L80 34 L44 70 Z" fill="${f}"/><line x1="66" y1="20" x2="80" y2="34"/>`
  };

  const PASTEL = {
    verde:    '#c9dcc4',
    celeste:  '#c3d8ea',
    lila:     '#d5cce8',
    coral:    '#f5b5ab',
    amarillo: '#fae0a6'
  };

  // Devuelve el SVG completo. `bg` es el color del papel, para los huecos.
  function icon(name, px = 104, pastel = 'verde', bg = '#fcefe3') {
    const shape = SHAPES[name];
    if (!shape) return '';
    const sw = Math.max(4, Math.round((520 / px) * 10) / 10);   // compensacion de trazo
    return `<svg viewBox="0 0 100 100" style="width:${px}px;height:${px}px;flex:none"
      fill="none" stroke="#1b1a18" stroke-width="${sw}" stroke-linecap="round"
      stroke-linejoin="round">${shape(PASTEL[pastel] || PASTEL.verde, bg)}</svg>`;
  }

  return { SHAPES, PASTEL, icon };
})();
