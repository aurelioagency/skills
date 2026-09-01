// 06-handmade — CARRUSEL DE EJEMPLO. No es parte del template.
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
  template: '06-handmade',
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Firma. Va en la misma esquina en TODAS las placas. Sale de aca, no del HTML.
  footerBrand: 'aurelioagency.com',

  // Excepciones de layout DOCUMENTADAS. Vienen de fabrica en este template y NO se
  // sacan. Decididas por el usuario el 2026-08-25:
  //   'typography-floor' -> la receta declara su propio piso, "nada por debajo de
  //      38px", mas bajo que los 40px de SKILL.md; los chips mono quedan en 38.
  //   'safe-area' -> el margen de la receta es 88px a los lados y 96px arriba y
  //      abajo (6,7% vertical), no el 10%.
  //   'cover-hook-centered' -> no hace falta: la portada de este template ya esta
  //      centrada. Es el unico de la familia que cumple ese chequeo de fabrica.
  //   'density-budget' -> las bandas estan medidas sobre el set publicado del
  //      01-editorial-oscuro, que tiene otro peso visual. Este template todavia no
  //      tiene set propio para medir las suyas. NO es permiso para dejar agujeros:
  //      el hueco interno se chequea igual que en los otros cinco.
  //   'slide-grammar' -> la grilla de la receta no tiene rotulo de encabezado. Sus
  //      cinco zonas fijas son: titulo centrado, subrayado verde, bajada opcional,
  //      contenido y firma. El titular esta y manda la placa; el kicker no existe en
  //      este formato y no se le agrega uno para pasar el chequeo.
  layoutExceptions: ['typography-floor', 'safe-area', 'density-budget', 'slide-grammar'],

  // densityBudget: { ... },   // cuando se midan las bandas propias del template

  // Fixture, no carrusel nuevo: las placas de abajo no llevan srcFrase/srcDato

  // porque no salieron de una Lectura. audit-serie.mjs no las juzga por eso.

  seriesExceptions: ['trazabilidad'],

  slides: [
    // 01 · PORTADA — la pregunta que el otro no se atreve a hacer, mas la escena.
    // Los iconos salen de icons.js: nombre + tamanio + pastel.
    {
      type: 'cover',
      titulo: '¿Qué es una<br>base de datos?',
      subWidth: 62,
      bajada: 'Pensala como una biblioteca: todo guardado con un orden para poder encontrarlo.',
      escena: [
        { name: 'documento', px: 200, pastel: 'celeste' },
        { name: 'buscar',    px: 200, pastel: 'verde' },
        { name: 'ok',        px: 200, pastel: 'lila' }
      ],
      // Nombra lo que muestran los iconos. Sin esto la portada deja un agujero
      // entre la bajada y la escena — lo marca el chequeo de hueco interno.
      pieEscena: 'Guardar · encontrar · confirmar'
    },

    // 02 · LISTA ETIQUETADA — icono + termino resaltado + definicion.
    // UN PASTEL = UN CONCEPTO. Si "Tabla" es verde aca, es verde en todo el carrusel.
    {
      type: 'lista',
      titulo: 'La analogía,<br>pieza por pieza',
      subWidth: 58,
      lista: [
        { ico: { name: 'documento', px: 96, pastel: 'verde' },   pastel: 'verde',   k: 'Tabla', t: '= un estante' },
        { ico: { name: 'crear',     px: 96, pastel: 'celeste' }, pastel: 'celeste', k: 'Fila',  t: '= un libro' },
        { ico: { name: 'buscar',    px: 96, pastel: 'lila' },    pastel: 'lila',    k: 'Campo', t: '= un dato del libro' }
      ]
    },

    // 03 · ANTES -> DESPUES — dos cajas irregulares y una flecha.
    {
      type: 'antes',
      titulo: 'Buscar sin orden<br>y buscar con orden',
      subWidth: 66,
      bajada: 'Es la misma biblioteca. Cambia cuánto tardás en encontrar el libro.',
      a: { k: 'SIN ORDEN', t: 'Revisás todos los libros hasta dar con el que buscabas.' },
      b: { k: 'CON ORDEN',  t: 'Vas directo al estante, y ahí al libro.' }
    },

    // 04 · SEMAFORO — estado + valor + consecuencia. El color del estado no es
    // decorativo: verde bien, amarillo atencion, coral mal.
    {
      type: 'semaforo',
      titulo: 'Cómo sabés<br>que anda bien',
      subWidth: 56,
      semaforo: [
        { pastel: 'verde',    k: 'RÁPIDA', t: 'responde antes de que lo notes' },
        { pastel: 'amarillo', k: 'LENTA',  t: 'falta un índice en la tabla' },
        { pastel: 'coral',    k: 'CAÍDA',  t: 'nadie puede leer ni escribir' }
      ]
    },

    // 05 · CIERRE — pedido de guardado + firma grande.
    {
      type: 'cta',
      titulo: '¿Guardaste esto?',
      subWidth: 52,
      bajada: 'Volvé la próxima vez que alguien te hable de <span class="hl verde">tablas</span> y no entiendas nada.',
      // Corte de linea manual: el wrap automatico dejaba "explicados simple" como
      // viuda. Se parte a mano, nunca se baja el cuerpo para que entre.
      cierre: 'Seguime para más temas<br><span class="uline lila">explicados simple</span>'
    }
  ]
};
