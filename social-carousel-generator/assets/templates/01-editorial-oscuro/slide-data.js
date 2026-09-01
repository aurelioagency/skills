// 01-editorial-oscuro — DATOS DEL CARRUSEL. Arranca sin placas, a proposito.
//
// `slides` esta vacio porque las placas de este carrusel todavia no existen: se
// componen a partir del contenido. Cuantas hay lo decide el material y lo
// confirma el usuario; que recurso visual lleva cada una sale de
// references/composicion.md; como se dibuja ese recurso, del estilo.md de este
// template.
//
// El carrusel con el que se armo el estilo esta en ejemplos/01-editorial-oscuro/.
// No se copia aca. Rellenar sus campos es lo que produce carruseles todos
// iguales con las palabras cambiadas.
//
//
// Cada placa de contenido lleva dos campos de fidelidad, y son obligatorios:
//   srcFrase: 'la frase textual de la Lectura de la que se recorto el titular'
//   srcDato:  'la cita textual de la fuente, por cada cifra que se muestra o se dibuja'
// Sin srcFrase el titular es invencion y audit-serie.mjs lo bloquea. Sin srcDato no se
// dibuja barra, altura, area, proporcion ni escala: ver references/fidelidad.md.
// `width`/`height` los lee render-and-audit.mjs para fijar el viewport:
// manteneles el formato.
window.CAROUSEL = {
  slug: 'nombre-del-carrusel',
  platform: 'instagram',        // 'instagram' (1080x1440) | 'tiktok' (1080x1920)
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Footer: salen de aca, no del HTML. Cambialos al armar un carrusel de otra marca.
  footerBrand: 'aurelioagency.com',
  footerSwipe: '← Desliza',

  // Excepciones de layout DOCUMENTADAS. Solo van si el usuario las decidio, y ademas
  // se registran en manifest.json > layout_exceptions con el motivo. Bajan el chequeo
  // correspondiente de red issue a nota informativa. Ids validos:
  //   'cover-hook-centered' | 'vertical-balance' | 'counter-centered' | 'optical-padding'
  //   | 'slide-grammar'    <- solo si un slide de contenido va sin kicker o sin titular
  //   | 'density-budget'   <- el que suele necesitar una marca que no sea La Casa:
  //                           las bandas de densidad estan medidas sobre el set de La Casa
  // Vacio por defecto: no agregues una excepcion para hacer callar al audit.
  layoutExceptions: [],

  // Bandas de densidad propias de la marca, copiadas de su preset.md. Lo que declares
  // pisa solo esas claves; el resto sale de las de La Casa. Si la marca todavia no las
  // midio, no inventes numeros: usa la excepcion 'density-budget' de arriba.
  // densityBudget: {
  //   cover:   { cov: [6.0, 8.5],  covHard: [4.0, 10.5], lines: [8, 16],  blocks: [6, 8] },
  //   content: { cov: [4.0, 11.5], covHard: [3.0, 13.5], lines: [10, 18], blocks: [6, 11] }
  // },

  slides: [],
};
