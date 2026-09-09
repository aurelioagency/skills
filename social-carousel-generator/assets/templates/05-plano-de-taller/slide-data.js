// 05-plano-de-taller — DATOS DEL CARRUSEL. Arranca sin placas, a proposito.
//
// `slides` esta vacio porque las placas de este carrusel todavia no existen: se
// componen a partir del contenido. Cuantas hay lo decide el material y lo
// confirma el usuario; que recurso visual lleva cada una sale de
// references/composicion.md; como se dibuja ese recurso, del estilo.md de este
// template.
//
// El carrusel con el que se armo el estilo esta en ejemplos/05-plano-de-taller/.
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
  template: '05-plano-de-taller',
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Firma del cartucho. Sale de aca, no del HTML.
  footerBrand: 'aurelioagency.com',
  // Quien firma el dibujo (celda "DIBUJO" del cartucho). Valor por defecto de La Casa:
  // NO se pregunta carrusel a carrusel. Otra marca lo pisa desde su preset.
  footerAuthor: '@ing.gustavopaz',

  // Excepciones de layout DOCUMENTADAS. Vienen de fabrica en este template y NO se
  // sacan. Decididas por el usuario el 2026-08-25:
  //   'typography-floor' -> la capa de referencia va por debajo de los 40px de
  //      SKILL.md: rotulos del cartucho y de eje en mono a 22-30px.
  //   'safe-area' -> el margen del disenio es 80px parejo (5,5% vertical), no el 10%.
  //   'density-budget' -> las bandas estan medidas sobre el set publicado del
  //      01-editorial-oscuro. Este template todavia no tiene set propio.
  // Bajan a nota TODOS los avisos de su tipo, asi que hay que leer las notas del
  // reporte: un error real se cuela ahi adentro sin bloquear la entrega.
  //
  // 'cover-hook-centered' NO va de fabrica: la portada del 05 es centrada por
  // default (ver estilo.md > La portada, 2026-09-05). Queda disponible como
  // opcion para un carrusel puntual que quiera la portada alineada a la
  // izquierda contra el margen — se agrega a esta lista solo si el usuario lo
  // decide. Decidido por el usuario el 2026-09-05.
  layoutExceptions: ['typography-floor', 'safe-area', 'density-budget'],

  // densityBudget: { ... },   // cuando se midan las bandas propias del template

  slides: [],
};
