// 03-cuaderno-de-taller — CARRUSEL DE EJEMPLO. No es parte del template.
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
  template: '03-cuaderno-de-taller',
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Firma del pie. Sale de aca, no del HTML.
  footerBrand: 'aurelioagency.com',

  // Excepciones de layout DOCUMENTADAS. Las dos de abajo vienen de fabrica en este
  // template y NO se sacan. Decididas por el usuario el 2026-08-25:
  //   'typography-floor' -> la capa de referencia va por debajo de los 40px de
  //      SKILL.md: rotulos de ficha y de pie en mono a 26-28px.
  //   'safe-area' -> el margen del disenio es 80px parejo (5,5% vertical), no el 10%.
  //   'cover-hook-centered' -> la portada alinea a la izquierda contra el margen. El
  //      peso lo da el titular manuscrito a 104px, no la simetria.
  //   'density-budget' -> las bandas de render-and-audit.mjs estan medidas sobre el set
  //      publicado del 01-editorial-oscuro. Este template tiene otro peso visual (papel
  //      claro, margen de 80px parejo, cuatro pasteles planos) y todavia no tiene set
  //      publicado propio para medir. Cuando lo tenga, se miden sus bandas y se declaran
  //      abajo en `densityBudget`, y esta excepcion se saca.
  // Las dos bajan a nota TODOS los avisos de su tipo, asi que hay que leer las notas
  // del reporte: un error real se cuela ahi adentro sin bloquear la entrega.
  layoutExceptions: ['typography-floor', 'safe-area', 'cover-hook-centered', 'density-budget'],

  // Bandas de densidad propias de la marca, copiadas de su preset.md. Si todavia no se
  // midieron para este template, no inventes numeros: usa la excepcion 'density-budget'.
  // densityBudget: { ... },

  slides: [
    // PORTADA. Titular manuscrito + regla de cota + bajada + la comparacion abajo.
    // `h` de cada caja es su altura en px: ver la nota del componente en estilo.md
    // — no es un grafico a escala, el dato va escrito adentro de la caja.
    {
      type: 'cover',
      tab: 'GPT-5.6',
      headline: 'El mismo<br>resultado por<br>25 veces menos',
      ruleWidth: 76,
      lede: 'OpenAI publicó qué cambió al construir agentes con GPT-5.6. Te lo traduzco a decisiones de plata.',
      a: { v: 'US$33,27', h: 300, tone: 'rosa',    cap: 'ANTES · GPT-5.5<br>84,36 % acierto' },
      b: { v: 'US$1,33',  h: 140, tone: 'celeste', cap: 'AHORA · 5.6 Luna<br>84,04 % acierto' },
      source: 'FUENTE: BROWSECOMP · OPENAI 08/2026'
    },

    // DESPIECE. Piezas con etiqueta P-01, nombre manuscrito y descripcion.
    // `ico` es opcional: se copia el INTERIOR del <svg> de lucide.dev o tabler.io/icons
    // (los <path>, sin la etiqueta <svg>). El grosor lo calcula el template solo, con el
    // valor medido para este estilo; no se escribe stroke-width a mano.
    // `img` opcional si el slide lleva una imagen.
    {
      type: 'parts',
      tab: 'DESPIECE',
      headline: 'Las 3 piezas<br>que bajan el costo',
      ruleWidth: 64,
      parts: [
        { tag: 'P-01', tone: 'celeste',  ico: { d: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' }, name: 'Guardar el razonamiento',      desc: 'El agente no vuelve a pensar lo que ya pensó entre paso y paso.' },
        { tag: 'P-02', tone: 'amarillo', ico: { d: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>' }, name: 'Repartir en paralelo',          desc: 'Varios agentes trabajando a la vez, uno que ordena y sintetiza.' },
        { tag: 'P-03', tone: 'gris',     ico: { d: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>' }, name: 'Mover lo repetitivo a código',  desc: 'Filtrar y sumar lo hace un script. El modelo sólo juzga.' }
      ],
      source: 'CONJUNTO: RESPONSES API'
    },

    // ENSAYO. Barras cuyo ancho `w` sale del dato medido, mas una nota manuscrita.
    // Una sola nota por slide: dos le sacan el peso a las dos.
    {
      type: 'bars',
      tab: 'ENSAYO',
      headline: 'Dos ajustes,<br>el triple de<br>rendimiento',
      ruleWidth: 58,
      bars: [
        { lbl: 'HARNESS ESTÁNDAR',                val: '13,3 %', w: 35,  tone: 'gris' },
        { lbl: 'CON RAZONAMIENTO + COMPACTACIÓN', val: '38,3 %', w: 100, tone: 'celeste' }
      ],
      after: 'Mismo modelo. Mismo prompt. Casi <b>3×</b> el resultado usando <b>6× menos</b> tokens de salida.',
      note: 'La mayoría no tiene un problema de modelo. Tiene un problema de configuración.',
      source: 'FUENTE: ARC-AGI-3 · GPT-5.6 SOL'
    },

    // CIERRE. Titular, regla, bajada y los pasos. La firma va grande en el pie.
    {
      type: 'cta',
      tab: 'CIERRE',
      headline: '¿Cuánto estás<br>pagando de más?',
      ruleWidth: 70,
      lede: 'Si tu automatización con IA se armó hace seis meses, está corriendo con la configuración vieja. Se puede medir en una tarde.',
      steps: [
        'Guardá esta ficha',
        'Escribime "COSTO" por mensaje'
      ],
      source: 'AUTOMATIZACIONES CON IA'
    }
  ]
};
