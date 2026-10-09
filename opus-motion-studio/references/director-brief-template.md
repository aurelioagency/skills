# Director's Brief — proyectos ambiciosos

Usar esta plantilla cuando el proyecto tiene personajes, múltiples escenas, o una ambición tipo "corto animado" en vez de una pieza de marketing simple de 15-20 segundos. Avisar antes al usuario: este tipo de pieza suele necesitar muchas rondas de generación y corrección — el ejemplo real que inspiró esta estructura tomó 163 llamadas al modelo y casi 7 horas de trabajo, no fue de un solo intento. Conviene dejarlo correr en background con el critique loop activo en vez de esperar un resultado final de una sola vez.

Copiar el bloque, completar cada sección con el usuario antes de enviarlo, y nunca dejar un placeholder sin completar (mejor preguntar que inventar).

```
You are the director, animator, sound designer, and render engineer for [PROJECT NAME], a film made entirely in code.

## Film in one line
[One sentence: what this film is and what it needs to make the viewer feel or understand.]

## References
[List every reference: videos, images, links. For each one, say what specifically to take from it — grammar, palette, a single transition type — never "copy this video."]

## Tools and keys
[What's available in this session: which skills/connectors are loaded (e.g. Remotion, HyperFrames, a specific API), what APIs have keys configured, what's explicitly NOT available.]

## Character bible
[For each character: multiple reference angles/perspectives, proportions, a list of emotions/expressions this character needs to perform in this film. If a character doesn't exist as a visual asset yet, say so here and ask before generating one from scratch.]

## Beat sheet
[The scene-by-scene breakdown: what happens, in what order, roughly how long each beat runs. This is the skeleton the beat grid (references/prompts.md#5) will later fill in with exact timings.]

## Text on screen
[Every line of on-screen text that must appear, verbatim, and roughly when. If copy isn't finalized, mark it as draft and say so.]

## Workflow gates
[The points in this process where you must stop and show me a result before continuing — e.g. after the beat grid, after the first full render, after any character's first appearance.]

## Critique loop
Apply the critique loop (references/prompts.md#7) after every render in this project, with threshold [DEFAULT 7] and max [DEFAULT 3] rounds per gate, scored specifically against this brief — not just against the Motion Studio Rules.

## Deliverables
[Exact final formats needed: resolution(s), aspect ratio(s), with/without sound, any cut-down versions (e.g. a 6-second teaser from the same assets).]
```

## Notas de uso

- Esta plantilla es deliberadamente larga. No completarla de memoria con el usuario esperando — armarla junto a él, sección por sección, y mostrar el bloque final completo antes de enviarlo a Opus.
- Si en algún punto el usuario no tiene un dato (ej. no hay bible de personaje todavía), no inventarlo: marcar esa sección como pendiente y seguir, o pausar el proceso hasta tenerlo, según lo que el usuario prefiera.
- Esta plantilla no reemplaza las Motion Studio Rules (`references/motion-studio-rules.md`) — van las dos juntas, las rules primero en la conversación, y este brief después.
