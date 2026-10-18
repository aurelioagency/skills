// Optional video background for overlay films (Branch B: motion graphics over the user's own footage).
// Not used by from-scratch films (Branch A) — only film.js files that call C.videoBG() load this.
//
// Call AFTER C.start(), as the last line of film.js. C.start() is what defines window.seek; this wraps
// it so every frame first seeks the real <video> element to t and waits for the browser to actually have
// that frame decoded, THEN paints the overlay scenes on top. render.mjs already awaits window.seek(t)
// (it's called through page.evaluate, which awaits a returned promise), so no changes to render.mjs,
// core.js, or any audio/beat script are needed — timeline.json just uses bpm:60 so one beat = one second,
// and marks are the transcript's own timestamps instead of a measured music grid.
(() => {
  function videoBG(src, { objectPosition = 'center' } = {}) {
    const v = document.createElement('video');
    v.src = src;
    v.muted = true;            // the ORIGINAL audio is muxed back in by mix.py/render.mjs, never played here
    v.playsInline = true;
    v.preload = 'auto';
    v.style.cssText = `position:absolute;left:0;top:0;width:${C.W}px;height:${C.H}px;object-fit:cover;object-position:${objectPosition};z-index:0`;
    C.stage.insertBefore(v, C.stage.firstChild);

    const ready = new Promise((resolve, reject) => {
      v.addEventListener('loadeddata', () => resolve(v), { once: true });
      v.addEventListener('error', () => reject(new Error(`video failed to load: ${src}`)), { once: true });
    });

    const paint = window.seek;   // the function C.start() just assigned
    let lastSeeked = -1;
    window.seek = async (t) => {
      t = Math.max(0, Math.min(C.DUR - 1e-6, t));
      if (Math.abs(t - lastSeeked) > 1 / 240) {
        await ready;
        await new Promise((resolve) => {
          const onSeeked = () => { v.removeEventListener('seeked', onSeeked); resolve(); };
          v.addEventListener('seeked', onSeeked);
          v.currentTime = t;
        });
        lastSeeked = t;
      }
      paint(t);
    };

    return { el: v, ready };
  }
  window.C = window.C || {};
  window.C.videoBG = videoBG;
})();
