// 05-plano-de-taller — CARRUSEL DE EJEMPLO. No es parte del template.
//
// Es el carrusel con el que se armo este estilo. Esta aca por dos motivos, y
// ninguno es servir de molde:
//   1. Ver el estilo renderizado, para decidir si es el que va.
//   2. Fixture de regresion: si tocaste tokens.css, grid.css o styles.css,
//      renderizar esto tiene que dar el mismo PNG que antes.
//
// Para verlo: armate un paquete con el template y pisale el slide-data.js con
// este archivo. Nunca al reves — un carrusel nuevo arranca con slides vacio.
//
// Las placas de abajo NO son la capacidad del estilo ni su cantidad de placas.
// Una pieza se repite tantas veces como haga falta, y una placa que este estilo
// todavia no dibuja se agrega. Ver references/composicion.md.
window.CAROUSEL = {
  slug: 'nombre-del-carrusel',
  template: '05-plano-de-taller',
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Firma del cartucho. Sale de aca, no del HTML.
  footerBrand: 'aurelioagency.com',

  // Excepciones de layout DOCUMENTADAS. Vienen de fabrica en este template y NO se
  // sacan. Decididas por el usuario el 2026-08-25:
  //   'typography-floor' -> la capa de referencia va por debajo de los 40px de
  //      SKILL.md: rotulos del cartucho y de eje en mono a 22-30px.
  //   'safe-area' -> el margen del disenio es 80px parejo (5,5% vertical), no el 10%.
  //   'cover-hook-centered' -> la portada alinea a la izquierda contra el margen.
  //   'density-budget' -> las bandas estan medidas sobre el set publicado del
  //      01-editorial-oscuro. Este template todavia no tiene set propio.
  // Bajan a nota TODOS los avisos de su tipo, asi que hay que leer las notas del
  // reporte: un error real se cuela ahi adentro sin bloquear la entrega.
  layoutExceptions: ['typography-floor', 'safe-area', 'cover-hook-centered', 'density-budget'],

  // densityBudget: { ... },   // cuando se midan las bandas propias del template

  slides: [
    // PORTADA. Titular condensado + regla con la magnitud + bajada + el corte.
    // `h` de cada pieza es su altura en px y sale del dato: una caja mas alta
    // afirma una magnitud. Si la fuente no la publica, no va.
    {
      type: 'cover',
      tab: 'COSTO POR TAREA',
      headline: 'Mismo resultado,<br>25× menos costo',
      ruleWidth: 80,
      ruleLabel: 'FACTOR 25:1',
      lede: 'Nadie calcula una viga para 25 veces la carga real. Con los modelos de IA, casi todos lo hacen.<br><span class="soft">Mismo benchmark, tres meses de diferencia.</span>',
      a: { v: '$33,27', h: 300, tone: 'naranja', cap: 'GPT-5.5 · 84,36 %' },
      b: { v: '$1,33',  h: 120, tone: 'azul',    cap: '5.6 LUNA · 84,04 %' },
      cartucho: [
        { k: 'DATO',   v: 'BROWSECOMP',   flex: 2 },
        { k: 'FUENTE', v: 'OPENAI 08/26', flex: 1 }
      ]
    },

    // NODOS. Tres piezas del sistema, cada una con su figura de la biblioteca,
    // separadas por linea de eje. Las figuras salen de figures.js: id + tamanio +
    // trama. La trama dice que es — azul es "lo bueno / lo nuevo".
    {
      type: 'nodos',
      tab: 'ARQUITECTURA',
      headline: 'Lo que cambia<br>no es el modelo',
      ruleWidth: 62,
      lede: 'Tres intervenciones de diseño, no un modelo más grande.',
      nodos: [
        { fig: { id: 'B-01', px: 120, trama: 'normal' }, k: '01 · MEMORIA',  name: 'No repensar lo pensado',        desc: 'Razonamiento persistente + compactación.' },
        { fig: { id: 'B-02', px: 120, trama: 'normal' }, k: '02 · PARALELO', name: 'Repartir la carga',             desc: 'Subagentes simultáneos, uno sintetiza.' },
        { fig: { id: 'B-03', px: 120, trama: 'azul' },   k: '03 · CÓDIGO',   name: 'Lo repetitivo, fuera del modelo', desc: '−21 % tokens de entrada, misma calidad.' }
      ],
      cartucho: [
        { k: 'TEMA',   v: 'RESPONSES API', flex: 2 },
        { k: 'FUENTE', v: 'OPENAI 08/26',  flex: 1 }
      ]
    },

    // BARRAS RAYADAS + FACTOR. `w` sale del dato medido. El factor es la cifra
    // dominante de la slide; una sola por placa.
    {
      type: 'bars',
      tab: 'RESULTADO MEDIDO',
      headline: 'Dos ajustes,<br>casi 3× el<br>resultado',
      ruleWidth: 56,
      bars: [
        { lbl: 'CONFIGURACIÓN POR DEFECTO', val: '13,3 %', w: 35,  tone: 'naranja' },
        { lbl: 'CON DOS AJUSTES',           val: '38,3 %', w: 100, tone: 'azul' }
      ],
      factor: { n: '6×', t: 'menos tokens de salida<br>para casi el triple de acierto' },
      sellos: [
        { t: 'MISMO MODELO', tone: 'azul' },
        { t: 'SIN REESCRIBIR PROMPT' }
      ],
      cartucho: [
        { k: 'DATO',   v: 'ARC-AGI-3 · 5.6 SOL', flex: 2 },
        { k: 'FUENTE', v: 'OPENAI 08/26',        flex: 1 }
      ]
    },

    // CIERRE. Titular, regla, bajada y el checklist.
    {
      type: 'cta',
      tab: 'CIERRE',
      headline: '¿Cuánto estás<br>pagando<br>de más?',
      ruleWidth: 74,
      lede: 'Si tu automatización con IA se armó hace seis meses, corre con la configuración vieja y paga de más todos los días.',
      checks: [
        'Mapa de costo por paso',
        'Modelo correcto por tarea',
        'Ahorro mensual estimado'
      ],
      cartucho: [
        { k: 'TEMA', v: 'AUDITORÍA DE COSTO EN IA', flex: 2 }
      ]
    }
  ]
};
