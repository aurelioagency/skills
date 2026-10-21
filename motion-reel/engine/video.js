// Optional video background for overlay films (Branch B: motion graphics over the user's own footage).
// Not used by from-scratch films (Branch A) — only film.js files that call C.videoBG() load this.
//
// Call AFTER C.start(), as the last line of film.js. C.start() is what defines window.seek; this wraps
// it so every frame first seeks the real <video> element to t and waits for the browser to actually have
// that frame decoded, THEN paints the overlay scenes on top. render.mjs already awaits window.seek(t)
// (it's called through page.evaluate, which awaits a returned promise), so no changes to render.mjs,
// core.js, or any audio/beat script are needed — timeline.json just uses bpm:60 so one beat = one second,
// and marks are the transcript's own timestamps instead of a measured music grid.
//
// matte: the speaker cut out IN FRONT of the scenes marked scene({ behind: true }) — for the moment a graphic does not
// fit above the head and passes behind it instead (ANIMATION.md §2b). The matte is the video scripts/matte.py makes
// (alpha + clean edge colour); it is seeked with the footage, and on frames where a behind scene is live a <canvas> holds
// the cut-out speaker, stacked over the behind scenes and under every other one. overlay.js moves it exactly like
// the footage (layout, punch, impacts). Elsewhere it is hidden and costs nothing.
(() => {
  // fps: the source's frame rate (e.g. 30 for a phone video). With it, a seek that lands inside the frame already on
  // screen is skipped — at 60 fps finals that halves the seeks.
  function videoBG(src, { objectPosition = 'center', fps = null, matte = null } = {}) {
    const v = document.createElement('video');
    v.src = src;
    v.muted = true;            // the ORIGINAL audio is muxed back in by mix.py/render.mjs, never played here
    v.playsInline = true;
    v.preload = 'auto';
    v.style.cssText = `position:absolute;left:0;top:0;width:${C.W}px;height:${C.H}px;object-fit:cover;object-position:${objectPosition};z-index:0`;
    C.stage.insertBefore(v, C.stage.firstChild);

    const load = (el) => new Promise((resolve, reject) => {
      el.addEventListener('loadeddata', () => resolve(el), { once: true });
      el.addEventListener('error', () => reject(new Error(`video failed to load: ${el.src}`)), { once: true });
    });
    const ready = load(v);
    // seek a <video> to t and wait until that frame is presented ('seeked' can fire before it is composited, which
    // captured black placeholders right after cutaways). Bounded, so a missed callback cannot hang the render.
    const seekTo = async (el, t) => {
      await new Promise((resolve) => {
        const onSeeked = () => { el.removeEventListener('seeked', onSeeked); resolve(); };
        el.addEventListener('seeked', onSeeked);
        el.currentTime = t;
      });
      if (el.requestVideoFrameCallback) await new Promise((resolve) => { el.requestVideoFrameCallback(() => resolve()); setTimeout(resolve, 120); });
    };
    const frameOf = (t) => (fps ? Math.floor(t * fps + 1e-6) : t);

    const cut = matte ? speakerLayer(v, matte, load, seekTo, frameOf) : null;

    const paint = window.seek;   // the function C.start() just assigned
    let lastSeeked = -1;
    window.seek = async (t) => {
      t = Math.max(0, Math.min(C.DUR - 1e-6, t));
      const same = fps && lastSeeked >= 0 && frameOf(t) === frameOf(lastSeeked);
      if (!same && Math.abs(t - lastSeeked) > 1 / 240) {
        await ready;
        await seekTo(v, t);
        lastSeeked = t;
      }
      if (cut && cut.needed(t)) await cut.draw(lastSeeked);   // the time the footage really shows
      paint(t);
    };

    return { el: v, ready, cut: cut && cut.el };
  }

  function speakerLayer(v, src, load, seekTo, frameOf) {
    const m = document.createElement('video');
    m.src = src; m.muted = true; m.playsInline = true; m.preload = 'auto';
    const ready = load(m);
    // the canvas copies the footage <video>'s box (and its default centre transform-origin), so the same put() props
    // land it on the same pixels; its bitmap is at device resolution, so a 2x final keeps the source's 4K detail
    const k = Math.max(1, window.devicePixelRatio || 1);
    const el = document.createElement('canvas');
    el.width = Math.round(C.W * k); el.height = Math.round(C.H * k);
    el.style.cssText = `position:absolute;left:0;top:0;width:${C.W}px;height:${C.H}px`;
    const ctx = el.getContext('2d');
    const canvas = (w, h, o) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', o)]; };
    const [inner, ictx] = canvas(el.width, el.height);
    let mask, mctx, core, cctx;

    // z-order: footage, the behind scenes, this canvas, every other scene
    const behind = C.SCENES.filter((S) => S.behind);
    const needed = (t) => behind.some((S) => C.isLive(S, C.beatAt(t)));
    let after = v;
    for (const S of behind) { C.stage.insertBefore(S.root, after.nextSibling); after = S.root; }
    C.stage.insertBefore(el, after.nextSibling);
    C.reg(el, { hide: true });
    C.hooks.before.push((t) => C.put(el, { hide: !needed(t) }));

    // The matte video (scripts/matte.py) is [ alpha | clean edge colour ]. The speaker = the footage itself (full
    // resolution) inside, the clean colour on the see-through edge (no sky / wall rim), cut by the alpha.
    let drawn = null, maskAt = null;   // a cache keyed on the source frame: the bitmap is a pure function of it
    async function draw(t) {
      const f = frameOf(t);
      if (drawn === f) return;
      await ready;
      if (maskAt !== f) { await seekTo(m, t); maskAt = f; }
      const mw = m.videoWidth / 2, mh = m.videoHeight;
      if (!mask) { [mask, mctx] = canvas(mw, mh, { willReadFrequently: true }); [core, cctx] = canvas(mw, mh); }
      mctx.globalCompositeOperation = 'copy';
      mctx.drawImage(m, 0, 0, mw, mh, 0, 0, mw, mh);
      const px = mctx.getImageData(0, 0, mw, mh), d = px.data, cpx = cctx.createImageData(mw, mh), c = cpx.data;
      for (let i = 0; i < d.length; i += 4) {   // grey → alpha; core = where the speaker is solid (alpha > 0.9)
        const a = d[i];
        d[i + 3] = a; d[i] = d[i + 1] = d[i + 2] = 0;
        c[i + 3] = a > 230 ? Math.min(255, (a - 230) * 10.2) : 0;
      }
      mctx.putImageData(px, 0, 0); cctx.putImageData(cpx, 0, 0);
      // object-fit: cover, centred — the same box the footage <video> paints into
      const sc = Math.max(el.width / v.videoWidth, el.height / v.videoHeight), dw = v.videoWidth * sc, dh = v.videoHeight * sc;
      const dx = (el.width - dw) / 2, dy = (el.height - dh) / 2;
      ictx.globalCompositeOperation = 'copy';
      ictx.drawImage(v, dx, dy, dw, dh);
      ictx.globalCompositeOperation = 'destination-in';
      ictx.drawImage(core, dx, dy, dw, dh);
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(m, mw, 0, mw, mh, dx, dy, dw, dh);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(inner, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, dx, dy, dw, dh);
      ctx.globalCompositeOperation = 'source-over';
      drawn = f;
    }
    return { el, ready, needed, draw };
  }

  window.C = window.C || {};
  window.C.videoBG = videoBG;
})();
