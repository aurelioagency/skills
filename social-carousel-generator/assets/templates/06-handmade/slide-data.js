// 06-handmade — DATOS DEL CARRUSEL. Arranca sin placas, a proposito.
//
// `slides` esta vacio porque las placas de este carrusel todavia no existen: se
// componen a partir del contenido. Cuantas hay lo decide el material y lo
// confirma el usuario; que recurso visual lleva cada una sale de
// references/composicion.md; como se dibuja ese recurso, del estilo.md de este
// template.
//
// El carrusel con el que se armo el estilo esta en ejemplos/06-handmade/.
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

  slides: [],
};
