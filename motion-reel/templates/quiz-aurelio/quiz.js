// QUIZ TEMPLATE ENGINE v3 (motion-reel, Branch B), Aurelio house style. One file for every
// "¿Sabés más de X o de IA?" reel; the reel's film/film.js only holds DATA and calls QUIZ.build(DATA) + QUIZ.start(DATA).
// Look (measured on aurelioagency.com): black #000 (panels #0A0A0A), warm white #F4F0EA (secondary at 72 % and 52 %),
// NO accent colour, serif titles in Cormorant Garamond 400/500 with italic for the emphasis word, Inter for small labels,
// hairline borders (#F4F0EA at 22-34 %), outlined pills with the 4-point star, soft lights, lots of black.
// Motion: hard cuts and whips (directional blur), punch zooms, real clips full screen, slow motion and freeze frames,
// a counter, screen shake on hits. Everything is a pure function of time (render contract): no timers, no Math.random,
// clips are seeked to the exact frame before painting.
// Load order (film/index.html): lib/motion.js, data.js, core.js, type.js, video.js, overlay.js, quiz.js, film.js
//
// DATA (all times = seconds of the joined source):
//   source:  { src, fps }                              the speaker's footage
//   layout:  [[t, 'full'|'gone'], ...]                 speaker on / off (off = only his voice)
//   punch:   [[t, scale, 'cut'|'snap'|'smooth'], ...]  zooms on the speaker
//   whips:   [t, ...]                                  whip transition: horizontal motion blur + jolt + whoosh
//   shakes:  [[t, amp], ...]                           extra screen shake (goal, hit)
//   stage:   [{ kind:'clip'|'image'|'plate'|'lights', src, at, to, box:{x,y,w,h}, fit, push:[s0,s1],
//               punches:[[t,s]], rate, offset, freeze, frame, radius, css }]   bottom layer, in order
//   texts:   [{ html, at, out, x, y, w, size, font:'serif'|'sans', weight, italic, align, color, kind:'rise'|'cut'|'slam'|'pop', sfx }]
//   pills:   [{ html, at, out, x, y, size, star, arrow, center }]   outlined pills (site buttons)
//   frames:  [{ src, html, at, out, x, y, w, h, fit, pad, radius, bg, invert, kind, sfx }]   hairline cards with a logo/photo
//   questions: [{ from, to, label, header:{ html, at, y, size }, cardY, cardH, gap,
//                 cards:[{ letter, at, media:{ kind:'clip'|'image', src }, small, big, words:[[html, at], ...] }],
//                 think:{ t0, t1, digits:[[at,'3'],...] }, answer:{ letter, at } }]
//   counters: [{ at, out, y, size, steps:[[t, value, label], ...], labelY, count }]   shows EXACTLY the number he says (count: true = roll between steps)
//   network: [{ at, out, cx, cy, r, center:{ src, at, size }, nodes:[{ src, at, angle, size, invert }] }]
//   rings:   [{ at, out, x, y, w, h, r, color }]       a hairline that draws itself around something
//   chains:  [{ at, out, y, size, items:[{ src, label, at, hi, invert }], pulse:[t0,t1] }]   big labelled nodes in a row (IA -> MCP -> app)
//   calendars: [{ at, out, x, y, w, h, title, busy:[[day, from, to]], free:{ day, from, to, at, label } }]   own clean week card
//   star:    path of the real Aurelio star (default ../assets/brand/aurelio/logo-mark.svg)
//   close:   { at, y }                                  Aurelio wordmark (OV.wordmark, RULES.md)
(() => {
  const QUIZ = (window.QUIZ = {});
  const CLIPS = [];

  QUIZ.build = (D) => {
    const { W, el, scene } = C;
    const H = 1920, DUR = C.DUR;
    const { slam, cutIn, pop, layout, punch, impact, draw, wordmark, cue } = OV;
    const K = { bg: '#000', panel: '#0A0A0A', text: '#F4F0EA', t72: 'rgba(244,240,234,.72)', t52: 'rgba(244,240,234,.52)',
      line: 'rgba(244,240,234,.24)', lineStrong: 'rgba(244,240,234,.42)', ...(D.colors || {}) };

    const st = document.createElement('style');
    st.textContent =
      "@font-face{font-family:'AuSerif';src:url(../assets/fonts/CormorantGaramond.ttf) format('truetype');font-weight:300 700;font-style:normal}" +
      "@font-face{font-family:'AuSerif';src:url(../assets/fonts/CormorantGaramond-Italic.ttf) format('truetype');font-weight:300 700;font-style:italic}" +
      "@font-face{font-family:'AuSans';src:url(../assets/fonts/Inter.ttf) format('truetype');font-weight:100 900}" +
      '.au-i{font-style:italic}';
    document.head.appendChild(st);
    C.fonts = ['400 60px AuSerif', 'italic 400 60px AuSerif', '500 60px AuSerif', '500 30px AuSans', '600 30px AuSans'];
    const SERIF = (px, w = 400) => `font:${w} ${px}px/1.02 AuSerif,Georgia,serif;letter-spacing:-0.005em`;
    const SANS = (px, w = 500) => `font:${w} ${px}px/1.1 AuSans,Arial,sans-serif;letter-spacing:0.01em`;
    const SOFT = 'text-shadow:0 6px 30px rgba(0,0,0,.55)';
    // the REAL Aurelio star (aurelioagency.com header / CTA: public/logo-mark.svg, copied to assets/brand/aurelio/)
    const STAR_SRC = D.star || '../assets/brand/aurelio/logo-mark.svg';
    const STAR = (s) => `<img src="${STAR_SRC}" style="width:${Math.round(s * 1.3)}px;height:${Math.round(s * 1.3)}px;display:block;margin:-${Math.round(s * 0.15)}px 0">`;
    const CHECK = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.5" fill="${K.text}"/><path d="M6.6 12.4l3.5 3.5 7.3-7.6" stroke="#000" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const clamp = C.clamp, eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
    const live = (t, a, b) => t >= a && (b == null || t < b);

    // RISE: the premium entrance (site hero): the line comes up 40 px through a mask, 0.28 s ease-out, landing near `at`
    const RISES = [];
    function rise(e, o) { C.reg(e, { o: 0 }); RISES.push({ e, ...o }); cue(o.at, o.sfx === undefined ? null : o.sfx, o); return e; }
    function riseRun(t) {
      for (const r of RISES) {
        const d = t - (r.at - 0.06);
        if (d < 0 || (r.out != null && t >= r.out + 0.12)) { C.put(r.e, { o: 0 }); continue; }
        const k = eo(d / 0.28);
        let o = clamp(d / 0.14), y = 40 * (1 - k);
        if (r.out != null && t >= r.out) { const q = clamp((t - r.out) / 0.12); o *= 1 - q; y -= 20 * q; }
        C.put(r.e, { o, y, filter: k < 0.98 ? `blur(${(6 * (1 - k)).toFixed(2)}px)` : undefined });
      }
    }
    const ENTER = { slam, cut: cutIn, pop, rise };
    const enter = (e, o) => (ENTER[o.kind || 'rise'])(e, o);

    if (D.layout) layout(D.layout, { face: 0.45 });
    if (D.punch) punch(D.punch);
    for (const [at, amp] of D.shakes || []) impact(at, amp);

    // ------------------------------------------------------------ 1. stage: clips, images, plates, lights
    scene({
      name: 'stage', from: 0, to: DUR, cut: false,
      build(root, S) {
        root.style.overflow = 'visible';
        S.items = (D.stage || []).map((it) => {
          const b = it.box || { x: -60, y: -60, w: W + 120, h: H + 120 };
          const framed = it.frame ? `border:1.5px solid ${K.lineStrong};box-shadow:0 40px 120px -30px rgba(0,0,0,.9), 0 0 0 1px rgba(0,0,0,.6);` : '';
          const wrap = el('div', { class: 'abs', style: `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;overflow:hidden;transform-origin:50% 50%;border-radius:${it.radius || 0}px;box-sizing:border-box;${framed}background:${it.color || 'transparent'}` }, root);
          let media = null;
          if (it.kind === 'clip') {
            media = document.createElement('video');
            media.src = it.src; media.muted = true; media.playsInline = true; media.preload = 'auto';
            media.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;object-fit:${it.fit || 'cover'};transform-origin:50% 50%;${it.css || ''}`;
            wrap.appendChild(media);
            CLIPS.push({ v: media, at: it.at, to: it.to, rate: it.rate || 1, offset: it.offset || 0, freeze: it.freeze, fps: it.fps || 30 });
          } else if (it.kind === 'image') {
            media = el('img', { src: it.src, style: `position:absolute;left:0;top:0;width:100%;height:100%;object-fit:${it.fit || 'cover'};transform-origin:50% 50%;${it.css || ''}` }, wrap);
          } else if (it.kind === 'lights') {
            // black with soft lights and two faint diagonal hairlines (the site's hero), drifting slowly
            wrap.style.background = '#000';
            media = el('div', { style: `position:absolute;left:-10%;top:-10%;width:120%;height:120%;background:radial-gradient(ellipse 60% 40% at 30% 18%, rgba(244,240,234,.13), rgba(244,240,234,0) 70%), radial-gradient(ellipse 50% 35% at 78% 82%, rgba(244,240,234,.07), rgba(244,240,234,0) 70%)` }, wrap);
            el('div', { style: `position:absolute;left:-20%;top:30%;width:140%;height:1px;background:linear-gradient(90deg, rgba(244,240,234,0), rgba(244,240,234,.16), rgba(244,240,234,0));transform:rotate(-28deg)` }, media);
            el('div', { style: `position:absolute;left:-20%;top:62%;width:140%;height:1px;background:linear-gradient(90deg, rgba(244,240,234,0), rgba(244,240,234,.10), rgba(244,240,234,0));transform:rotate(-28deg)` }, media);
          } else if (it.css) {
            wrap.style.background = it.css;
          }
          C.reg(wrap, { clip: 'inset(0 0 100% 0)' });
          if (media) C.reg(media);
          return { it, wrap, media };
        });
      },
      run(t, b, S) {
        for (const { it, wrap, media } of S.items) {
          const on = live(t, it.at, it.to);
          C.put(wrap, { clip: on ? (it.radius ? `inset(0 round ${it.radius}px)` : 'inset(-200px)') : 'inset(0 0 100% 0)' });
          if (!on || !media) continue;
          let s = 1, x = 0;
          if (it.push) s = it.push[0] + (it.push[1] - it.push[0]) * C.seg(t, it.at, it.to);
          let pz = 1; for (const [k, sc] of it.punches || []) if (t >= k) pz = sc;
          s *= pz;
          if (it.kind === 'lights') x = 30 * Math.sin(t * 0.35);
          C.put(media, { s, x });
        }
      },
    });

    // ------------------------------------------------------------ 2. quiz blocks (label, header, cards, countdown, reveal)
    (D.questions || []).forEach((Q, qi) => {
      scene({
        name: 'quiz-' + (qi + 1), from: Q.from, to: Q.to, cut: false,
        build(root, S) {
          root.style.overflow = 'visible';
          if (Q.label) {
            const lb = el('div', { class: 'abs', style: `left:0;top:${(Q.header.y || 230) - 66}px;width:${W}px;text-align:center;color:${K.t52};${SANS(26, 600)};letter-spacing:.28em;text-transform:uppercase` }, root, Q.label);
            rise(lb, { at: Q.header.at, out: Q.answer ? null : null });
          }
          S.header = el('div', { class: 'abs', style: `left:60px;top:${Q.header.y || 230}px;width:${W - 120}px;text-align:center;color:${K.text};${SERIF(Q.header.size || 60, 500)};line-height:1.08` }, root, Q.header.html);
          rise(S.header, { at: Q.header.at, what: 'pregunta' });
          const Y0 = Q.cardY || 470, CH = Q.cardH || 270, GAP = Q.gap || 26, CW = 980, X0 = (W - CW) / 2;
          S.cards = Q.cards.map((c, i) => {
            const y = Y0 + i * (CH + GAP) + (c.dy || 0);   // dy: nudge one card up/down a few px
            const outer = C.reg(el('div', { class: 'abs', style: `left:${X0}px;top:${y}px;width:${CW}px;height:${CH}px;transform-origin:50% 50%` }, root), { o: 0 });
            const body = C.reg(el('div', { class: 'abs', style: `left:0;top:0;width:${CW}px;height:${CH}px;border-radius:30px;background:rgba(10,10,10,.82);border:1.5px solid ${K.line};box-sizing:border-box;overflow:hidden;transform-origin:50% 50%` }, outer));
            const edge = C.reg(el('div', { class: 'abs', style: `left:0;top:0;width:${CW}px;height:${CH}px;border-radius:30px;border:2px solid ${K.text};box-sizing:border-box` }, outer), { o: 0 });
            let tx = 64;
            if (c.media) {
              const mh = CH - 36, mw = Math.round(mh * 16 / 9);
              const mb = el('div', { class: 'abs', style: `left:18px;top:18px;width:${mw}px;height:${mh}px;border-radius:18px;overflow:hidden;background:#111` }, body);
              if (c.media.kind === 'clip') {
                const v = document.createElement('video');
                v.src = c.media.src; v.muted = true; v.playsInline = true; v.preload = 'auto';
                v.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover';
                mb.appendChild(v);
                CLIPS.push({ v, at: c.at, to: Q.to, rate: c.media.rate || 1, offset: c.media.offset || 0, fps: c.media.fps || 30 });
              } else el('img', { src: c.media.src, style: `position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:${c.media.pos || '50% 30%'}` }, mb);
              if (c.media.css) mb.firstElementChild.style.filter = c.media.css;
              tx = 18 + mw + 38;
            }
            const text = el('div', { class: 'abs', style: `left:${tx}px;top:0;width:${CW - tx - 40}px;height:${CH}px;display:flex;flex-direction:column;justify-content:center;color:${K.text}` }, body);
            el('div', { style: `${SANS(24, 600)};letter-spacing:.3em;color:${K.t52};margin-bottom:${c.media ? 10 : 14}px` }, text, `OPCIÓN ${c.letter}`);
            if (c.small) el('div', { style: `${SERIF(c.smallSize || 52, 400)};color:${K.t72};white-space:nowrap` }, text, c.small);
            if (c.big) el('div', { style: `${SERIF(c.bigSize || 92, 500)};white-space:nowrap;margin-top:-4px` }, text, c.big);
            const words = (c.words || []).map(([html, at]) => ({ at, e: C.reg(el('span', { style: 'display:inline-block;margin-right:.24em' }, null, html)) }));
            if (words.length) { const line = el('div', { style: `${SERIF(c.wordsSize || 66, 500)};white-space:nowrap` }, text); for (const w of words) line.appendChild(w.e); }
            const badge = C.reg(el('div', { class: 'abs', style: `left:${CW - 112}px;top:${(CH - 84) / 2}px;width:84px;height:84px;transform-origin:50% 50%` }, outer, CHECK(84)), { o: 0 });
            return { c, y, outer, body, edge, badge, words, correct: Q.answer && c.letter === Q.answer.letter };
          });
          for (const x of S.cards) cue(x.c.at, 'word', { what: 'opcion ' + x.c.letter, gain: 0.6 });
          if (Q.answer) { cue(Q.answer.at, 'icon', { what: 'check correcta' }); impact(Q.answer.at, 8); }
          if (Q.think) {
            S.veil = C.reg(el('div', { class: 'abs', style: `left:-60px;top:-60px;width:${W + 120}px;height:${H + 120}px;background:radial-gradient(ellipse at 50% 48%, rgba(0,0,0,.55), rgba(0,0,0,.88))` }, root), { o: 0 });
            const R = 190, cx = W / 2, cy = Q.think.cy || 905;
            S.ring = C.reg(el('div', { class: 'abs', style: `left:${cx - 210}px;top:${cy - 210}px;width:420px;height:420px` }, root,
              `<svg width="420" height="420" viewBox="0 0 420 420"><circle cx="210" cy="210" r="${R}" stroke="${K.line}" stroke-width="2" fill="none"/><circle class="arc" cx="210" cy="210" r="${R}" stroke="${K.text}" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(-90 210 210)" stroke-dasharray="${(2 * Math.PI * R).toFixed(1)}"/></svg>`), { o: 0 });
            S.arc = C.reg(S.ring.querySelector('.arc'));
            S.circ = 2 * Math.PI * R;
            S.digits = (Q.think.digits || []).map(([at, n], i, arr) => {
              const d = el('div', { class: 'abs', style: `left:${cx - 210}px;top:${cy - 210}px;width:420px;height:420px;display:flex;align-items:center;justify-content:center;color:${K.text};${SERIF(250, 400)};font-style:italic;padding-bottom:30px;box-sizing:border-box` }, root, n);
              pop(d, { at, out: i < arr.length - 1 ? arr[i + 1][0] - 0.02 : Q.think.t1, sfx: null, what: 'cuenta ' + n });
              return d;
            });
          }
        },
        run(t, b, S) {
          const A = Q.answer ? Q.answer.at : Infinity;
          const thinking = Q.think && live(t, Q.think.t0, Q.think.t1 + 0.02);
          if (Q.think) {
            const k = C.seg(t, Q.think.t0, Q.think.t1);
            C.put(S.ring, { o: thinking ? 1 : 0 });
            C.put(S.arc, { css: { strokeDashoffset: (S.circ * k).toFixed(1) } });
            const vin = clamp((t - Q.think.t0) / 0.15) * (1 - clamp((t - Q.think.t1) / 0.15));
            C.put(S.veil, { o: vin });
          }
          const order = S.cards.map((x) => x.c.at);
          const endRead = Q.think ? Q.think.t0 : A;
          const ci = S.cards.findIndex((z) => z.correct);
          S.cards.forEach((x, i) => {
            // entrance: rises 70 px out of a soft blur in 0.3 s, landing on its spoken name
            const d0 = t - (x.c.at - 0.08);
            if (d0 < 0) { C.put(x.outer, { o: 0 }); return; }
            const k = eo(d0 / 0.3);
            const nextAt = i < order.length - 1 ? order[i + 1] : endRead;
            const act = clamp((t - x.c.at) / 0.1) * (1 - clamp((t - nextAt) / 0.15));
            let o = clamp(d0 / 0.12), y = 70 * (1 - k), s = 1 + 0.025 * act, filter = k < 0.98 ? `blur(${(10 * (1 - k)).toFixed(2)}px)` : undefined;
            let edge = 0.85 * act;
            const d = t - A;
            if (d >= 0) {
              const q = eo(d / 0.35);
              if (x.correct) { s = 1 + 0.05 * q - 0.03 * Math.exp(-d / 0.08) * Math.sin(d * 40); edge = 1; }
              else { o *= 1 - 0.7 * q; filter = `grayscale(${q.toFixed(2)})`; s = 1 - 0.03 * q; y = (i < ci ? -14 : 14) * q; }
            } else if (!act && t > nextAt) o *= 0.8;
            C.put(x.outer, { o, y, s, filter });
            C.put(x.edge, { o: edge });
            C.put(x.badge, { o: d >= 0 && x.correct ? 1 : 0, s: d >= 0 ? 0.4 + 0.6 * eo(d / 0.12) + 0.1 * Math.exp(-d / 0.1) * Math.sin(d * 30) : 1 });
            for (const w of x.words) C.put(w.e, { o: t >= w.at ? 1 : 0.38 });
          });
        },
      });
    });

    // ------------------------------------------------------------ 3. overlay: frames, texts, pills, counters, network, rings
    scene({
      name: 'overlay', from: 0, to: DUR, cut: false,
      build(root, S) {
        root.style.overflow = 'visible';
        for (const f of D.frames || []) {
          const pad = f.pad ?? 0;
          const inner = f.html ? f.html : `<img src="${f.src}" style="width:100%;height:100%;object-fit:${f.fit || 'contain'};display:block;${f.invert ? 'filter:invert(1)' : ''}">`;
          const e = el('div', { class: 'abs', style: `left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;border-radius:${f.radius ?? 28}px;box-sizing:border-box;padding:${pad}px;overflow:hidden;background:${f.bg ?? 'rgba(10,10,10,.78)'};${f.border === false ? '' : `border:1.5px solid ${K.lineStrong};`}box-shadow:0 30px 90px -30px rgba(0,0,0,.85);${f.css || ''}` }, root, inner);
          enter(e, { at: f.at, out: f.out, kind: f.kind || 'pop', impact: f.impact ?? 0, rot: 0, sfx: f.sfx === undefined ? 'icon' : f.sfx, what: f.what || 'marco' });
        }
        for (const w of D.texts || []) {
          const font = w.font === 'sans' ? SANS(w.size || 34, w.weight || 600) : SERIF(w.size || 96, w.weight || 500);
          const e = el('div', { class: 'abs', style: `left:${w.x ?? 0}px;top:${w.y}px;width:${w.w ?? W}px;text-align:${w.align || 'center'};color:${w.color || K.text};${font};${w.italic ? 'font-style:italic;' : ''}${w.shadow === false ? '' : SOFT};white-space:nowrap;${w.css || ''}` }, root, w.html);
          enter(e, { at: w.at, out: w.out, kind: w.kind || 'rise', impact: w.impact ?? 0, rot: 0, outKind: 'cut', sfx: w.sfx === undefined ? null : w.sfx, what: w.what || String(w.html).replace(/<[^>]+>/g, '') });
        }
        for (const p of D.pills || []) {
          const size = p.size || 30, h = Math.round(size * 2.2);
          const e = el('div', { class: 'abs', style: `left:${p.center === false ? p.x + 'px' : '0'};top:${p.y}px;width:${p.center === false ? 'auto' : W + 'px'};display:flex;justify-content:center` }, root,
            `<div style="display:flex;align-items:center;gap:${Math.round(size * 0.55)}px;height:${h}px;padding:0 ${Math.round(size * 1.0)}px;border-radius:${h / 2}px;border:1.5px solid ${K.lineStrong};background:rgba(0,0,0,.42);color:${K.text};${SANS(size, 600)};white-space:nowrap">` +
            `${p.star === false ? '' : STAR(Math.round(size * 0.95))}<span>${p.html}</span>${p.arrow ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" stroke="${K.text}" stroke-width="1.6" fill="none"/></svg>` : ''}</div>`);
          enter(e, { at: p.at, out: p.out, kind: p.kind || 'rise', sfx: p.sfx === undefined ? 'click' : p.sfx, what: 'pill' });
        }
        S.counters = (D.counters || []).map((c) => {
          const e = C.reg(el('div', { class: 'abs', style: `left:0;top:${c.y}px;width:${W}px;text-align:center;color:${K.text};${SERIF(c.size || 330, 500)};line-height:1;font-variant-numeric:lining-nums tabular-nums;${SOFT};transform-origin:50% 50%` }, root, '0'), { o: 0 });
          const lab = C.reg(el('div', { class: 'abs', style: `left:0;top:${c.labelY ?? c.y + (c.size || 330) * 0.98}px;width:${W}px;text-align:center;color:${K.text};${SERIF(c.labelSize || 70, 400)};font-style:italic;${SOFT}` }, root, ''), { o: 0 });
          for (const [at] of c.steps) { cue(at, 'click', { gain: 0.5, what: 'contador' }); impact(at, 7); }
          return { c, e, lab };
        });
        S.nets = (D.network || []).map((N) => {
          const g = el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:${H}px` }, root);
          const svg = el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:${H}px` }, g,
            `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block">` + N.nodes.map((n) => {
              const a = (n.angle * Math.PI) / 180, x2 = N.cx + N.r * Math.cos(a), y2 = N.cy + N.r * Math.sin(a);
              return `<line x1="${N.cx}" y1="${N.cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(244,240,234,.38)" stroke-width="2" stroke-dasharray="7 9"/>`;
            }).join('') + '</svg>');
          const lines = [...svg.querySelectorAll('line')].map((l) => C.reg(l));
          const cs = N.center.size || 230;
          const center = el('div', { class: 'abs', style: `left:${N.cx - cs / 2}px;top:${N.cy - cs / 2}px;width:${cs}px;height:${cs}px;border-radius:${cs / 2}px;border:1.5px solid ${K.lineStrong};background:#0A0A0A;display:flex;align-items:center;justify-content:center;box-shadow:0 0 120px rgba(244,240,234,.10)` }, g,
            `<img src="${N.center.src}" style="width:${Math.round(cs * 0.56)}px;height:${Math.round(cs * 0.56)}px;object-fit:contain">`);
          pop(center, { at: N.center.at ?? N.at, out: N.out, sfx: 'icon', what: 'centro red' });
          const nodes = N.nodes.map((n) => {
            const a = (n.angle * Math.PI) / 180, x = N.cx + N.r * Math.cos(a), y = N.cy + N.r * Math.sin(a), s = n.size || 170;
            const e = el('div', { class: 'abs', style: `left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;border-radius:34px;border:1.5px solid ${K.lineStrong};background:#0A0A0A;display:flex;align-items:center;justify-content:center` }, g,
              `<img src="${n.src}" style="width:${Math.round(s * 0.55)}px;height:${Math.round(s * 0.55)}px;object-fit:contain;${n.invert ? 'filter:invert(1)' : ''}">` +
              (n.label ? `<div style="position:absolute;left:-60px;top:${s + 14}px;width:${s + 120}px;text-align:center;color:${K.text};${SANS(32, 600)}">${n.label}</div>` : ''));
            pop(e, { at: n.at, out: N.out, sfx: 'icon', what: 'nodo' });
            return n;
          });
          return { N, lines, nodes, g: C.reg(g) };
        });
        // CHAIN: a row of big labelled nodes joined by a hairline; a light dot travels along it between pulse[0] and pulse[1]
        S.chains = (D.chains || []).map((Ch) => {
          const n = Ch.items.length, s = Ch.size || 200, m = Ch.margin ?? 90, gapX = (W - 2 * m - s) / (n - 1);
          const g = el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:${H}px` }, root);
          const xs = Ch.items.map((_, i) => m + s / 2 + i * gapX), y = Ch.y;
          const line = C.reg(el('div', { class: 'abs', style: `left:${xs[0]}px;top:${y - 1}px;width:${xs[n - 1] - xs[0]}px;height:2px;background:rgba(244,240,234,.38);transform-origin:0 50%` }, g), { o: 0 });
          const dot = C.reg(el('div', { class: 'abs', style: `left:0;top:${y - 11}px;width:22px;height:22px;border-radius:11px;background:${K.text};box-shadow:0 0 30px 8px rgba(244,240,234,.45)` }, g), { o: 0 });
          const items = Ch.items.map((it, i) => {
            const e = el('div', { class: 'abs', style: `left:${xs[i] - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;border-radius:${s * 0.24}px;border:1.5px solid ${K.lineStrong};background:#0A0A0A;display:flex;align-items:center;justify-content:center` }, g,
              `<img src="${it.src}" style="width:${Math.round(s * 0.56)}px;height:${Math.round(s * 0.56)}px;object-fit:contain;${it.invert ? 'filter:invert(1)' : ''}">` +
              `<div style="position:absolute;left:-90px;top:${s + 18}px;width:${s + 180}px;text-align:center;color:${K.text};${SANS(Ch.labelSize || 36, 600)}">${it.label}</div>`);
            pop(e, { at: it.at, out: Ch.out, sfx: 'icon', what: it.label });
            const edge = C.reg(el('div', { class: 'abs', style: `left:${xs[i] - s / 2 - 4}px;top:${y - s / 2 - 4}px;width:${s + 8}px;height:${s + 8}px;border-radius:${s * 0.25}px;border:3px solid ${K.text};box-sizing:border-box;transform-origin:50% 50%` }, g), { o: 0 });
            return { it, e, edge };
          });
          return { Ch, xs, line, dot, items };
        });
        // CALENDAR: a clean week card (own graphic): busy blocks in grey, the free slot appears in white with its label
        S.cals = (D.calendars || []).map((Cl) => {
          const days = Cl.days || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], h0 = Cl.h0 ?? 9, h1 = Cl.h1 ?? 18;
          const head = 120, pad = 30, lab = 80, colW = (Cl.w - 2 * pad - lab) / days.length, rowH = (Cl.h - head - pad) / (h1 - h0);
          const card = el('div', { class: 'abs', style: `left:${Cl.x}px;top:${Cl.y}px;width:${Cl.w}px;height:${Cl.h}px;border-radius:30px;border:1.5px solid ${K.lineStrong};background:#0A0A0A;overflow:hidden` }, root);
          el('div', { class: 'abs', style: `left:${pad}px;top:26px;color:${K.t72};${SANS(28, 600)};letter-spacing:.22em;text-transform:uppercase` }, card, Cl.title || 'Tu semana');
          days.forEach((d, i) => el('div', { class: 'abs', style: `left:${pad + lab + i * colW}px;top:${head - 44}px;width:${colW}px;text-align:center;color:${K.text};${SANS(30, 600)}` }, card, d));
          for (let hh = h0; hh < h1; hh += 2) el('div', { class: 'abs', style: `left:${pad}px;top:${head + (hh - h0) * rowH - 2}px;color:${K.t52};${SANS(24, 500)}` }, card, `${hh}:00`);
          for (let hh = h0; hh <= h1; hh++) el('div', { class: 'abs', style: `left:${pad + lab}px;top:${head + (hh - h0) * rowH}px;width:${Cl.w - 2 * pad - lab}px;height:1px;background:rgba(244,240,234,.08)` }, card);
          const blocks = (Cl.busy || []).map(([d, a, b]) => C.reg(el('div', { class: 'abs', style: `left:${pad + lab + d * colW + 6}px;top:${head + (a - h0) * rowH + 3}px;width:${colW - 12}px;height:${(b - a) * rowH - 6}px;border-radius:12px;background:rgba(244,240,234,.17)` }, card), { o: 0 }));
          const F = Cl.free;
          const free = C.reg(el('div', { class: 'abs', style: `left:${pad + lab + F.day * colW + 4}px;top:${head + (F.from - h0) * rowH + 2}px;width:${colW - 8}px;height:${(F.to - F.from) * rowH - 4}px;border-radius:14px;border:3px solid ${K.text};background:rgba(244,240,234,.08);box-sizing:border-box;display:flex;align-items:center;justify-content:center;color:${K.text};${SERIF(46, 500)};font-style:italic;transform-origin:50% 50%` }, card, F.label || 'Libre'), { o: 0 });
          rise(card, { at: Cl.at, out: Cl.out });
          return { Cl, blocks, free };
        });
        for (const r of D.rings || []) {
          const d = el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:${H}px` }, root,
            `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.r ?? 18}" fill="none" stroke="${r.color || K.text}" stroke-width="${r.sw || 4}" stroke-linecap="round"/></svg>`);
          const rect = d.querySelector('rect');
          rect.getTotalLength = () => 2 * (r.w + r.h);
          draw(rect, { at: r.at, out: r.out, dur: r.dur || 0.3, sfx: 'icon', what: r.what || 'marco' });
        }
      },
      run(t, b, S) {
        riseRun(t);
        for (const { c, e, lab } of S.counters) {
          if (!live(t, c.at, c.out)) { C.put(e, { o: 0 }); C.put(lab, { o: 0 }); continue; }
          let v = 0, prev = 0, kick = 0, label = '';
          // the number on screen is the number he says at that moment: no count-up unless count: true (then it rolls from the previous step)
          for (const [at, val, l] of c.steps) { if (t >= at) { const k = c.count ? eo((t - at) / 0.3) : 1; v = Math.round(prev + (val - prev) * k); kick = Math.exp(-(t - at) / 0.08); prev = val; label = l || label; } }
          C.put(e, { o: 1, text: String(v), s: 1 + 0.12 * kick });
          C.put(lab, { o: label ? 1 : 0, html: label });
        }
        for (const { Ch, xs, line, dot, items } of S.chains) {
          const on = live(t, Ch.at, Ch.out);
          const k = on ? eo((t - Ch.items[1].at + 0.1) / 0.4) : 0;
          C.put(line, { o: on ? k : 0, sx: Math.max(0.001, k) });
          const [p0, p1] = Ch.pulse || [Infinity, Infinity];
          if (on && t >= p0 && t < p1) { const f = ((t - p0) / (Ch.pulseDur || 0.7)) % 1; C.put(dot, { o: 1, x: xs[0] + (xs[xs.length - 1] - xs[0]) * eo(f) - 11 }); } else C.put(dot, { o: 0 });
          for (const { it, edge } of items) { const h = it.hi != null && t >= it.hi; C.put(edge, { o: on && h ? 1 : 0, s: h ? 1 + 0.08 * Math.exp(-(t - it.hi) / 0.08) : 1 }); }
        }
        for (const { Cl, blocks, free } of S.cals) {
          blocks.forEach((b, i) => C.put(b, { o: clamp((t - (Cl.at + 0.12 + i * 0.06)) / 0.15) }));
          const d = t - Cl.free.at;
          C.put(free, { o: d >= 0 ? 1 : 0, s: d >= 0 ? 1 + 0.1 * Math.exp(-d / 0.09) : 1 });
        }
        for (const { N, lines } of S.nets) {
          const on = live(t, N.at, N.out);
          N.nodes.forEach((n, i) => {
            const L = 1000, k = on ? eo((t - n.at + 0.05) / 0.25) : 0;
            C.put(lines[i], { o: on && t >= n.at - 0.05 ? 1 : 0, css: { strokeDashoffset: String(-((t - N.at) * 60).toFixed(1)) } });
            if (k < 1) C.put(lines[i], { o: k });
          });
        }
      },
    });

    // ------------------------------------------------------------ 4. top: Aurelio close, whips
    scene({
      name: 'hud', from: 0, to: DUR, cut: false,
      build(root, S) {
        if (D.close) wordmark(root, { at: D.close.at, y: D.close.y ?? 380 });
        // directional motion blur for the whips (SVG filters: fixed strengths, picked per frame)
        const defs = el('div', { style: 'position:absolute;width:0;height:0;overflow:hidden' }, document.body,
          '<svg width="0" height="0"><filter id="whip1" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="14 0"/></filter><filter id="whip2" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="34 0"/></filter><filter id="whip3" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="60 0"/></filter></svg>');
        S.defs = defs;
        C.reg(C.stage, {});
        for (const w of D.whips || []) { impact(w, 9); cue(w, 'whoosh', { what: 'whip', gain: 0.5 }); }
      },
      run(t) {
        let lvl = 0, dir = 0;
        for (const w of D.whips || []) {
          const d = t - w;
          if (d > -0.09 && d < 0.09) { const a = Math.abs(d); const l = a < 0.025 ? 3 : a < 0.055 ? 2 : 1; if (l > lvl) { lvl = l; dir = d < 0 ? -1 : 1; } }
        }
        C.put(C.stage, { filter: lvl ? `url(#whip${lvl})` : undefined });
        if (lvl) for (const Sc of C.SCENES) if (Sc.name !== 'subs') C.put(Sc.root, { x: dir * lvl * 26 });
      },
    });
  };

  // after C.videoBG: every frame, seek each live clip to its exact frame before painting
  QUIZ.start = (D) => {
    C.start();
    C.videoBG(D.source.src, { fps: D.source.fps });
    const load = (v) => new Promise((res) => { if (v.readyState >= 2) return res(); v.addEventListener('loadeddata', () => res(), { once: true }); v.addEventListener('error', () => res(), { once: true }); });
    const seekTo = async (v, t) => {
      await new Promise((res) => { const on = () => { v.removeEventListener('seeked', on); res(); }; v.addEventListener('seeked', on); v.currentTime = t; });
      if (v.requestVideoFrameCallback) await new Promise((res) => { v.requestVideoFrameCallback(() => res()); setTimeout(res, 120); });
    };
    for (const c of CLIPS) { c.ready = load(c.v); c.last = -1; }
    const paint = window.seek;
    window.seek = async (t) => {
      for (const c of CLIPS) {
        if (t < c.at - 0.1 || t >= c.to) continue;
        await c.ready;
        const dur = c.v.duration || 1e9;
        const tt = c.freeze != null ? Math.min(t, c.freeze) : t;
        const want = Math.min(dur - 1 / c.fps, Math.max(0, c.offset + (tt - c.at) * c.rate)) + 0.5 / c.fps;
        if (Math.floor(want * c.fps) !== Math.floor(c.last * c.fps)) { await seekTo(c.v, want); c.last = want; }
      }
      return paint(t);
    };
    const R = window.READY;
    // frame 0 must show the footage: a first seek to 0 on a fresh <video> can skip the 'seeked' paint, so seek away and back
    window.READY = (async () => { await Promise.all(CLIPS.map((c) => c.ready)); const r = await R; await window.seek(0.5); await window.seek(0); return r; })();
  };
})();
