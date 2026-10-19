// BRANCH B STARTER — copied to film/film.js by `init.sh --overlay`. Replace the example with the approved overlay plan.
// bpm 60, no grid: every beat/mark is a literal second of the source. Pure function of time: no timers, no Math.random.
//
// What a Branch B film is made of (reference/RULES.md "Branch B"): ANIMATION first. The subtitles already carry the words,
// so overlays show what the caption can't: the real resource in motion, logos, icons, counters, diagrams, arrows,
// punch-ins on the speaker, full-screen cutaways while the voice keeps talking. Text only for a key number or keyword.
(() => {
  const { W, H, put, reg, el, scene, sp, spHit, seg, clamp, lerp, ease, bt } = C;
  const { settleOn, slide, putSlide, subtitles } = OV;
  C.fonts = ['600 40px UI', '700 40px UI'];

  // ---------------------------------------------------------------- example: a key number on a card, rising out of its own edge
  scene({
    name: 'example', from: 0.5, to: 3.5, cut: false,
    build(root, S) {
      S.card = el('div', { class: 'card', style: 'left:80px;top:300px;width:420px;height:260px;overflow:hidden' }, root);
      reg(S.card, { o: 0 });
      el('div', { class: 'abs display', style: 'left:36px;top:10px;font-size:220px;line-height:1' }, S.card, '22');
    },
    run(t, b, S) { putSlide(S.card, slide(t, settleOn(1.0, 'default'), 3.0, 260)); },
  });

  // ---------------------------------------------------------------- example: punch-in on the speaker (the footage itself moves)
  C.hooks.before.push((t) => {
    if (!OV.bg) return;
    const k = spHit(t, 1.0, 'heavy') - sp(t, 3.0, 'default');   // 1.00 → 1.12 on the hit, back out at 3.0
    put(OV.bg, { s: 1 + 0.12 * k });
  });

  subtitles();   // always on
  C.start();
  C.videoBG('../assets/source/clip.mp4');
})();
