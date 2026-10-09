# Motion Studio Rules

Pegar este bloque completo (traducido o en inglés, da igual — Opus lo entiende en ambos) al arrancar cualquier proyecto nuevo de `opus-motion-studio`, antes del primer prompt de contenido. Son reglas base, no se negocian por proyecto.

```
MOTION STUDIO RULES — apply these to every scene, every render, every revision.

RENDER CONTRACT
- The project must render end to end with a single command, with no manual steps in between. If you write a frame-by-frame exporter, make it resumable: if it dies at frame 340 of 900, re-running must pick up from frame 340, not start over.
- Hardcode the frame rate and total duration at the top of the project in one place. Every timing calculation in the code must derive from that constant — never hardcode a frame number or a millisecond offset separately from it.
- Keep every scene's render deterministic: no randomness without a fixed seed. The same code must produce the same frames every time, so a re-render for a fix doesn't silently change unrelated scenes.
- Render at 2x the final resolution when the project uses thin strokes, small text, or fine grain, then downscale in the ffmpeg pass. Thin lines alias badly at 1x and look cheap.
- Log progress every N frames (not every frame) so a long render doesn't flood the terminal, but a stall is still visible within a few seconds.
- Before the final encode, verify frame count matches the expected duration × fps exactly. A silent off-by-one here is the most common cause of a render that "finishes" but is one frame short or has a stutter at the loop point.

THE LOOK
- Never center everything. A composition where every element sits dead-center with symmetric margins is the single fastest way to look like generic AI output. Use an actual grid with intentional asymmetry — rule of thirds, off-center focal points, elements that bleed off-frame.
- Ban the default gradient. If a gradient is used, it must come from the brand's actual palette and have a reason (a light source, a depth cue, a brand asset) — never a decorative purple-to-blue wash with no source.
- Every element on screen must earn its presence. If you can delete a decorative shape, line, or particle without losing meaning, delete it. Generic AI video overcompensates with ambient motion that says nothing.
- Vary shot length. A 15-second video with 6-8 shots means most shots are 1.5-3 seconds; a few beats can run longer for emphasis, but no two consecutive shots should run the same length — that reads as mechanical.
- Text on screen must be set in the brand's real typeface (or a close, deliberately chosen substitute) at a size and weight that could appear in that brand's actual marketing — never a default system sans in all caps as a placeholder that ships to final.
- If you don't have the brand's real assets (logo, colors, screenshots) yet, say so and ask before generating placeholder versions that might ship by mistake.

SOUND
- Silence is a valid choice, but it must be a choice, not a default because no one asked. If the brief doesn't mention sound, ask whether this needs a soundtrack, UI sound effects, both, or neither before building the visual-only version.
- When sound is in scope, build it on the same timeline as the picture, not as an afterthought bolted on after the visual render is "done" — see the beat-sync prompt for how to do this in code.
- Keep sound effects functional: a sound should mark something happening on screen (a tap, a transition, a reveal), not just add ambience. If a sound effect doesn't correspond to a specific visual event, cut it.
- Mix levels so dialogue or voiceover (if present) always sits above music and SFX — never let a whoosh or a bass hit mask spoken words.

FEEDBACK LOOP
- After every render, before calling it final, run at least one pass of the critique loop (see references/prompts.md#7) — score the result honestly against this same rules file, not just against "does it look nice."
- When iterating on feedback, change only what was flagged. Re-rendering a scene that already scored well risks introducing a new problem to fix a problem that didn't exist.
- Keep a short changelog per round (what was wrong, what changed) inside the project folder so a later session — or a different person — can see why the current version looks the way it does, instead of re-litigating settled decisions.
- If a specific fix fails twice in a row, stop and report it instead of attempting a third blind variation. Two failed attempts at the same fix usually means the actual problem is somewhere else (timing constant, asset path, wrong layer order) — find that before trying a third visual tweak.
```
