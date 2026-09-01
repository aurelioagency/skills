// 02-editorial-oscuro-v2 — DATOS DEL CARRUSEL. Arranca sin placas, a proposito.
//
// `slides` esta vacio porque las placas de este carrusel todavia no existen: se
// componen a partir del contenido. Cuantas hay lo decide el material y lo
// confirma el usuario; que recurso visual lleva cada una sale de
// references/composicion.md; como se dibuja ese recurso, del estilo.md de este
// template.
//
// El carrusel con el que se armo el estilo esta en ejemplos/02-editorial-oscuro-v2/.
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

  slides: [],
};
