// Datos del carrusel para 02-editorial-oscuro-v2. Todo el contenido sale de la
// fuente; nada inventado. `width`/`height` los lee render-and-audit.mjs para fijar el
// viewport: manteneles el formato.
//
// Los slides de abajo son el carrusel de ejemplo con el que se armo el template
// (sesgo de posicion en LLMs). Sirven para ver cada layout renderizado; se reemplazan
// enteros al armar un carrusel nuevo.

window.CAROUSEL = {
  slug: 'nombre-del-carrusel',
  template: '02-editorial-oscuro-v2',
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Footer: salen de aca, no del HTML. Cambialos al armar un carrusel de otra marca.
  footerBrand: 'aurelioagency.com',
  footerSwipe: '← Desliza',

  // Excepciones de layout DOCUMENTADAS. Solo van si el usuario las decidio, y ademas
  // se registran en manifest.json > layout_exceptions con el motivo. Bajan el chequeo
  // correspondiente de red issue a nota informativa.
  //
  // Las dos de abajo vienen de fabrica en este template y NO se sacan. Decididas por el
  // usuario el 2026-08-25 al incorporar el disenio:
  //   'typography-floor' -> el disenio usa su capa de referencia por debajo de los 40px
  //      de SKILL.md: eyebrow 26px, footer 30px, contador 24px, chips y tarjetas 38px.
  //      Titulares, bajadas, items de lista y remates SI estan por encima del piso.
  //   'safe-area' -> el footer se apoya a 64px del borde inferior (4,4%), no al 10%.
  //      Es la fila de cierre del disenio, debajo de su regla de 1px.
  //   'cover-hook-centered' -> la portada de este template alinea a la izquierda contra
  //      el margen de 88px, no al centro. El contraste lo dan las dos mitades del
  //      titular (gris/blanco) y el giro en serif, no la simetria.
  // Las tres bajan a nota TODOS los avisos de su tipo, asi que hay que leer las notas del
  // reporte: un error real se cuela ahi adentro sin bloquear la entrega.
  //   'density-budget' -> las bandas de tinta estan medidas sobre el set publicado del
  //      01-editorial-oscuro, cuyo titular de portada es mas chico. La portada de este
  //      template lleva Archivo a 100px y, desde que el titular va entero en blanco
  //      (2026-08-29), una portada de cuatro renglones supera la banda por diseno, no
  //      por estar sobrecargada.
  layoutExceptions: ['typography-floor', 'safe-area', 'cover-hook-centered', 'density-budget'],

  // Bandas de densidad propias de la marca, copiadas de su preset.md. Lo que declares
  // pisa solo esas claves; el resto sale de las de La Casa. Si la marca todavia no las
  // midio, no inventes numeros: usa la excepcion 'density-budget'.
  // densityBudget: {
  //   cover:   { cov: [6.0, 8.5],  covHard: [4.0, 10.5], lines: [8, 16],  blocks: [6, 8] },
  //   content: { cov: [4.0, 11.5], covHard: [3.0, 13.5], lines: [10, 18], blocks: [6, 11] }
  // },

  slides: [
    // PORTADA. El titular va ENTERO EN BLANCO, en dos renglones (headTop y
    // headBottom). La particion gris/blanco se saco el 2026-08-29. El giro, en
    // serif italica y caja de oracion.
    // `weights` son las nueve celdas de la tira, de 0 a 1: dibujan la forma del dato.
    {
      type: 'cover',
      accent: 'dorado',
      glow: 'tl',
      eyebrow: 'CÓMO LEE UN LLM',
      headTop: 'MÁS<br>CONTEXTO',
      headBottom: 'NO ES MÁS<br>PRECISIÓN.',
      twist: 'A veces es exactamente lo contrario.',
      stripLabel: 'DÓNDE MIRA, DE PRINCIPIO A FIN',
      weights: [1, 0.72, 0.22, 0.09, 0.06, 0.09, 0.22, 0.72, 1],
      axis: ['INICIO', 'MEDIO', 'FINAL']
    },

    // FILAS CON ETIQUETA. Tres items cortos con label mono. `aside` es opcional: la
    // ruta de una imagen dentro de assets/ del paquete.
    {
      type: 'rows',
      accent: 'coral',
      glow: 'tr',
      eyebrow: 'EL SÍNTOMA',
      headline: 'Lee el principio<br>y el final.',
      lede: 'Les da más peso al arranque y al cierre de un documento. El medio pesa menos.',
      rows: [
        { lbl: 'CHATBOTS', t: 'conversaciones largas' },
        { lbl: 'BÚSQUEDA', t: 'ranking de resultados' },
        { lbl: 'CÓDIGO',   t: 'partes del programa' }
      ]
      // aside: 'assets/tiburon-leyendo.png'
    },

    // DOCUMENTOS. `hit` es el renglon marcado (0-8); `miss: true` lo pinta como fallo.
    {
      type: 'docs',
      accent: 'verde',
      glow: 'tc',
      eyebrow: 'EL EJEMPLO',
      headline: 'Buscás una frase<br>en un texto largo.',
      lede: 'La encuentra si está en las primeras o en las últimas páginas. En el medio, se le escapa.',
      docs: [
        { hit: 1, cap: 'LA ENCUENTRA' },
        { hit: 4, cap: 'SE LE ESCAPA', miss: true },
        { hit: 7, cap: 'LA ENCUENTRA' }
      ],
      close: 'El mismo documento. Distinto resultado.'
    },

    // GRAFICO. `path` es la curva en un viewBox de 904x380. `id` tiene que ser unico
    // en el carrusel: es lo que nombra el degradado del area.
    {
      type: 'chart',
      accent: 'verde',
      glow: 'bl',
      id: 'u',
      eyebrow: 'LA EVIDENCIA · MIT 2025',
      headline: 'Lost in<br>the middle.',
      lede: 'Movieron la respuesta correcta por todo el texto. La precisión dibujó una U.',
      chartLabel: 'QUÉ TAN SEGUIDO ENCUENTRA EL DATO',
      path: 'M24,40 C240,60 300,300 452,300 C604,300 664,110 880,80',
      dots: [
        { x: 24,  y: 40 },
        { x: 452, y: 300, r: 16, accent: 'coral' },
        { x: 880, y: 80 }
      ],
      axis: ['INICIO', 'MEDIO', 'FINAL'],
      // El cierre lleva <br> manual cuando no entra en una linea: partirlo a mano evita
      // la viuda que deja el wrap automatico. Nunca se baja el tamanio para que entre.
      close: 'Mejor al inicio. Peor en el medio.<br>Repunta al final.'
    },

    // CHIPS. `diagram` acepta un SVG suelto arriba de los chips.
    // Estados de chip: '' (neutro) | 'active' | 'off'.
    {
      type: 'steps',
      accent: 'coral',
      glow: 'tl',
      eyebrow: 'LA CAUSA',
      headline: 'La máscara<br>causal.',
      lede: 'Cada palabra solo puede mirar a las anteriores: lo que viene después le queda tapado. Eso lo inclina al inicio aunque los datos no lo pidan.',
      chipsLabel: 'SOLO PUEDE MIRAR HACIA ATRÁS',
      diagram: `<svg viewBox="0 0 904 96" style="width:100%;height:96px;display:block">
        <defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M8,0 L0,4 L8,8 Z" fill="#e0714a"></path></marker></defs>
        <path d="M600,86 C520,10 200,10 96,80" fill="none" stroke="#e0714a" stroke-width="4" marker-end="url(#ah)" opacity="0.9"></path>
        <path d="M600,86 C540,26 340,22 250,80" fill="none" stroke="#e0714a" stroke-width="4" marker-end="url(#ah)" opacity="0.7"></path>
        <path d="M600,86 C560,40 470,36 404,80" fill="none" stroke="#e0714a" stroke-width="4" marker-end="url(#ah)" opacity="0.5"></path>
      </svg>`,
      chips: [
        { t: 'El' }, { t: 'dato' }, { t: 'que' }, { t: 'buscás' },
        { t: 'está', state: 'active' }, { t: 'acá', state: 'off' }
      ],
      close: 'En búsqueda y ranking,<br>ese sesgo hace daño.'
    },

    // BARRAS POR CAPA. `reach` (0-1) es hasta donde llega el degradado; `tail` es la
    // opacidad con la que termina.
    {
      type: 'layers',
      accent: 'dorado',
      glow: 'tr',
      eyebrow: 'LA CAUSA',
      headline: 'Más capas,<br>más sesgo.',
      lede: 'El modelo relee el texto capa por capa, y cada pasada hereda lo que la anterior ya priorizó.',
      layersLabel: 'DÓNDE MIRA EL LLM, CAPA POR CAPA',
      layers: [
        { lbl: 'CAPA 1', reach: 1.00, tail: 0.55 },
        { lbl: 'CAPA 2', reach: 0.70, tail: 0.10 },
        { lbl: 'CAPA 3', reach: 0.42, tail: 0.06 },
        { lbl: 'CAPA 4', reach: 0.22, tail: 0.04 }
      ],
      axis: ['INICIO DEL CONTEXTO', 'FINAL'],
      close: 'Modelo más grande, medio más ignorado.'
    },

    // LISTA NUMERADA, 3 a 5 items. Cada item entra en una linea a 44px (~40 caracteres).
    {
      type: 'list',
      accent: 'verde',
      glow: 'br',
      eyebrow: 'CÓMO SE CORRIGE',
      headline: 'Cuatro<br>palancas.',
      lede: 'Lo que se toca del lado del modelo, no del prompt.',
      items: [
        'Cambiar qué puede mirar cada palabra',
        'Atar cada palabra a sus vecinas más cercanas',
        'Usar menos capas',
        'Ajustar los datos si vienen sesgados'
      ],
      close: 'Ninguna la controlás vos desde el chat.'
    },

    // TARJETAS + REMATE. `tone: 'coral'` marca la tarjeta que es el caso malo.
    // En `punch`, <span class="hl"> resalta la parte que cierra el argumento.
    {
      type: 'cards',
      accent: 'coral',
      glow: 'tl',
      eyebrow: 'QUÉ HACER MIENTRAS TANTO',
      headline: 'El orden<br>no es neutro.',
      // `cards` va con bajada: sin ella la placa queda corta y el sobrante se junta
      // entre las tarjetas y el remate (328px medidos). Ver estilo.md.
      lede: 'Lo único que controlás vos es en qué parte del texto va cada cosa.',
      cards: [
        { lbl: 'PRIMERO',    t: 'lo que importa' },
        { lbl: 'EN EL MEDIO', t: 'relleno, nunca el dato', tone: 'coral' },
        { lbl: 'ÚLTIMO',     t: 'la pregunta concreta' }
      ],
      punch: 'No es tu prompt.<br><span class="hl">Es dónde pusiste el dato.</span>'
      // aside: 'assets/tiburon-senalando.png'
    },

    // CIERRE. Slide HTML de este template, no un PNG fijo: una variante ("Comentá X
    // y te lo mando por DM") es un cambio de datos, no un asset nuevo.
    {
      type: 'cta',
      accent: 'dorado',
      glow: 'mid',
      signature: 'LA CASA DE AURELIO',
      headline: 'Guardá este post',
      sub: 'y seguime para más.'
      // SIN link de comunidad: decidido por el usuario el 2026-08-29. La placa de cierre
      // lleva firma, titular, subtitulo, filete y el sitio, y nada mas. El link de Skool
      // vive en el caption, no en la imagen.
    }
  ]
};
