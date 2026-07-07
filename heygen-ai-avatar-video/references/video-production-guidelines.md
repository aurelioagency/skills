# Video Production Guidelines

These rules capture generic production taste and QA decisions established across prior avatar video productions. They apply to future HyperFrames/talking-head edits unless the user explicitly overrides them.

## Source Of Truth

- Edit the authored source file, usually `source/build-composition.mjs`. Do not manually edit generated `public/index.html` unless the project has no generator.
- Keep durable production rules in this file. Do not bury reusable preferences only in chat.
- After meaningful design corrections, update this guideline so the same mistake is not repeated in later passes.
- Rendered outputs are deliverables, not source. Always preserve the generator and local assets that produced the render.
- Keep each video job in one global project folder whenever possible. Put source manifests, processed audio, avatar clips, generated composition, snapshots, and final MP4s under that one folder instead of scattering per-step outputs across unrelated folders.
- Put authored project source under `source/`: `source/script.md` and `source/build-composition.mjs`. Do not keep root `script.md` or root `build-composition.mjs` in new projects, do not create `assets/source/`, and record any original external script path in `manifests/project.json`.
- Put project control JSON under `manifests/`: `project.json`, `segments.json`, `audio-request.json`, `audio-meta.json`, `heygen-jobs.json`, `paid-assets.json`, and `assemble.json`. Do not duplicate the fixed folder contract inside those files or at the project root.
- Put read-only gate reports under `manifests/audits/`, including plan audits, animation QA notes, and final render verification summaries.
- Do not create a new top-level folder for every script segment unless the segment has independent paid/provider state that must be preserved. Prefer `assets/voice/`, `assets/avatar/`, `renders/segments/`, `renders/final/`, and `snapshots/` under the same project root. Reuse bundled skill scripts instead of copying a `tools/` folder into every project.
- Keep generated audio and transcripts canonical in `assets/voice/`. Do not duplicate them into `public/assets/voice/`; browser compositions in `public/` should reference them with paths such as `../assets/voice/<segment-id>.wav`.
- Put downloaded background music under `assets/music/` and record source/license metadata in `manifests/assemble.json`.
- If a helper tool needs temporary frames, audio mixes, or debug images, write them under the project root and clean them unless they are required for audit or reuse.

## Script-To-Video Workflow

- Treat the user-provided script file as the story source, but not every text node in that file is visible copy.
- Parse scripts into explicit sections: avatar openings, shared animated middle, shared avatar outro, and any provider-specific TTS text.
- Preserve display text and TTS text separately when pronunciation-safe wording, pauses, or SSML breaks are needed.
- Keep a manifest that maps each logical segment id to:
  - display text;
  - TTS text sent to the provider;
  - generated audio path;
  - transcript path;
  - duration;
  - avatar source path, when applicable;
  - render output path.
- Use stable segment ids such as `opening1`, `opening2`, `body1`, `body2`, `outro`. Do not use section headings such as `question hook` or internal titles as user-visible captions.
- When a script has multiple openings and shared middle/outro content, generate the shared audio, captions, and animation once. Build variants by choosing the opening segment plus the shared middle and outro.
- For multiple HeyGen avatar segments, default to a provider job queue: write `manifests/heygen-jobs.json`, cap work by `maxConcurrency`, and delegate one ready job per worker. This is the normal workflow, not a separate opt-in, unless the user explicitly disables delegation. Workers must claim/freeze/fail jobs through a job-state helper instead of hand-editing the queue.
- In the modular script-to-video workflow, paid HeyGen jobs are only for lip-sync intro/outro segments such as `opening*`, `intro*`, `outro`, or `closing*`. Never create a paid `*_full`, `whole`, `combined`, or `deliverable-avatar-segment` that merges opening + body + outro.
- The body/middle belongs to local HyperFrames animation, even when the final deliverable is called an "avatar video." A correct pre-paid summary should read like: `HeyGen jobs = opening3, outro; local animation = body1..bodyN; expected paid seconds ~= intro + outro only`.
- Before paid HeyGen work, run a read-only plan audit or spawn a read-only Plan Auditor subagent. This gate must pass before any worker can claim or submit provider jobs.

## ElevenLabs Audio And Caption Generation

- Generate TTS from the final validated `ttsText`, not from terminal-rendered text or partially parsed Markdown.
- Before sending text to ElevenLabs, run a UTF-8/mojibake preflight against the exact JSON/text payload and fail fast on suspicious sequences.
- If PowerShell shows mojibake but a Node or Python UTF-8 parser does not, treat the terminal output as untrusted display corruption.
- Use small punctuation/SSML breaks at phrase boundaries to add breathing room. Keep them short and sparse.
- After ElevenLabs generation, transcribe the actual generated audio in Spanish and compare it to the intended spoken text.
- Do not accept audio where technical terms or user-approved wording changed meaning, such as `1 skill` becoming `una habilidad`, unless the user explicitly approves the translation.
- If only the audio is wrong and the avatar video is already paid/generated, repair the audio and captions locally when possible. Do not regenerate the paid avatar clip unless the user explicitly chooses that path.
- When replacing audio on an existing avatar clip, either use the exact source audio that generated the lip sync, or accept that lip sync can drift. Do not silently mix a new TTS take under an old lip-sync video and call it fixed.
- For intro/avatar sections, captions must be derived from the audio/transcript that matches the visible lip sync source.

## HeyGen Avatar Generation And Reuse

- Create paid HeyGen avatar clips only for sections that truly need talking-head lip sync, usually the openings and outro.
- Treat body/middle/full-script HeyGen jobs as a production blocker. A 40-60 second avatar job from a script means the segment plan is wrong unless the user explicitly requested and approved a direct full-avatar exception.
- For multiple avatar clips, plan `manifests/heygen-jobs.json` first and process ready jobs concurrently in subagents or workers up to the manifest's `maxConcurrency`. The main thread should coordinate and verify rather than babysit every provider wait.
- Download and freeze every completed HeyGen output into the project assets folder immediately, with a manifest recording the remote id/session, local path, source audio, source text, and cost-sensitive status.
- Never delete, cancel, overwrite, or discard paid HeyGen generations unless the user explicitly asks for that exact deletion or cancellation.
- If a local avatar clip is missing, first search local manifests and provider records for the existing output/download URL. Do not submit a new paid generation as the first fix.
- If a HeyGen clip is visually correct but the final render shows a freeze, desync, or caption drift, debug the local renderer/assembly first. Do not assume the paid source is bad.
- For multiple variants with the same outro, generate or freeze the outro once and reuse the same local source in all variant assemblies.

## Segment Rendering And Assembly

- Avoid full re-renders when only one segment changes and the project structure supports segment replacement.
- Use the bundled project orchestrator for normal segment renders so `public/index.html` and storyboard inputs are prepared from manifests instead of hand-edited before each render.
- Prefer a modular render plan:
  - render or freeze avatar intro clips separately;
  - render the shared animated middle as its own segment;
  - render or freeze the shared outro separately;
  - assemble final variants by concatenating intro + middle + outro with verified audio and captions.
- If the current project is monolithic, full re-rendering may be necessary, but note it as a tooling limitation and do not treat it as the desired workflow.
- Build future generators so changed segments can be re-rendered independently and assembled without recapturing unchanged frames.
- When replacing only audio under an unchanged video segment, remux/replace audio rather than recapturing all visual frames.
- Apply short-social pacing such as `1.07x` only during final assembly, after reusable segment renders and paid provider outputs are frozen.
- Add lofi background music only as final assembly post-processing from a local file under `assets/music/`. Use about `-24 dB` as the starting mix for narration/avatar videos and lower it if speech clarity suffers.
- After segment assembly, verify the complete MP4, not only individual pieces: duration, resolution, video stream, audio stream, and a visual frame near each splice boundary.
- Keep rendered final videos and the processed assets that produced them in the same global project folder so later agents can inspect or replace one segment without rediscovering the whole run.

## Splice Pacing And Silence Budget

- Silence budget per segment audio: head silence <= 0.45s, tail silence <= 0.45s, and total pause at each splice (tail of the previous segment + head of the next segment) between 0.4s and 0.9s — comparable to the natural pauses between spoken phrases (~0.5-0.83s in measured productions).
- TTS output and user-provided audio usually arrive with recorded silence at the head and/or tail. User-provided audio is NOT clean audio: always measure it with ffmpeg silencedetect (noise threshold around `-35dB`) before rendering; never assume a file starts at the voice or ends right after it.
- Run the bundled `audit-splice-silence.mjs` gate over ALL segment audio after transcription and before any segment render. It measures head/tail silence per segment, honors manifest `durationSec` trims as the effective segment end, and projects the dead-air pause at every assembly splice per variant. Any budget violation is a hard stop before rendering.
- Head trim recipe: cut the head of the audio leaving ~0.25-0.35s before the first voiced sound, preserve the untouched original next to it as `<id>-original.wav`, and shift ALL word-level transcript timestamps by the same offset (clamp to >= 0) so captions stay in sync.
- Tail trim recipe: do not edit the source file. Cut the segment's effective duration to last word +0.3s by setting `durationSec` in `manifests/audio-meta.json`, so render/assembly stops before the mute tail.
- After trims, re-render only the affected segments and re-assemble only the affected variants.
- Final verification: run silencedetect over each final MP4 and confirm no splice pause exceeds ~0.9s. A splice that sounds like a natural phrase pause passes; a noticeable vacuum of voice at a segment boundary does not, even when every stream and duration check passes.

## Background Music

- Prefer Pixabay Music for lofi hip hop beds when the user has not supplied a track. The agent must search, select, download, and freeze the music itself; do not ask the user to download it.
- Choose instrumental lofi hip hop without vocals, harsh transients, or heavy bass. The track should support speech and loop cleanly if the final video is longer than the track.
- Verify the track page and license terms at download time. Avoid tracks with NonCommercial, no-derivatives, or unclear reuse rights when the video could be commercial or monetized.
- Freeze the chosen MP3/WAV into `assets/music/` and update `manifests/assemble.json` with source URL, title, artist, license, attribution requirement, download date, `speed: 1.07`, and `volumeDb: -24`.

## Reusable Local Tools

- Prefer durable helper scripts for repeated or fragile operations:
  - TTS payload preflight and ElevenLabs generation;
  - audio transcription and transcript comparison;
  - audio duration probing and padding/tempo repair;
  - HeyGen asset download/freezing;
  - HyperFrames snapshot capture at exact timestamps;
  - overflow/layout inspection;
  - local render with seek-safe video frame capture;
  - final stream/duration verification.
- Keep reusable tools parameterized by project root, segment id, provider ids, and output paths. Avoid hardcoding a one-off opening or script unless the tool is explicitly a repair script for that job.
- When a one-off repair script proves useful, promote the behavior into a generic tool before creating the next similar video.
- Tool output should update manifests as well as files, so the next agent can tell which audio, transcript, avatar clip, and render belong together.

## Research And Real Assets

- Before designing a visual about a specific tool, skill, product, company, repository, person, venue, or web page, research the real subject first.
- For public subjects, browse/search the internet before choosing visuals, screenshots, or logos unless the user forbids browsing or has already supplied the authoritative asset.
- Prefer official or primary sources for screenshots and claims:
  - official website or docs;
  - GitHub repository page when the video references a repo or skill;
  - user-provided source page when they give a specific URL;
  - provided local media or assets when they supply files.
- Use real footage or real screenshots when the subject is concrete. Do not invent generic abstract visuals when a real page, repo, product UI, or logo exists.
- When showing a web page, capture the actual relevant page and frame it so the referenced text is readable.
- When showing a source screenshot, include enough surrounding context for viewers to understand it is real, but highlight only the target area.
- If a specific URL is given, use that URL rather than a nearby or similar page.
- Keep source URLs or asset origins visible in the composition when useful, especially for "real source" moments.

## Logos And Brand Assets

- Never create, redraw, approximate, or hallucinate a logo for an enterprise, product, AI model, or public brand.
- Always use a real logo asset:
  - first choice: user-provided PNG/SVG;
  - second choice: official brand/media kit;
  - third choice: a reputable source with the actual transparent PNG/SVG.
- Freeze real logos into the project assets folder before rendering.
- Verify that the asset actually matches the brand. For example, do not use a generic OpenAI-looking mark when the user supplied a real ChatGPT/OpenAI PNG.
- If the user intentionally asks for a provocative mismatch, such as a Gemini icon next to the word `Claude`, make the mismatch intentional, brief, and controlled. Do not let it look like an accidental production error across the whole scene.
- For logo scenes, use simple pop/fade motion. The logo itself should remain recognizable and unobscured.

## Caption Timing

- Captions must follow the actual spoken audio, not the earlier script if the audio has been replaced.
- When audio is replaced, verify synchronization. If the wording or timing changed materially, regenerate or correct word timings before final render.
- Use word-level timestamps when available.
- Words should appear at the same time they are spoken.
- Avoid captions that lag, appear too early, or remain long after the phrase is gone.
- Correct obvious transcript display errors without changing timing, such as:
  - dropped leading letters in proper nouns (ASR often truncates names);
  - wrong pluralization like `ochentas` -> `ochenta`;
  - project-specific names, brand names, and technical terms the user listed in the project vocabulary.
- Do not show redundant subtitles that repeat a graphic already communicating the same point, such as an unnecessary `80 preguntas` subtitle under an `80 preguntas` card.

## TTS Encoding And Spanish Audio QA

- Treat text-to-speech input as a render-blocking source file, not as throwaway glue.
- Before sending any transcript, script, caption text, or pronunciation-safe `ttsText` to ElevenLabs or another TTS provider, inspect the exact UTF-8 payload with a UTF-8 parser such as Node or Python opened with `encoding="utf-8"`.
- The preflight must inspect the final text bytes/payload that will be sent to the provider, not only the source Markdown as displayed in a terminal.
- Block the run if the payload contains mojibake or replacement characters such as `\u00C3`, `\u00C2`, `\u00E2`, `\uFFFD`, or visible strings like `podÃ©s`, `sÃ­`, `dÃ­a`, `Â¿`, or `ï¿½`. Fix the source text or bridge code before generating audio.
- If PowerShell or another terminal displays mojibake, re-check with Node or Python before deciding whether the file or only the terminal display is corrupt.
- On Windows, every Python bridge that reads a temporary TTS text file must pass `encoding="utf-8"` explicitly. Do not rely on the system default encoding.
- If display captions and TTS text differ for pronunciation, keep both versions explicit in the project source and document why. The spoken version must still be natural Spanish unless the word is a real product name or user-approved term.
- Before TTS, review the Spanish wording for accidental English filler such as `skill`, `lite`, `full`, or `logs` unless those words are intentionally part of the script.
- Use punctuation, paragraph breaks, or short SSML break tags where the selected TTS model supports them to add natural phrase-end pauses and breathing space. Avoid stacking many break tags because it can destabilize speech.
- After TTS, transcribe the generated audio in the intended language and compare it against the intended spoken text before creating HeyGen avatar clips.
- Listen to any phrase where the transcript shows drift, especially accented words, voseo forms, brand names, and technical terms.
- If a word is mispronounced or transcribed as another word, regenerate before rendering. Use a pronunciation dictionary, phonetic spelling, or a neutral Spanish synonym rather than accepting mismatched captions.
- Do not render or return the final MP4 until the audio has passed: UTF-8 payload check, Spanish transcript check, spot-listen check, and duration/stream verification.

## Script Metadata Is Not Caption Copy

- Markdown headings, frontmatter, file names, source paths, variant labels, hook names, metadata fields, and planning notes are not captions or animation titles unless the user explicitly asks to show them.
- Do not render metadata such as `OpenAI skill`, `Pregunta hook`, `question hook`, `short-format intro hook`, `Status: corrected script`, file titles, or section labels as visible captions, top labels, lower thirds, or animation card text.
- Visible spoken captions must come from the verified spoken script/audio transcript, not from script headings or file metadata.
- Animation scene labels and card titles must be intentionally authored from the video message. They may be derived from the script meaning, but must not be copied from internal metadata just because it is present in the source file.
- Before rendering, run a text inventory over the generated HTML or composition source and check for accidental metadata leakage. If internal labels appear on screen, remove or replace them before snapshotting.

## Caption Placement And Typography

- Captions must never be tiny. If the viewer is on a phone, the text still needs to be readable at normal viewing distance.
- Avatar/talking-head sections:
  - captions should be centered in the middle of the screen unless the user asks otherwise;
  - use text only, without a large card around it;
  - use large type, roughly comparable to the avatar head/hand scale;
  - show words one after another;
  - use no more than three words per line;
  - use no more than two lines at once;
  - keep the phrase visually centered, not just technically positioned.
- Graphic/full-screen card sections:
  - captions usually belong in the bottom rail;
  - keep them large enough to read;
  - prevent overlap with cards, titles, screenshots, and callouts.
- Font choice should fit the piece, but readability wins. In this project, Inter became the preferred caption font.
- Use emphasis by color, weight, or motion, not by inserting unnatural spaces between words.
- Do not add artificial horizontal gaps inside a phrase. Number-word pairs such as `80 preguntas` must read as one phrase.
- Avoid negative letter spacing and viewport-scaled font sizes. Use stable sizes and responsive constraints instead.

## Word Animation

- Word-by-word captions should feel alive but not distracting.
- Newly appearing words can use a subtle tremble or micro-jitter.
- The tremble must be transform-only. It must not cause layout shifts or push other words around.
- Existing words should stay stable while the new word appears.
- Space words evenly side by side. No jumping gaps.

## Cards And Space

- Do not make a card feel bigger by adding empty internal space.
- Cards should hug their content. Internal padding should be tight and intentional.
- If a scene needs to use more of the screen, prefer:
  - larger text;
  - stronger hierarchy;
  - spacing between separate cards;
  - a larger group layout;
  - rebalancing the whole group vertically.
- Do not create a tall card with a large blank area under the last line.
- If the user asks for the information to take 80% of the screen, the information group can use 80% of the screen, but individual cards still need to hug their content.
- Empty space should live around cards, not inside them.
- If extra vertical space exists, distribute it above and below the group. Do not dump all spare space below the content.
- Never put a box over a title. Preserve clear title-safe space.
- Do not nest UI cards inside decorative cards unless the design explicitly requires it.

## Centering And Alignment

- Center the actual visible content, not just the parent container.
- If a highlight box is meant to call out text, center the highlight on the text itself.
- Highlight boxes should not include irrelevant black/empty overflow.
- A screenshot highlight should sit slightly around the target text with balanced padding.
- Avoid "almost centered" placements. If the user marks it as off-center, adjust by the actual target text bounds, not by eyeballing the whole screenshot.
- Large overlay cards should align with the visual area the user marked, but their content should still be internally tight.
- Top labels may become larger and full-width if the rest of the scene needs stronger structure, but they should remain at the top.

## Screenshots And Source Callouts

- Use real screenshots when referencing source material, such as a GitHub `SKILL.md` page.
- The website screenshot should appear exactly when the audio introduces it.
- Avoid awkward zooms on a source screenshot unless they improve readability. A bad zoom is worse than a stable, legible frame.
- For GitHub/source pages:
  - keep the page recognizable;
  - keep the repo/path visible if it matters;
  - highlight the exact row or text being discussed;
  - do not let highlight boxes drift off the target line.
- When extracting text from a source, present the original in a readable code/source card and the translation as a separate card or section.

## Scene Composition

- The first viewport of each scene should communicate the main point immediately.
- Motion should support comprehension. Do not add movement that makes the source harder to inspect.
- For avatar intro sections, use a short face-focused zoom at the start if it adds energy, then return to the normal frame.
- Preferred intro zoom pattern: zoom in up to about 30% (`scale: 1.3`) during the first second, then smoothly zoom back to `scale: 1`. Adjust the transform origin to the face, not the center of the frame.
- For return-to-avatar moments, full-screen avatar should feel clean and not crowded.
- Persistent CTAs such as `Link en los comentarios` can stay visible through the end, but must not collide with spoken captions or important face/hand areas.
- If a CTA arrow points down, it must be visibly an arrow, not just a vertical line. Use a real shape if a font glyph clips.
- For comment prompts, a chat bubble emoji/icon can pop briefly when the audio asks viewers to comment.

## End-Of-Video Comment Link CTA

- When the video needs to drive people to comments, add an end-of-video bottom CTA unless the user asks not to.
- Use the Spanish copy `Link en los comentarios`.
- Show it from the moment the avatar/agent returns for the final section through the end of the video, unless it collides with required captions or key visual content.
- Place the CTA at the bottom of the frame, centered horizontally.
- Use text only, not a large card, unless contrast requires a very subtle shadow or glow.
- Add a down arrow under the text pointing below the video.
- Build the arrow as a real visual shape when possible: thick stem plus visible triangular head. Do not rely on a font glyph if it clips or turns into only a vertical line.
- The arrow should be very large when the user asks for a strong comment/link cue.
- Add a chat/comment bubble emoji or icon during the spoken comment prompt, such as when the speaker says viewers should leave something in the comments.
- The comment emoji should pop in briefly and fade out; it should support the CTA, not become the main subject.
- Place the comment emoji away from the face and captions, usually near the side of the frame or near the CTA/card that asks for comments.
- Animate the CTA from below the screen:
  - text rises in first;
  - arrow rises in just after the text;
  - arrow may gently bounce after landing.
- Check the CTA in preview frames near entrance and final hold. It must not cover the avatar face, hands, spoken captions, or primary card text.

### Reference Implementation Used In This Video

Use this pattern when another video needs the same bottom comment/link CTA. It uses the same sizing, color logic, Inter font, shaped arrow, and GSAP motion from this project. Replace the timestamps with the new video's final-avatar/comment-prompt timings.

```css
.comment-emoji {
  position: absolute;
  right: 98px;
  top: 560px;
  width: 148px;
  height: 148px;
  display: grid;
  place-items: center;
  border-radius: 44px;
  background: rgba(8, 9, 8, 0.58);
  border: 1px solid rgba(245, 241, 230, 0.22);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(14px);
  font-family: "Inter", Arial, sans-serif;
  font-size: 92px;
  line-height: 1;
  opacity: 0;
}

#link-comment-cta {
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 34px;
  z-index: 28;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  color: var(--ink);
  opacity: 1;
  pointer-events: none;
  text-align: center;
  font-family: "Inter", Arial, sans-serif;
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.72));
}

#link-comment-cta .link-text {
  font-size: 76px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
  opacity: 0;
}

#link-comment-cta .link-arrow {
  color: var(--accent-2);
  position: relative;
  width: 140px;
  height: 260px;
  font-size: 0;
  line-height: 0;
  opacity: 0;
}

#link-comment-cta .link-arrow::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  width: 28px;
  height: 172px;
  border-radius: 999px;
  background: var(--accent-2);
  transform: translateX(-50%);
}

#link-comment-cta .link-arrow::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 0;
  border-left: 66px solid transparent;
  border-right: 66px solid transparent;
  border-top: 88px solid var(--accent-2);
  transform: translateX(-50%);
}
```

```html
<!-- Put the emoji in the scene where the speaker asks for comments. -->
<div class="comment-emoji">&#128172;</div>

<!-- Put this as its own overlay so it can stay visible through the end. -->
<div
  id="link-comment-cta"
  class="clip"
  data-layout-allow-occlusion
  data-start="30.279"
  data-duration="${(DURATION - 30.279).toFixed(4)}"
  data-track-index="24"
>
  <div class="link-text">Link en los comentarios</div>
  <div class="link-arrow" aria-hidden="true"></div>
</div>
```

```js
// Bottom link CTA: text comes from below first, then the arrow.
tl.set("#link-comment-cta", { opacity: 1 }, 30.279);
tl.fromTo(
  "#link-comment-cta .link-text",
  { y: 180, opacity: 0, scale: 0.96 },
  { y: 0, opacity: 1, scale: 1, duration: 0.52, ease: "power3.out" },
  30.42,
);
tl.fromTo(
  "#link-comment-cta .link-arrow",
  { y: 260, opacity: 0, scale: 0.9 },
  { y: 0, opacity: 1, scale: 1, duration: 0.46, ease: "back.out(1.45)" },
  30.78,
);
tl.to(
  "#link-comment-cta .link-arrow",
  { y: 14, duration: 0.58, repeat: 17, yoyo: true, ease: "sine.inOut" },
  31.28,
);

// Comment emoji: brief pop during the spoken comment prompt.
tl.fromTo(
  ".comment-emoji",
  { y: 32, scale: 0.72, rotation: -6, opacity: 0 },
  { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.34, ease: "back.out(1.7)" },
  36.62,
);
tl.to(
  ".comment-emoji",
  { y: -10, rotation: 2.5, duration: 0.62, yoyo: true, repeat: 4, ease: "sine.inOut" },
  36.96,
);
tl.to(".comment-emoji", { scale: 0.88, opacity: 0, duration: 0.32, ease: "power2.in" }, 39.48);
```

## Text And Copy

- Spanish copy should sound natural:
  - use `Link en los comentarios`, not awkward literal phrasing;
  - use the short natural form of brand/product names the way the user writes them;
  - use `ochenta preguntas`, not `ochentas preguntas`.
- Keep on-screen text short.
- Avoid explaining the UI or animation in visible text.
- If a card title is large, supporting text must not look like a footnote unless it is intentionally secondary.
- If a label is used, keep it functional and compact.

## Motion And Transitions

- Use transitions to clarify scene changes, not to show off.
- For the first-second avatar zoom, animate the video element or video wrapper with transform scale only. Do not crop the face or push captions out of their intended position.
- Reference GSAP pattern for a 30% intro zoom:

```js
// Face-focused intro zoom. Tune transformOrigin per source footage.
tl.set("#bg-video", { scale: 1, transformOrigin: "51% 36%" }, 0);
tl.to("#bg-video", { scale: 1.3, duration: 0.78, ease: "power2.out" }, 0.08);
tl.to("#bg-video", { scale: 1, duration: 1.22, ease: "power3.inOut" }, 0.86);
```

- Logo and icon appearances should be short pop/fade animations.
- Large CTA elements can enter from below when they refer to comments or links below the video.
- Sequence CTA entrances:
  - text first;
  - arrow second;
  - arrow can bounce gently after it appears.
- Do not animate layout properties when transform/opacity can do the job.
- Avoid motion that causes text to shift unpredictably or creates new spacing mistakes.

## Review Before Returning

- Always inspect preview screenshots before telling the user a visual change is done.
- For modular avatar-video projects, use read-only verification agents by default: Plan Auditor before paid provider work, Animation QA Auditor before final assembly, and Final Render Auditor before final answer. "Read-only" means no provider calls and no edits to source/media/render/assembly files; auditors may only write audit reports under `manifests/audits/`. If subagents are unavailable, run the same checks locally and save reports under `manifests/audits/`.
- Do not rely only on code or render logs for design validation.
- Use targeted snapshots at the exact timestamps affected by the change.
- Open at least one full-resolution frame when spacing, alignment, typography, or cropping is the issue.
- Preview screenshots are temporary QA artifacts. Production agents may delete temporary screenshots/contact sheets after review unless the user explicitly asks to keep them or they are needed as deliverables. Read-only auditors must not delete them.
- Check every preview against the user's last marked screenshot, not against a vague idea of "better."
- Look specifically for:
  - tiny captions;
  - artificial gaps between words or numbers;
  - cards with empty internal space;
  - highlights not centered on text;
  - boxes covering titles;
  - text overflow or clipping;
  - captions overlapping cards or faces;
  - logos that are fake or wrong;
  - arrows/icons with clipped or unreadable shapes.
- If a preview reveals a problem, fix it before rendering the full video.

## Render And Verification

- Regenerate the composition after source edits before snapshotting or rendering.
- Snapshot first, render second.
- After rendering, verify:
  - file exists;
  - duration is expected;
  - resolution is expected;
  - video and audio streams are present;
  - output path is clear.
- Report the final rendered file path and the basic metadata.
- Mention any remaining warnings only if they affect the user's requested quality or future maintainability.

## Paid Remote Asset Handling

- I will not delete any paid generation again. Future agents must treat this as a hard production rule, not a preference.
- Never delete, cancel, overwrite, or discard paid remote generations from HeyGen, ElevenLabs, Floyo, or similar providers unless the user explicitly asks for that exact deletion/cancellation.
- If a paid generation was started accidentally, preserve any generated output and ask before deleting or replacing it.
- Prefer downloading and freezing paid outputs into the project assets folder before making further edits.
- When a paid output is missing locally, first check the provider API/listing and local run manifests for an existing download URL before considering a new paid run.
- If the provider reports the paid output as deleted or unavailable, state that clearly and ask before submitting a replacement generation.

## Local Project Notes

- Current source generator: `source/build-composition.mjs` for new projects; root `build-composition.mjs` is legacy-only.
- Generated composition: `public/index.html`.
- Local assets live under `public/assets/`.
- Captions are derived from the source captions JSON, with display fixes applied in the generator.
- Keep this file updated when the user corrects a recurring visual rule.
