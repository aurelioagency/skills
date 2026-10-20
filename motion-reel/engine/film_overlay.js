// BRANCH B STARTER — copied to film/film.js by `init.sh --overlay`. Replace the example with the approved animation plan.
// bpm 60, no grid: every beat/mark is a literal second of the source. Pure function of time: no timers, no Math.random.
// Language: reference/ANIMATION.md. Kit: header of film/overlay.js. Declare in build(); the kit animates every frame and
// registers each entrance's sound (node scripts/autosfx.mjs → timeline.sfx).
(() => {
  const { W, H, el, scene } = C;
  const { slam, cutIn, pop, layout, punch } = OV;
  C.fonts = [];

  layout([[0, 'full'], [2.0, 'gone'], [3.5, 'full']], { face: 0.45 });   // speaker full → cutaway (voice continues) → back
  punch([[0.4, 1.1], [1.9, 1.0]]);                                         // snap zoom on a strong line

  // example: a key number slams in over the free zone above the head
  scene({
    name: 'example-number', from: 0, to: 2.0, cut: false,
    build(root) {
      slam(el('div', { class: 'abs', style: `left:0;top:320px;width:${W}px;text-align:center;font:700 280px Georgia,serif;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.45)` }, root, '22'), { at: 0.5, out: 1.95, what: '22' });
    },
  });

  // example: a full-screen cutaway — the real resource cuts in on a plain background, an icon pops next to it
  scene({
    name: 'example-cutaway', from: 2.0, to: 3.5, cut: false,
    build(root) {
      OV.cutawayBg(root, '#f6f6f4');   // opaque, jolt-proof background (the voice keeps playing)
      cutIn(el('div', { class: 'abs', style: 'left:90px;top:620px;width:900px;height:500px;border-radius:18px;background:#ddd' }, root), { at: 2.05, sfx: 'screen', what: 'resource screenshot' });
      pop(el('div', { class: 'abs', style: 'left:820px;top:560px;width:160px;height:160px;border-radius:40px;background:#3b82f6' }, root), { at: 2.5, what: 'icon' });
    },
  });

  // no subtitles in the film: they are burned onto the final render (reference/SUBTITLES.md)
  C.start();
  C.videoBG('../assets/source/clip.mp4', { fps: 30 });   // the source as it came (assets/source/<file>); fps = the source's frame rate
  // CTA close on the Aurelio keyword: OV.wordmark(root, { at: <keyword start> }) inside the last scene's build() (ANIMATION.md §3c)
})();
