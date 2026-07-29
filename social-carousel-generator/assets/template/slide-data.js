// Plantilla de datos del carrusel. Todo el contenido sale de la fuente; nada inventado.
// `width`/`height` los lee render-and-audit.mjs para fijar el viewport: manteneles el formato.

window.CAROUSEL = {
  slug: 'nombre-del-carrusel',
  platform: 'instagram',        // 'instagram' (1080x1440) | 'tiktok' (1080x1920)
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',

  // Excepciones de layout DOCUMENTADAS. Solo van si el usuario las decidio, y ademas
  // se registran en manifest.json > layout_exceptions con el motivo. Bajan el chequeo
  // correspondiente de red issue a nota informativa. Ids validos:
  //   'cover-hook-centered' | 'vertical-balance' | 'counter-centered' | 'optical-padding'
  // Vacio por defecto: no agregues una excepcion para hacer callar al audit.
  layoutExceptions: [],

  slides: [
    {
      type: 'cover',
      accent: 'ochre',
      kicker: 'FUENTE • TEMA',
      headline: 'SETUP DEL HOOK<br>EN DOS O TRES LINEAS.',
      twist: 'LA LINEA QUE GIRA LA EXPECTATIVA.'
    },
    // ...3 a 6 slides de contenido, una idea por slide...
    {
      type: 'cta',
      accent: 'pink',
      asset: 'assets/la-casa-cta-ig.png'   // el asset del tamano destino, nunca escalado
    }
  ]
};
