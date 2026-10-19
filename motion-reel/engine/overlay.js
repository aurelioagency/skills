// Branch B helpers (init.sh --overlay wires this in after core.js / type.js, before film.js): window.OV
// Built and debugged on the first real overlay film; every rule here came out of a critique round.
//
//   OV.settleOn(cue, preset)        release beat so a spring is SETTLED (95 %) on a spoken cue — the word lands WITH its sound
//   OV.slide(t, inAt, outAt, h)     a card rises out of its OWN bottom edge and lifts out through its OWN top edge
//                                   (a fixed band mask slices cards on a line floating in the frame). Exit travel covers the
//                                   drop shadow, and the card hides before the mask closes, so no shadow band lingers.
//   OV.putSlide(el, slide, extra)   put() the slide's y / clip / visibility (+ extra props)
//   OV.subtitles({ top, lead, dim }) the always-on subtitle scene from window.CAPS (scripts/captions.py)
//   OV.bg                           the background <video> handle once C.videoBG ran: animate it for punch-ins / moves
(() => {
  const C = window.C;
  const T95 = {};
  for (const p of ['snappy', 'default', 'heavy']) { let x = 0; while (Motion.step(x, p) < 0.95 && x < 2) x += 0.002; T95[p] = x; }
  const settleOn = (cue, preset = 'snappy') => C.bt(cue) + C.leadFor(preset) - T95[preset];

  function slide(t, inAt, outAt, h, preset = 'default') {
    const p = C.spHit(t, inAt, preset);
    const q = outAt == null ? 0 : C.sp(t, outAt, 'snappy');
    const T = h + 24, TOUT = h + 160;   // exit travel covers the shadow (40 px offset + 90 px blur) below the card
    const y = T * (1 - p) - TOUT * q;
    const clip = q > 0.001 ? `inset(${(TOUT * q).toFixed(1)}px -80px -170px -80px)`
      : y > 0.5 ? `inset(-80px -80px ${y.toFixed(1)}px -80px)` : 'none';   // entry overshoot is never clipped
    return { y, clip, hide: p < 0.002 || q > 0.92 };
  }
  const putSlide = (e, sl, extra = {}) => C.put(e, { o: sl.hide ? 0 : 1, y: sl.y, clip: sl.clip, ...extra });

  // Subtitles: one phrase chunk at a time (never two on screen), it pops in on its first word, spoken words go full ink.
  // Style lives in film/index.html (.cap). Hide them around a full-screen cutaway with `hideDuring: [[t0, t1], …]` only if
  // the cutaway itself carries the words — by default subtitles stay on through cutaways (the voice keeps talking).
  function subtitles({ top = 1290, lead = 0.06, dim = 0.68, hideDuring = [] } = {}) {
    C.scene({
      name: 'subs', from: 0, to: C.DUR, cut: false,
      build(root, S) {
        S.chunks = (window.CAPS || []).map((c) => {
          const d = C.el('div', { class: 'cap', style: `top:${top}px` }, root);
          const words = c.w.map(([w]) => C.reg(C.el('span', { class: 'word' }, d, w)));
          return { c, d: C.reg(d, { o: 0 }), words };
        });
      },
      run(t, b, S) {
        const hidden = hideDuring.some(([a, z]) => t >= a && t < z);
        S.chunks.forEach(({ c, d, words }, i) => {
          const next = S.chunks[i + 1];
          const live = !hidden && t >= c.t0 - lead && t < Math.min(c.t1, next ? next.c.t0 - lead : Infinity);
          if (!live) return C.put(d, { o: 0 });
          const p = C.spHit(t, c.t0 - lead, 'snappy');
          C.put(d, { o: C.clamp(p * 4), s: 0.9 + 0.1 * p, y: 16 * (1 - p) });
          words.forEach((w, k) => C.put(w, { o: t >= c.w[k][1] - 0.04 ? 1 : dim }));
        });
      },
    });
  }

  window.OV = { settleOn, slide, putSlide, subtitles, T95, bg: null };
  // keep a handle on the background video so films can animate it (punch-ins, drift, shake) with C.put
  const orig = C.videoBG;
  if (orig) C.videoBG = (src, o) => { const r = orig(src, o); C.reg(r.el); window.OV.bg = r.el; return r; };
})();
