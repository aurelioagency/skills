// Datos del carrusel para 06-handmade. Todo el contenido sale de la fuente; nada
// inventado. `width`/`height` los lee render-and-audit.mjs para fijar el viewport:
// manteneles el formato.
//
// Los slides de abajo son el carrusel de ejemplo con el que se armo el template
// (que es una base de datos, explicado simple). Sirven para ver los cinco layouts
// renderizados; se reemplazan enteros al armar un carrusel nuevo.

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
  //      01-editorial-oscuro. Este template deja aire a proposito: la receta dice
  //      textual que el aire vacio no es un problema a resolver, asi que juzgarlo
  //      con las bandas de otro template produce avisos que no significan nada.
  //   'slide-grammar' -> la grilla de la receta no tiene rotulo de encabezado. Sus
  //      cinco zonas fijas son: titulo centrado, subrayado verde, bajada opcional,
  //      contenido y firma. El titular esta y manda la placa; el kicker no existe en
  //      este formato y no se le agrega uno para pasar el chequeo.
  layoutExceptions: ['typography-floor', 'safe-area', 'density-budget', 'slide-grammar'],

  // densityBudget: { ... },   // cuando se midan las bandas propias del template

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
      ]
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
