// Branch B kit (init.sh --overlay wires this in after core.js / type.js / video.js, before film.js): window.OV
// The animation vocabulary of reference/ANIMATION.md, as pure functions of time. Every rule here came out of a
// critique round or a frame-by-frame study of the user's reference reels.
//
// DECLARE in a scene's build() — the kit animates them every frame (a global before-hook) and registers their sound:
//   OV.slam(el, { at, out, from, rot0, rot, shake, impact, outKind, sfx }) hits in big (×1.7), lands in 0.1 s ON `at`,
//                                                                         and the whole frame jolts (impact px, 0 = off)
//   OV.cutIn(el, { at, out, sfx, gain })                                  hard cut in (1 frame) with a tiny 2-frame snap
//   OV.pop(el, { at, out, sfx, gain })                                    icon jumps in 0.3 → 1.15 → 1, lands ON `at`
//   OV.typeOn(el, text, { t0, t1, sfx })                                  types the text between t0 and t1 (key ticks)
//   OV.draw(svgPath, { at, dur, fill, sfx })                              the stroke draws itself; optional fill pops after
//   OV.odometer(parent, { x, y, size, value, t0, t1, group, cw, style, sfx }) rolling digit columns (lining figures)
//   OV.cursor(parent, { path: [[t, x, y], …], clicks: [t, …], sfx })      a cursor glides and clicks (press + ring)
//   OV.browser(parent, { x, y, w, url, url_t0, url_t1, img, imgH })        a browser window with the real page, to float
//                                                                         over the footage (give it slam / cutIn)
//   OV.layout([[t, 'full' | 'split' | 'gone'], …], { face })              the speaker full / in the bottom half / gone
//   OV.punch([[t, scale, 'cut' | 'snap' | 'smooth'], …])                  zooms on the speaker (default: jump-cut zoom)
//   OV.impact(at, amp)                                                     an extra frame jolt (slams add their own)
//   OV.cutawayBg(root, color)                                              opaque background of a full-screen cutaway (jolt-proof)
//   OV.wordmark(parent, { at, x, y, size, out })                            the Aurelio closing wordmark (star + AURELIO on a dark
//                                                                         card), slams in ON `at`, then plays the site's own
//                                                                         animation: the letters close to "AI" and open again
// `out`: the element hard-cuts away at that time (outKind 'drop' = shrinks out in 0.1 s instead).
// `sfx`: 'word' | 'screen' | 'icon' | 'click' | 'type' | 'whoosh' | null — the default comes from the kind; the cue lands
//        on the same frame as the visual. scripts/autosfx.mjs turns OV_CUES into timeline.sfx (AUDIO.md house sounds).
//
// LOWER-LEVEL (run-time) helpers:
//   OV.settleOn(cue, preset)        release beat so a spring is SETTLED (95 %) on a spoken cue
//   OV.slide(t, inAt, outAt, h)     soft card rise out of its own edge (not the house look — use slam/cutIn/pop first)
//   OV.putSlide(el, slide, extra)   put() a slide's y / clip / visibility
//   OV.bg                           the background <video> element once C.videoBG ran
//   OV.cut                          the cut-out speaker <canvas> (C.videoBG(src, { matte })): over scene({ behind: true })
(() => {
  const C = window.C;
  const { clamp, lerp } = C;
  const T95 = {};
  for (const p of ['snappy', 'default', 'heavy']) { let x = 0; while (Motion.step(x, p) < 0.95 && x < 2) x += 0.002; T95[p] = x; }
  const settleOn = (cue, preset = 'snappy') => C.bt(cue) + C.leadFor(preset) - T95[preset];
  const easeOut3 = (x) => 1 - Math.pow(1 - x, 3);

  // ------------------------------------------------------------------ sound cues (collected by scripts/autosfx.mjs)
  const CUES = (window.OV_CUES = []);
  function cue(at, kind, o = {}) { if (kind) CUES.push({ at: +(+at).toFixed(3), kind, gain: o.gain, to: o.to, what: o.what || '' }); }

  // ------------------------------------------------------------------ declarative specs, animated by one before-hook
  const SPECS = [];
  const center = (el) => { el.style.transformOrigin = el.style.transformOrigin && el.style.transformOrigin !== '0px 0px' ? el.style.transformOrigin : '50% 50%'; };

  // SLAM — the house entrance (joebrunner stamps, thomas "0€", loucash key words): enters at ×from, transparent, and lands
  // at ×1 in 0.1 s exactly ON `at` (where its click sounds), with a tiny settle; optional rotation and a landing shake.
  function slam(el, o) {
    center(el); C.reg(el, { o: 0 });
    SPECS.push({ k: 'slam', el, from: 1.7, rot0: (o.rot ?? 0) - 6, rot: 0, dur: 0.1, shake: 0, outKind: 'cut', ...o });
    cue(o.at, o.sfx === undefined ? 'word' : o.sfx, o);
    impact(o.at, o.impact ?? 10);   // the whole frame jolts on the hit
    return el;
  }
  function slamProps(t, s) {
    const t0 = s.at - s.dur;
    if (t < t0) return { o: 0 };
    if (s.out != null && t >= s.out + (s.outKind === 'drop' ? 0.1 : 0)) return { o: 0 };
    const k = clamp((t - t0) / s.dur), e = easeOut3(k), after = Math.max(0, t - s.at);
    let sc = k < 1 ? s.from + (1 - s.from) * e : 1 - 0.035 * Math.exp(-after / 0.05) * Math.sin(after * 55);
    let o = clamp(k * 3), r = lerp(s.rot0, s.rot, e), x = 0;
    if (s.shake && after > 0) x = s.shake * Math.exp(-after / 0.04) * Math.sin(after * 95);
    if (s.out != null && s.outKind === 'drop' && t >= s.out) { const q = clamp((t - s.out) / 0.1); sc = 1 - 0.45 * q; o = 1 - q; }
    return { o, s: sc, r, x };
  }

  // CUT IN — a word or a screen is just there on its frame (loucash "DEMI / MILLION"), with a 2-frame 1.06 → 1 snap.
  function cutIn(el, o) { center(el); C.reg(el, { o: 0 }); SPECS.push({ k: 'cut', el, ...o }); cue(o.at, o.sfx === undefined ? 'word' : o.sfx, o); return el; }
  function cutProps(t, s) {
    if (t < s.at || (s.out != null && t >= s.out)) return { o: 0 };
    return { o: 1, s: 1 + 0.06 * Math.exp(-(t - s.at) / 0.03) };
  }

  // POP — an icon jumps in: 0.3 → 1.15 in 0.08 s landing ON `at`, then settles to 1 (bubble sound).
  function pop(el, o) { center(el); C.reg(el, { o: 0 }); SPECS.push({ k: 'pop', el, ...o }); cue(o.at, o.sfx === undefined ? 'icon' : o.sfx, o); return el; }
  function popProps(t, s) {
    const t0 = s.at - 0.08;
    if (t < t0) return { o: 0 };
    if (s.out != null && t >= s.out + 0.08) return { o: 0 };
    const k = clamp((t - t0) / 0.08), after = Math.max(0, t - s.at);
    let sc = k < 1 ? 0.3 + 0.85 * easeOut3(k) : 1 + 0.15 * Math.exp(-after / 0.06) * Math.cos(after * 30);
    let o = k > 0 ? 1 : 0;   // full opacity from its first frame: a faint first frame reads as a ghost (critique 2026-10-19)
    if (s.out != null && t >= s.out) { const q = clamp((t - s.out) / 0.08); sc *= 1 - q; o = 1 - q; }
    return { o, s: sc };
  }

  // TYPE ON — terminal / search-bar typing (joebrunner): characters appear between t0 and t1, with key ticks.
  function typeOn(el, text, o) {
    C.reg(el); SPECS.push({ k: 'type', el, text, ...o });
    if (o.sfx !== null) cue(o.t0, 'type', { ...o, to: o.t1 });
    return el;
  }
  const typeProps = (t, s) => ({ text: s.text.slice(0, Math.floor(clamp((t - s.t0) / (s.t1 - s.t0)) * s.text.length + 1e-6)) });

  // DRAW — a hand-drawn stroke draws itself (loucash doodles); `fill` (an element) pops in when the stroke closes.
  function draw(path, o) {
    const L = path.getTotalLength ? path.getTotalLength() : 1000;
    path.setAttribute('stroke-dasharray', `${L} ${L + 20}`);
    C.reg(path); SPECS.push({ k: 'draw', el: path, L, dur: 0.35, ...o });
    if (o.fill) pop(o.fill, { at: o.at + (o.dur ?? 0.35), out: o.out, sfx: o.sfx === undefined ? 'icon' : o.sfx, gain: o.gain });
    return path;
  }
  function drawProps(t, s) {
    if (t < s.at || (s.out != null && t >= s.out)) return { css: { strokeDashoffset: String(s.L) }, o: 0 };
    return { o: 1, css: { strokeDashoffset: String((s.L * (1 - easeOut3(clamp((t - s.at) / s.dur)))).toFixed(2)) } };
  }

  // ODOMETER — thomas's "1 000 000 vues": every digit is a rolling column; the value eases out from 0 to `value`.
  function odometer(parent, o) {
    const size = o.size || 120, cell = size * 1.1, digits = String(Math.round(o.value)).split('');
    const wrap = C.el('div', { class: 'abs', style: `left:${o.x}px;top:${o.y}px;display:flex;align-items:flex-start;${o.style || ''}` }, parent);
    const cols = [];
    digits.forEach((_, i) => {
      const place = digits.length - 1 - i;
      const col = C.el('div', { style: `position:relative;overflow:hidden;height:${cell}px;width:${size * (o.cw ?? 0.62)}px;${o.box || ''}` + (o.group && place % o.group === o.group - 1 && i > 0 ? `;margin-left:${size * 0.22}px` : '') }, wrap);
      const strip = C.el('div', { style: `position:absolute;left:0;top:0;width:100%;text-align:center;font-size:${size}px;line-height:${cell}px;font-variant-numeric:lining-nums tabular-nums;font-feature-settings:"lnum","tnum"` }, col,
        Array.from({ length: 11 }, (_, d) => `<div>${d % 10}</div>`).join(''));
      cols.push({ strip: C.reg(strip), col: C.reg(col), place, cell });
    });
    C.reg(wrap, { o: 0 });
    SPECS.push({ k: 'odo', el: wrap, cols, ...o });
    if (o.sfx !== null) cue(o.t0, 'type', { ...o, to: o.t1, gain: o.gain ?? 0.12 });
    return wrap;
  }
  function odoRun(t, s) {
    const vis = t >= s.t0 - 0.12 && (s.out == null || t < s.out);
    C.put(s.el, { o: vis ? 1 : 0 });
    if (!vis) return;
    const v = s.value * easeOut3(clamp((t - s.t0) / (s.t1 - s.t0)));
    for (const c of s.cols) {
      // a real odometer: the units roll continuously; a higher column only turns while the one below it passes 9 → 0
      const q = v / Math.pow(10, c.place), base = Math.floor(q + 1e-9), f = q - base;
      const pos = c.place === 0 ? q % 10 : (base + (f > 0.9 ? (f - 0.9) / 0.1 : 0)) % 10;
      C.put(c.strip, { y: -(pos * c.cell) });
      if (!s.zeros) C.put(c.col, { o: c.place === 0 || v >= Math.pow(10, c.place) * 0.9 ? 1 : 0 });   // no leading zeros (zeros: true keeps them)
    }
  }

  // CURSOR — glides between [t, x, y] keys (ease in-out) and clicks: a press (×0.82) and an expanding ring.
  function cursor(parent, o) {
    const g = C.el('div', { class: 'abs', style: 'width:96px;height:96px;transform-origin:13px 10px' }, parent,
      '<svg width="96" height="96" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L17.5 14 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>');
    const ring = C.el('div', { class: 'abs', style: 'width:80px;height:80px;border-radius:40px;border:4px solid rgba(255,255,255,.9);transform-origin:50% 50%' }, parent);
    C.reg(g, { o: 0 }); C.reg(ring, { o: 0 });
    SPECS.push({ k: 'cursor', el: g, ring, ...o });
    for (const c of o.clicks || []) cue(c, o.sfx === undefined ? 'click' : o.sfx, o);
    return g;
  }
  function cursorRun(t, s) {
    const P = s.path, vis = t >= P[0][0] && (s.out == null || t < s.out);
    if (!vis) { C.put(s.el, { o: 0 }); C.put(s.ring, { o: 0 }); return; }
    let x = P[P.length - 1][1], y = P[P.length - 1][2];
    for (let i = 0; i < P.length - 1; i++) {
      const [a, ax, ay] = P[i], [b, bx, by] = P[i + 1];
      if (t >= a && t < b) { const e = C.ease.inOut(clamp((t - a) / (b - a))); x = lerp(ax, bx, e); y = lerp(ay, by, e); break; }
    }
    let press = 1, ro = 0, rs = 0;
    for (const c of s.clicks || []) {
      const d = t - c;
      if (d > -0.04 && d < 0.12) press = Math.min(press, 1 - 0.18 * Math.sin(Math.PI * clamp((d + 0.04) / 0.16)));
      if (d >= 0 && d < 0.3) { ro = 1 - d / 0.3; rs = 0.3 + 1.2 * easeOut3(d / 0.3); }
    }
    C.put(s.el, { o: 1, x: x - 13, y: y - 10, s: press });
    C.put(s.ring, { o: ro, x: x - 40, y: y - 40, s: rs });
  }

  // LAYOUT — the speaker full frame (graphics float over the footage, e.g. a browser window), in the bottom half
  // (split: the resource lives in the top half), or gone (full-screen cutaway: the voice keeps talking). Switches are
  // hard cuts. Which one(s) a video uses is proposed to the user in the plan, never assumed (SKILL.md B3).
  // face: where the face centre sits in the source (fraction of height) — split mode centres it in the bottom half.
  let LAYOUT = null;
  function layout(keys, o = {}) { LAYOUT = { keys: keys.slice().sort((a, b) => a[0] - b[0]), face: o.face ?? 0.45 }; }
  function layoutAt(t) { let m = 'full'; if (LAYOUT) for (const [k, mode] of LAYOUT.keys) if (t >= k) m = mode; return m; }

  // PUNCH — zooms on the speaker: [[t, scale, kind], …]. kind 'cut' (default): the zoom jumps on that frame, like a
  // jump-cut zoom in the references; 'snap': gets there in ~0.12 s; 'smooth': a slow push. Strong lines 1.15–1.25.
  let PUNCH = [];
  const punch = (keys) => { PUNCH = keys.slice().sort((a, b) => a[0] - b[0]); };
  function punchAt(t) {
    let v = 1, prev = 1;
    for (const [k, sc, kind = 'cut'] of PUNCH) {
      if (t < k) break;
      const d = t - k;
      if (kind === 'cut') v = sc;
      else if (kind === 'snap') v = lerp(prev, sc, easeOut3(clamp(d / 0.12)));
      else v = lerp(prev, sc, C.ease.inOut(clamp(d / 0.8)));
      prev = sc;
    }
    return v;
  }

  // IMPACT — the whole frame jolts when something hits (footage + every graphic, 2–4 frames): ±amp px and a 1.5 % kick.
  // Every slam registers one by default (impact: 0 to disable); add more with OV.impact(at, amp).
  const IMPACTS = [];
  const impact = (at, amp = 10) => { if (amp) IMPACTS.push({ at, amp }); };
  function impactAt(t) {
    let x = 0, y = 0, k = 0;
    for (const { at, amp } of IMPACTS) {
      const d = t - at;
      if (d < 0 || d > 0.2) continue;
      const e = Math.exp(-d / 0.045);
      x += amp * e * Math.sin(d * 120); y += amp * 0.6 * e * Math.cos(d * 95); k += 0.015 * (amp / 10) * e;
    }
    return { x, y, s: 1 + k };
  }

  // the camera: one place combines layout, punch-ins and impacts on the footage (and on the cut-out speaker over the
  // behind scenes, which must sit on exactly the same pixels), and impacts on every scene
  function cameraRun(t) {
    const J = impactAt(t);
    if (window.OV.bg) {
      const m = layoutAt(t), H = C.H, P = punchAt(t);
      let p;
      // hidden by clipping, never by visibility: a <video> toggled to hidden paints one black frame when it comes back
      if (m === 'gone') p = { clip: 'inset(0 0 100% 0)' };
      else if (m === 'split') {
        const shift = 0.75 * H - LAYOUT.face * H, top = (0.5 * H - shift) / H * 100;
        p = { x: J.x, y: shift + J.y, s: P * J.s, clip: `inset(${top.toFixed(2)}% 0 0 0)` };
      } else p = { x: J.x, y: J.y, s: P * J.s };
      C.put(window.OV.bg, p);
      if (window.OV.cut) C.put(window.OV.cut, p);
    }
    if (J.x || J.y) for (const S of C.SCENES) if (S.name !== 'subs') C.put(S.root, { x: J.x, y: J.y });
  }

  // BROWSER — a browser window with the resource's real page inside, to float over the footage (the first film's look):
  // dots, a URL pill (optionally typed between url_t0 and url_t1), and the screenshot. Give it an entrance (slam / cutIn).
  function browser(parent, o) {
    const w = o.w || 940, barH = 54, imgH = o.imgH || Math.round(w * 0.46);
    const win = C.el('div', { class: 'abs', style: `left:${o.x ?? 70}px;top:${o.y ?? 260}px;width:${w}px;height:${barH + imgH}px;border-radius:18px;overflow:hidden;background:${o.bg || '#0f0f0f'};box-shadow:0 30px 80px -20px rgba(0,0,0,.6);${o.style || ''}` }, parent);
    const bar = C.el('div', { class: 'abs', style: `left:0;top:0;width:${w}px;height:${barH}px;background:${o.barBg || '#1b1b1b'}` }, win);
    [22, 46, 70].forEach((x) => C.el('div', { class: 'abs', style: `left:${x}px;top:20px;width:13px;height:13px;border-radius:7px;border:1.5px solid rgba(255,255,255,.35)` }, bar));
    const pill = C.el('div', { class: 'abs', style: `left:100px;top:9px;width:${w - 124}px;height:36px;border-radius:18px;background:rgba(255,255,255,.07)` }, bar);
    const url = C.el('div', { class: 'abs', style: `left:20px;top:6px;font:600 21px UI,Arial,sans-serif;color:rgba(255,255,255,.85);white-space:nowrap` }, pill, o.url_t0 == null ? (o.url || '') : '');
    if (o.url_t0 != null) typeOn(url, o.url || '', { t0: o.url_t0, t1: o.url_t1 ?? o.url_t0 + 0.8 });
    // an <img>, not a CSS background: READY awaits <img> decoding, so frame 0 is never painted without the page
    C.el('div', { class: 'abs', style: `left:0;top:${barH}px;width:${w}px;height:${imgH}px;overflow:hidden` }, win, `<img src="${o.img}" style="width:${w}px;display:block">`);
    return win;
  }

  // WORDMARK — the Aurelio CTA close, saved by the user as the house close (2026-10-19, "me encanta"): the site's own
  // header/footer wordmark (aurelioagency.com: AnimatedLogoWord) — star mark + AURELIO in Cormorant Garamond 500,
  // letter-spacing .42em, cream .92 — on a dark card, slammed in on the keyword. Then the site's animation, 3.6 s
  // ease-in-out: keyframes 0/20/75/100 % full · 40/60 % the letters U R E L O at width 0, opacity 0, blur — only "AI"
  // stays. Assets: assets/brand/aurelio/ (init.sh --overlay copies them). Never restyle it in another face or colour:
  // the CTA must not clash with the rest of the film.
  const WM_FULL = { A: 25.234, U: 25.094, R: 24.672, E: 21.5625, L: 21.4375, I: 16.922, O: 26.578 };   // site's --full-width at 22.4 px
  function wordmark(parent, o = {}) {
    if (!document.getElementById('wm-font')) {
      const st = document.createElement('style'); st.id = 'wm-font';
      st.textContent = "@font-face{font-family:'AurelioSerif';src:url(../assets/brand/aurelio/cormorant-garamond.woff2) format('woff2');font-weight:300 700}";
      document.head.appendChild(st);
      C.fonts = [...(C.fonts || []), "500 40px AurelioSerif"];
    }
    const fs = o.size || 76, k = fs / 22.4, ls = 0.42 * fs, mark = fs * 1.16, pad = fs * 0.63;
    const wordW = Object.values(WM_FULL).reduce((a, b) => a + b, 0) * k;
    const w = o.w || Math.round(pad + mark + fs * 0.79 + wordW + pad), h = o.h || Math.round(fs * 2.26);
    const panel = C.el('div', { class: 'abs', style: `left:${o.x ?? Math.round((C.W - w) / 2)}px;top:${o.y ?? 520}px;width:${w}px;height:${h}px;border-radius:14px;background:rgba(10,10,10,.92);border:1px solid rgba(244,240,234,.22);box-shadow:0 30px 80px -20px rgba(0,0,0,.65)` }, parent);
    C.el('img', { class: 'abs', src: '../assets/brand/aurelio/logo-mark.svg', style: `left:${pad}px;top:${(h - mark) / 2}px;width:${mark}px;display:block` }, panel);
    const word = C.el('div', { class: 'abs', style: `left:${pad + mark + fs * 0.14}px;top:0;height:${h}px;display:flex;align-items:center;white-space:nowrap;font:500 ${fs}px/1 AurelioSerif,Georgia,serif;letter-spacing:${ls}px;color:rgba(244,240,234,.92);padding-left:${ls}px` }, panel);
    const letters = [...'AURELIO'].map((ch) => ({ e: C.reg(C.el('span', { style: `display:inline-block;overflow:hidden;width:${WM_FULL[ch] * k}px` }, word, ch)), w: WM_FULL[ch] * k, vanish: !'AI'.includes(ch) }));
    slam(panel, { at: o.at, out: o.out, from: o.from ?? 1.6, rot: 0, sfx: o.sfx, gain: o.gain, what: o.what || 'AURELIO wordmark' });
    SPECS.push({ k: 'wordmark', el: panel, letters, at: o.at, cycle: o.cycle || 3.6, blur: 1.5 * k });
    return panel;
  }
  function wordmarkRun(t, s) {
    const f = clamp((t - s.at) / s.cycle);
    const q = f < 0.2 ? 0 : f < 0.4 ? C.ease.inOut((f - 0.2) / 0.2) : f < 0.6 ? 1 : f < 0.75 ? 1 - C.ease.inOut((f - 0.6) / 0.15) : 0;
    for (const L of s.letters) if (L.vanish) C.put(L.e, { css: { width: `${(L.w * (1 - q)).toFixed(2)}px` }, o: 1 - q, filter: q > 0.001 ? `blur(${(s.blur * q).toFixed(2)}px)` : undefined });
  }

  // CUTAWAY BG — the opaque full-frame background of a full-screen cutaway. Every slam jolts each scene root by ±10 px,
  // so a background the exact size of the frame shows the footage at the edges on every hit: this one is 60 px larger
  // on every side and the root stops clipping it.
  function cutawayBg(root, color = '#000') { root.style.overflow = 'visible'; return C.el('div', { class: 'abs', style: `left:-60px;top:-60px;width:${C.W + 120}px;height:${C.H + 120}px;background:${color}` }, root); }

  // one before-hook animates the camera and every declared element, every frame (pure function of t)
  C.hooks.before.push((t) => {
    cameraRun(t);
    for (const s of SPECS) {
      if (s.k === 'slam') C.put(s.el, slamProps(t, s));
      else if (s.k === 'cut') C.put(s.el, cutProps(t, s));
      else if (s.k === 'pop') C.put(s.el, popProps(t, s));
      else if (s.k === 'type') C.put(s.el, typeProps(t, s));
      else if (s.k === 'draw') C.put(s.el, drawProps(t, s));
      else if (s.k === 'odo') odoRun(t, s);
      else if (s.k === 'cursor') cursorRun(t, s);
      else if (s.k === 'wordmark') wordmarkRun(t, s);
    }
  });

  // ------------------------------------------------------------------ soft card (kept for the rare calm moment)
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

  // Subtitles are not drawn here: they are burned onto the rendered film with libass (reference/SUBTITLES.md).

  window.OV = { specs: SPECS, settleOn, slide, putSlide, slam, cutIn, pop, typeOn, draw, odometer, cursor, browser, wordmark, cutawayBg, layout, layoutAt, punch, impact, cue, T95, bg: null, cut: null };
  // keep a handle on the background video (and the cut-out speaker, with { matte }) so the kit (layout, punch) and films
  // can animate it
  const orig = C.videoBG;
  if (orig) C.videoBG = (src, o) => { const r = orig(src, o); C.reg(r.el); window.OV.bg = r.el; window.OV.cut = r.cut; return r; };
})();
