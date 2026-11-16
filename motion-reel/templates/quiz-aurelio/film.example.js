// futbol-mcp v3: DATA for the quiz template v3 (film/quiz.js, master copy in E:\Motion Reel\Plantilla-quiz\), Aurelio style.
// Plan: docs/overlay_plan.md. Joined video recut (pipeline.json) so no pause is longer than ~0.3 s except the two
// thinking pauses. Face windows measured with gaze.py on the new join: face 0-2.62, 4.00-6.08, 20.62-23.96, 42.42-end;
// everything else is his voice over real clips and graphics.
(() => {
  const I = '../assets/img/', V = '../assets/clips/', B = '../assets/brand/aurelio/';
  const clip = (name, at, to, extra = {}) => ({ kind: 'clip', src: V + name + '.mp4', at, to, fps: extra.fps || 30, ...extra });
  const lights = (at, to) => ({ kind: 'lights', at, to });
  const scrim = (at, to) => ({ kind: 'plate', at, to, css: 'linear-gradient(180deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,.18) 34%, rgba(0,0,0,0) 50%, rgba(0,0,0,.25) 70%, rgba(0,0,0,.65) 100%)' });
  const framed = (name, at, to, box, extra = {}) => clip(name, at, to, { box, frame: true, radius: extra.radius ?? 26, ...extra });
  const SERIF_LINE = (s, px, extra = '') => `<div style="font:500 ${px}px/1 AuSerif,Georgia,serif;${extra}">${s}</div>`;
  const year = (txt, at, x) => ({ html: txt, at, out: 19.64, x, y: 1170, size: 46, star: false, center: false, sfx: 'click' });

  const DATA = {
    source: { src: '../assets/source/futbol-mcp-edit.mp4', fps: 24.0 },
    layout: [[0, 'full'], [2.62, 'gone'], [4.0, 'full'], [6.08, 'gone'], [20.62, 'full'], [23.96, 'gone'], [42.42, 'full']],
    punch: [[1.14, 1.0], [1.72, 1.08], [4.0, 1.14], [5.0, 1.0], [5.42, 1.06, 'snap'],
      [20.62, 1.04], [21.48, 1.12], [22.62, 1.2, 'snap'], [42.42, 1.0], [42.62, 1.1], [43.28, 1.16, 'snap'], [43.84, 1.0, 'snap']],
    whips: [2.62, 4.0, 6.08, 12.36, 19.66, 20.62, 23.96, 31.9, 42.42],
    shakes: [[12.98, 22], [14.3, 14], [15.55, 16], [16.68, 12], [18.52, 10]],

    stage: [
      // POV gag (Veamos)
      lights(2.62, 4.0),
      clip('m-pov', 2.62, 4.0, { box: { x: 0, y: 620, w: 1080, h: 608 }, push: [1.0, 1.06] }),
      // question 1: the stadium, blurred and dark
      clip('bg-a3', 6.08, 12.36, { push: [1.0, 1.08], css: 'filter:brightness(.55)' }),
      // answer: real FIFA clips, a hard cut every 0.4-1.2 s, slow motion on the goals, freeze frame on "3"
      clip('f0-2018-cara', 12.36, 12.64, { push: [1.1, 1.2] }),
      clip('f1-festejo', 12.64, 12.96, { push: [1.05, 1.15] }),
      clip('f2-gol-red', 12.96, 13.82, { fps: 60, push: [1.0, 1.12], punches: [[13.0, 1.07]] }),
      clip('f3n-remate', 13.82, 14.18, { push: [1.08, 1.16] }),
      clip('f7-2018-red', 14.18, 14.98, { fps: 60, push: [1.0, 1.1], punches: [[14.3, 1.06]] }),
      clip('f8-2022-espalda', 14.98, 15.36, { push: [1.05, 1.12] }),
      clip('f9-2022-gol', 15.36, 15.82, { push: [1.0, 1.08], punches: [[15.55, 1.06]] }),
      clip('f4n-festejo', 15.82, 16.28, { push: [1.04, 1.12] }),
      clip('f5n-brazos', 16.28, 17.52, { fps: 60, push: [1.0, 1.05], punches: [[16.68, 1.14]] }),
      clip('f6b-2018-grito', 17.52, 19.66, { fps: 60, freeze: 18.52, push: [1.0, 1.1], punches: [[18.52, 1.08]] }),
      scrim(12.36, 19.66),
      // "Ahora vamos con..." (he glances away on these words: the face comes back on "inteligencia")
      lights(19.66, 20.62),
      // question 2: Anthropic's video, blurred and grey
      lights(23.96, 31.9),
      // MCP explanation
      lights(31.9, 42.42),
    ],

    frames: [
      // hook: real ball (left) and the IA logo (right) with the title between them, all ABOVE the head
      { src: I + 'soccerball.svg', at: 1.14, out: 2.62, x: 90, y: 300, w: 180, h: 180, bg: 'transparent', border: false, what: 'pelota' },
      { src: I + 'claude.png', at: 1.74, out: 2.62, x: 810, y: 300, w: 180, h: 180, bg: 'transparent', border: false, what: 'logo IA' },
      { html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#F4F0EA;text-align:center"><img src="../assets/brand/aurelio/logo-mark.svg" style="width:46px;height:46px;margin-bottom:6px">${SERIF_LINE('Fútbol', 78)}${SERIF_LINE('vs', 44, 'font-style:italic;font-weight:400;color:rgba(244,240,234,.72);margin:2px 0 4px')}${SERIF_LINE('IA', 78)}</div>`,
        at: 1.14, out: 2.62, x: 375, y: 250, w: 330, h: 300, kind: 'rise', sfx: 'word', bg: 'rgba(0,0,0,.55)', what: 'titulo' },
      // the World Cup trophy on "Copa": cut-out PNG floating free, beside the head
      { src: I + 'trophy-cut.png', at: 5.0, out: 6.08, x: 805, y: 250, w: 200, h: 488, bg: 'transparent', border: false, radius: 0, css: 'box-shadow:none;filter:drop-shadow(0 24px 40px rgba(0,0,0,.6))', what: 'Copa del Mundo' },
      // "Ahora vamos con...": the IA logo
      { src: I + 'claude.png', at: 19.7, out: 20.62, x: 365, y: 610, w: 350, h: 350, pad: 60, radius: 175, bg: '#0A0A0A', kind: 'slam', what: 'logo IA' },
      // MCP on "MCP"
      { html: `<div style="height:100%;display:flex;align-items:center;justify-content:center;gap:34px"><img src="${I}mcp-mark-white.svg" style="width:120px;height:120px"><div style="font:500 150px/1 AuSerif,Georgia,serif;color:#F4F0EA">MCP</div></div>`, at: 22.62, out: 23.96, x: 280, y: 270, w: 520, h: 210, kind: 'slam', what: 'MCP' },
      // explanation
      { src: I + 'mcp-mark-white.svg', at: 31.93, out: 33.34, x: 390, y: 400, w: 300, h: 300, bg: 'transparent', border: false, kind: 'slam', what: 'marca MCP' },
      { src: I + 'claude.png', at: 35.05, out: 35.69, x: 340, y: 560, w: 400, h: 400, pad: 80, radius: 200, bg: '#0A0A0A', kind: 'slam', what: 'IA' },
      { src: I + 'mcp-logo-white.svg', at: 33.47, out: 34.9, x: 90, y: 700, w: 900, h: 132, bg: 'transparent', border: false, radius: 0, kind: 'rise', what: 'logo MCP' },
    ],

    texts: [
      // POV gag
      { html: 'POV: vos viendo el nivel<br>de nuestras <i>preguntas</i>', at: 2.64, out: 4.0, y: 400, size: 70, kind: 'cut', css: 'line-height:1.08' },
      // answer
      { html: 'Kylian <i>Mbappé</i>', at: 12.38, out: 12.94, y: 1150, size: 128, kind: 'cut' },
      // explanation keywords, white on the material
      { html: 'Model', at: 31.93, out: 33.34, y: 790, size: 120 },
      { html: 'Context', at: 32.37, out: 33.34, y: 915, size: 120 },
      { html: 'Protocol', at: 32.95, out: 33.34, y: 1040, size: 120 },
      { html: 'Una forma <i>estándar</i><br>de conectar', at: 34.03, out: 34.9, y: 1000, size: 100, css: 'line-height:1.1' },
      { html: 'una <i>IA</i>', at: 35.05, out: 35.69, y: 1020, size: 120 },
      { html: '<i>herramientas</i>', at: 35.72, out: 36.34, y: 300, size: 104 },
      { html: 'y datos <i>externos</i>', at: 36.47, out: 37.3, y: 300, size: 104 },
      { html: 'Por <i>ejemplo</i>', at: 37.57, out: 38.89, y: 330, size: 104 },
      { html: 'Claude consulta<br>tu <i>calendario</i>', at: 38.93, out: 40.31, y: 290, size: 100, css: 'line-height:1.1' },
      { html: 'Encuentra un horario <i>libre</i>', at: 40.35, out: 42.4, y: 300, size: 80 },
    ],

    pills: [
      { html: 'Pregunta 1 de 2', at: 4.02, out: 6.08, y: 180, size: 38 },
      { html: 'Pregunta 2 de 2', at: 19.68, out: 20.6, y: 1010, size: 38 },
      { html: 'Pregunta 2 de 2', at: 20.64, out: 23.96, y: 180, size: 38, sfx: null },
      year('2018', 18.56, 168), year('2022', 18.66, 443), year('2026', 18.76, 718),
      { html: '¿Cuántas acertaste?', at: 42.64, out: 43.82, y: 230, size: 46, arrow: true },
    ],

    questions: [
      {
        from: 6.08, to: 12.36, label: 'Pregunta 1 de 2',
        header: { html: '¿Quién es el máximo goleador<br>de la <i>Copa del Mundo</i>?', at: 6.1, y: 250, size: 62 },
        cardY: 470, cardH: 270, gap: 28,
        cards: [
          { letter: 'A', at: 6.14, media: { kind: 'clip', src: V + 'c-klose.mp4' }, small: 'Miroslav', big: 'Klose' },
          { letter: 'B', at: 7.04, media: { kind: 'clip', src: V + 'c-mbappe.mp4' }, small: 'Kylian', big: 'Mbappé' },
          { letter: 'C', at: 7.93, media: { kind: 'clip', src: V + 'c-messi.mp4' }, small: 'Lionel', big: 'Messi' },
        ],
        think: { t0: 8.7, t1: 10.86, cy: 905, digits: [[8.74, '3'], [9.46, '2'], [10.16, '1']] },
        answer: { letter: 'B', at: 11.8 },
      },
      {
        from: 23.96, to: 31.9, label: 'Pregunta 2 de 2',
        header: { html: '¿Qué significan las siglas <i>MCP</i>?', at: 23.98, y: 280, size: 66 },
        cardY: 480, cardH: 230, gap: 30,
        cards: [
          { letter: 'A', at: 24.08, wordsSize: 64, words: [['Model', 24.08], ['Context', 24.5], ['Protocol', 24.95]] },
          { letter: 'B', at: 25.46, wordsSize: 64, words: [['Model', 25.46], ['Communication', 25.8], ['Protocol', 26.4]] },
          { letter: 'C', at: 27.22, wordsSize: 64, words: [['Machine', 27.22], ['Context', 27.75], ['Protocol', 28.25]] },
        ],
        think: { t0: 28.92, t1: 30.02, cy: 865, digits: [[28.95, '3'], [29.32, '2'], [29.68, '1']] },
        answer: { letter: 'A', at: 31.44 },
      },
    ],

    counters: [
      { at: 12.96, out: 13.82, y: 300, size: 330, steps: [[12.98, 22, 'goles']] },
      // he says "4 en Rusia, 8 en Qatar y 10 en el Mundial de 2026": each number exactly as said, never a running total
      { at: 14.18, out: 14.98, y: 300, size: 330, steps: [[14.18, 4, 'en Rusia 2018']] },
      { at: 14.98, out: 15.82, y: 300, size: 330, steps: [[14.98, 8, 'en Qatar 2022']] },
      { at: 15.82, out: 17.52, y: 300, size: 330, steps: [[15.82, 10, 'en el Mundial 2026']] },
      { at: 17.52, out: 19.66, y: 300, size: 330, steps: [[17.54, 22, 'goles en total'], [18.52, 22, 'en 3 Mundiales']] },
    ],

    network: [
      { at: 35.71, out: 37.45, cx: 540, cy: 800, r: 330, center: { src: I + 'claude.png', at: 35.71, size: 240 },
        nodes: [
          { src: I + 'gcal.png', at: 35.75, angle: -135, label: 'Calendar' },
          { src: I + 'github.png', at: 35.98, angle: -45, invert: true, label: 'GitHub' },
          { src: I + 'slack.png', at: 36.2, angle: 45, label: 'Slack' },
          { src: I + 'gdrive.png', at: 36.47, angle: 135, label: 'Drive' },
        ] },
    ],

    // own clean graphics instead of tiny screen recordings: Claude -> MCP -> Google Calendar, then a week with a free slot
    chains: [
      { at: 37.45, out: 40.33, y: 820, size: 210, pulse: [38.93, 40.33], pulseDur: 0.7,
        items: [
          { src: I + 'claude.png', label: 'Claude', at: 37.5 },
          { src: I + 'mcp-mark-white.svg', label: 'MCP', at: 37.75 },
          { src: I + 'gcal.png', label: 'Google Calendar', at: 38.0, hi: 39.57 },
        ] },
    ],
    calendars: [
      { at: 40.33, out: 42.42, x: 70, y: 470, w: 940, h: 760, title: 'Tu semana',
        busy: [[0, 9, 11], [0, 14, 16], [1, 10, 13], [1, 15, 17], [2, 9, 10], [2, 12, 14], [3, 9, 12], [3, 13, 15], [3, 16, 18], [4, 11, 13], [4, 14, 17]],
        free: { day: 2, from: 15, to: 17, at: 41.51, label: 'Libre' } },
    ],

    close: { at: 43.84, y: 380 },
  };

  QUIZ.build(DATA);
  QUIZ.start(DATA);
})();
