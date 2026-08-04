// Plantilla de datos del carrusel. Todo el contenido sale de la fuente; nada inventado.
// `width`/`height` los lee render-and-audit.mjs para fijar el viewport: manteneles el formato.

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

  slides: [
    {
      type: 'cover',
      accent: 'ochre',
      kicker: 'FUENTE • TEMA',
      headline: 'SETUP DEL HOOK<br>EN DOS O TRES LINEAS.',
      // El giro va en serif italica y en caja de oracion: otra fuente y otro color
      // que el titular. Ver .s-cover .twist en styles.css.
      twist: 'La linea que gira la expectativa.',
      // Grafico de portada (patron por defecto: un nodo que se abre hacia destinos).
      hub: 'NODO',
      nets: ['Destino', 'Destino', 'Destino', '+N mas']
    },
    // ...3 a 6 slides de contenido, una idea por slide...
    {
      type: 'cta',
      accent: 'pink',
      // El asset del tamano destino, nunca escalado. Dos variantes por tamano:
      //   la-casa-cta-ig.png          -> "Guarda este post / y sigueme para mas"
      //   la-casa-cta-ig-aurelio.png  -> "Comenta AURELIO / y te enviamos la skill por DM"
      // (para TikTok: la-casa-cta.png y la-casa-cta-aurelio.png)
      asset: 'assets/la-casa-cta-ig.png'
    }
  ]
};
