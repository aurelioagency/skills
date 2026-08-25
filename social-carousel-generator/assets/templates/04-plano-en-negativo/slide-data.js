// Datos del carrusel para 04-plano-en-negativo. Todo el contenido sale de la fuente;
// nada inventado. `width`/`height` los lee render-and-audit.mjs para fijar el viewport:
// manteneles el formato.
//
// Los slides de abajo son el carrusel de ejemplo con el que se armo el template
// (costo por tarea con GPT-5.6). Sirven para ver cada layout renderizado; se reemplazan
// enteros al armar un carrusel nuevo.

window.CAROUSEL = {
  slug: 'nombre-del-carrusel',
  template: '04-plano-en-negativo',
  width: 1080,
  height: 1440,
  brand: 'La Casa de Aurelio',
  // Firma del pie. Sale de aca, no del HTML.
  footerBrand: 'aurelioagency.com',

  // Excepciones de layout DOCUMENTADAS. Vienen de fabrica en este template y NO se
  // sacan. Decididas por el usuario el 2026-08-25:
  //   'typography-floor' -> la capa de referencia va por debajo de los 40px de
  //      SKILL.md: rotulos de encabezado y de pie en mono a 26-28px.
  //   'safe-area' -> el margen del disenio es 80px parejo (5,5% vertical), no el 10%.
  //   'cover-hook-centered' -> la portada alinea a la izquierda contra el margen. El
  //      peso lo da el titular de 112px a peso 700, no la simetria.
  //   'density-budget' -> las bandas estan medidas sobre el set publicado del
  //      01-editorial-oscuro. Este template todavia no tiene set propio. Cuando lo
  //      tenga, se miden sus bandas, se declaran en `densityBudget` y esta sale.
  // Bajan a nota TODOS los avisos de su tipo, asi que hay que leer las notas del
  // reporte: un error real se cuela ahi adentro sin bloquear la entrega.
  layoutExceptions: ['typography-floor', 'safe-area', 'cover-hook-centered', 'density-budget'],

  // densityBudget: { ... },   // cuando se midan las bandas propias del template

  slides: [
    // PORTADA. Titular de 112px + filete + bajada + las dos cifras con sus chips.
    // El primer chip lleva el acento y los demas quedan apagados: el contraste es
    // lo que hace legible cual es el titular del resultado.
    {
      type: 'cover',
      tab: 'BENCHMARK',
      state: { t: 'VERIFICADO', tone: 'teal' },
      headline: 'Tu agente<br>cuesta 25×<br>más de lo<br>necesario',
      lede: 'Mismo benchmark, misma precisión, tres meses de diferencia.',
      a: { lbl: 'GPT-5.5 · 84,36 %',  v: '$33,27', tone: 'amber' },
      b: { lbl: '5.6 LUNA · 84,04 %', v: '$1,33',  tone: 'teal' },
      chips: [
        { t: '−96 % COSTO', tone: 'teal' },
        { t: '−0,32 pts PRECISIÓN' }
      ],
      source: 'BROWSECOMP · OPENAI 08/2026'
    },

    // FICHAS APILADAS. Tres es el numero que entra sin apretar. Cada una lleva su
    // acento; el orden de los acentos no es decorativo, sigue la funcion.
    {
      type: 'stack',
      tab: 'ARQUITECTURA',
      tabRight: '3 CONTROLES',
      headline: 'Lo que cambia<br>no es el modelo',
      stack: [
        { lbl: '01 · RAZONAMIENTO PERSISTENTE', t: 'No reconstruye contexto en cada turno.',                    tone: 'teal' },
        { lbl: '02 · MULTI-AGENTE NATIVO',      t: 'Subagentes en paralelo, uno sintetiza.',                    tone: 'blue' },
        { lbl: '03 · TOOL CALLING PROGRAMÁTICO', t: 'Filtrar y agregar sale del contexto: −21 % tokens de entrada.', tone: 'amber' }
      ],
      source: 'RESPONSES API · GPT-5.6'
    },

    // BARRAS VERTICALES. `h` es el porcentaje del alto y sale del dato medido; las
    // dos comparten linea de base, que es lo que las hace comparables.
    {
      type: 'bars',
      tab: 'ENSAYO',
      state: { t: 'MISMO MODELO', tone: 'amber' },
      headline: 'Dos settings.<br>Casi 3× el<br>resultado.',
      vbars: [
        { val: '13,3 %', h: 35 },
        { val: '38,3 %', h: 100, on: true }
      ],
      after: 'ARC-AGI-3, GPT-5.6 Sol. Al activar razonamiento retenido y compactación: mismo modelo, <b style="color:var(--ink)">6× menos tokens</b> de salida.',
      punch: 'Casi nadie está midiendo esto. Ahí está tu margen.',
      punchTone: '',
      source: 'ARC-AGI-3 · HARNESS INVESTIGATION'
    },

    // CIERRE. Titular, filete, bajada y el checklist. La firma va grande en el pie.
    {
      type: 'cta',
      tab: 'AUDITORÍA',
      state: { t: 'CUPOS ABIERTOS', tone: 'teal' },
      headline: 'Auditoría de<br>costo en IA',
      lede: 'Reviso tu flujo actual, mido tokens y latencia por paso, y te digo dónde se va la plata. Con números, no con opiniones.',
      checks: [
        'Mapa de costo por paso',
        'Modelo correcto por tarea',
        'Estimación de ahorro mensual'
      ],
      source: 'ESCRIBIME "COSTO"'
    }
  ]
};
