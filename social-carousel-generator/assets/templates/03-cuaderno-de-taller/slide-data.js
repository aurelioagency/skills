// 03-cuaderno-de-taller — DATOS DEL CARRUSEL. Arranca sin placas, a proposito.
//
// `slides` esta vacio porque las placas de este carrusel todavia no existen: se
// componen a partir del contenido. Cuantas hay lo decide el material y lo
// confirma el usuario; que recurso visual lleva cada una sale de
// references/composicion.md; como se dibuja ese recurso, del estilo.md de este
// template.
//
// El carrusel con el que se armo el estilo esta en ejemplos/03-cuaderno-de-taller/.
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

  slides: [],
};
