# Render, video, caption y entrega

Todo lo que pasa despues de que la copy esta aprobada: como se renderiza el paquete, la
carpeta de entrega, el Short vertical, la caption, y **la revision visual, que es la
parte que ningun script hace**.

La regla que ordena esta ultima: antes de decir una sola palabra sobre como quedo un
carrusel, hay que abrir cada PNG a tamano real y mirarlo. El contact sheet es para el
ritmo de la serie; la placa a tamano real es para todo lo demas.

## Rendering

Use a project package with editable source and PNG exports.

Recommended package structure:

```text
social-carousels/<slug>/
  index.html
  styles.css
  slide-data.js
  carousel-brief.md
  manifest.json
  assets/
  claude-piloto-automatico/                  # la carpeta de entrega
```

### The delivery folder

One folder per carousel, named so the user can drag it straight into Drive without renaming anything:

```text
<tema-en-kebab-case>
```

**The topic and nothing else** — no date prefix, no platform or size suffix. It is the same string as the package slug, so the delivery folder repeats its parent's name; that is expected, not a mistake.

Both extras were dropped because they cost more than they gave:

- **No date.** The delivery date is already in `manifest.json`, and the one date worth having on the folder is the *publication* date, which `post-for-me` stamps on when it actually publishes (`<folder>` → `YYYY-MM-DD-<folder>_POST`). With a date already in the name that rename produced two of them.
- **No `-ig`.** There is only one carousel size and it goes to Instagram and TikTok alike, so the suffix labelled nothing and read as a restriction that does not exist.

Inside it, **only three kinds of file**: the ordered PNGs (`01.png`, `02.png`, …), `caption.txt` and `short.mp4`. Nothing else ever goes in there — no report, no contact sheet, no working copy. Render straight into it with `--out <carpeta>`.

### Copying it to Drive

If the preset names a Drive folder, copy the delivery folder into it so the user does not have to
drag anything.

**Only after the user's approval — never before.** Drive is shared: whatever lands there is
visible to everyone with access and syncs to their machines, so it is publication-adjacent, not
a working directory. The copy happens when *all* of these are true:

- the visual QA passes with no red issues;
- the user has approved the track (the gate in *Music* above);
- there is no correction pending — no open question, no "cambiá esto" waiting on an answer.

Passing the automated audit is **not** approval. A carousel can be clean at the pixel level and
still get five copy changes in the next message; that happened on the carousel this rule came
from. If in doubt about whether the last round closed, ask before copying.

**Copy once, at the end; never render into Drive.** It is tempting to point `--out` straight at
the synced folder and skip the copy, and it is wrong: a carousel gets re-rendered on every QA
round and every correction — eight times in one real session — so Drive would sync seventy-odd
PNGs to end up holding nine, and the user would watch half-finished versions appear and vanish
in a shared folder. Render locally, deliver locally, copy once when it is approved.

Check first whether a folder of that name is already there and **never overwrite one** — ask
instead. If the carousel changes after it was copied, re-copy it and say so, rather than leaving
Drive holding a version the user already asked you to change.

`qa-report.json` and `contact-sheet.png` are working files: produced during the job, read during QA, and **deleted before delivery**. There is no `exports/` (it was a byte-for-byte duplicate) and no `post-descriptions.md` — the caption ships as `caption.txt` inside the delivery folder, and whatever is worth remembering about it goes in `carousel-brief.md`.

Read `references/html-rendering.md` when implementing the static HTML screenshot workflow or visual QA.

## The vertical Short (MP4)

Every carousel also ships a `1080x1920` video built from the same approved slides, so the
same work covers YouTube Shorts. Build it with `scripts/build-short.mjs` after the visual QA
passes — never from unapproved slides.

**A clean QA is not sign-off.** Build the video only once the user has said the images are
finished. Any slide that changes afterwards invalidates the frames, and rebuilding fetches a
different track, so the approval round starts over. It happened twice in one session.

```bash
node <skill-dir>/scripts/build-short.mjs --port 8765 --out <carpeta-de-entrega>/short.mp4
```

- **Frames are re-rendered with `?video=1`**, which drops the swipe prompt. In a Short there
  is nothing to swipe, and the line reads as leftover carousel chrome. The PNGs the user
  publishes as a carousel are not touched.
- **Slide duration is shared out by how much text each slide carries**, mapped onto `3-8s`
  against that carousel's own lightest and heaviest slide. The CTA gets `3s`. The music is
  then cut to exactly that total — there is no fixed video length.
- The slides sit centered on the taller canvas and the bands are filled with the brand's
  field colour, not black, so the seam does not show.

**The video does not promise legibility.** A slide carrying a methodological note cannot be
read in 8 seconds. The Short invites the viewer to pause; it does not replace the carousel.
Say that to the user rather than stretching the video until it is unwatchable — a carousel
like the OpenAI one needs ~92s to actually be read, and that is not a Short any more.

### Music

`scripts/fetch-music.mjs` picks an instrumental background track from archive.org. No
account, no API key, no browser.

**The methodology is fixed — do not "improve" it into fetching more:** one page of results
chosen at random, 20 rows, filter those 20, pick one at random among the survivors. The next
run lands on a different page, so the pool rotates.

- The query carries **genre terms only**. Never add `background music` on its own: it drags
  in corporate, epic, Christmas, horror stock and 1950s department-store muzak, all of which
  pass any decency filter and none of which sets a mood.
- Title filters drop covers and compilations of other people's songs, type beats, YouTube
  rips, vocals, stingers, explicit content, and wrong genres.
- **No language, alphabet or country filters, and do not add any.** Lofi is not any
  country's national music: if the search returns country-tagged material, the query is
  wrong, not the language. Measured over 200 candidates with the genre query, rules for
  Cyrillic/CJK/Thai/Arabic caught exactly zero. What did show up was foreign pop relabelled
  as lofi, and the "version or compilation of another song" rule catches that in any language.
- Tracks must run **1 to 5 minutes**. Below that there is nothing to choose from; above it
  they stop being songs and become hour-long mixes.
- The track is downloaded whole and its loudness profile measured end to end, then the
  steadiest window of the video's length is cut, normalised to `-16 LUFS` with fades.

### Cuando el buscador de archive.org se cae

Pasa, y pasa entero: `advancedsearch.php` devuelve **HTTP 200 con
`{"error":"[BACKEND_ERROR] ..."}`** mientras `/metadata` y las descargas siguen
funcionando perfectamente. Probar si el dominio responde no sirve para detectarlo.

El carrusel no se queda sin video por eso. La cadena, en orden:

1. **Búsqueda normal.** Lo de arriba.
2. **`--item <id>`**, que saltea el buscador y toma la pista de un item conocido —
   misma criba de títulos, mismo rango de duración, misma ventana medida. El
   identificador sale de `manifest.json > short.music.source` de cualquier carrusel
   anterior, o de la URL del item. Lo aceptan `fetch-music.mjs` y `build-short.mjs`:

   ```bash
   node <skill-dir>/scripts/build-short.mjs --port 8765 --item jamendo-464313 --out <carpeta>/short.mp4
   ```
3. **Reusar un recorte local** (`<paquete>/assets/music.mp3` de otro carrusel), solo si
   dura al menos lo que el video nuevo. Es el último recurso porque el recorte ya está
   normalizado y con fades: no se le puede elegir otra ventana.

**Repetir música entre carruseles no es problema** — decisión de La Casa.
No hace falta buscar una pista nueva a toda costa; una ya aprobada sirve igual.

**Show the chosen track to the user and wait for a yes before publishing.** This gate is not
optional and cannot be automated away: the filters read titles, so a track can be named well
and sound wrong, and nothing in the pipeline can listen to it.

### Logging the approved track

Once the user says yes, the track gets recorded in **two** places. Neither is optional, and a
carousel is not delivered until both are done.

1. **`manifest.json > short.music`**, with `title`, `artist`, `source` (the archive.org page) and
   `window` (how many seconds from where). This is the copy that survives: a package whose
   manifest has no music block cannot have its track recovered later. It has already happened —
   `openai-jornada-reemplazo` is logged as `SIN REGISTRO` forever because of exactly this.
2. **The brand's music log**, if the preset names one. Its URL and column list live in the
   preset, because which log a brand keeps is a brand decision.

**A native Google Sheet cannot be written to, a synced `.xlsx` can.** The Drive connector reads
spreadsheets but only edits file metadata — title and parent folder, never cells. And the local
Drive mount does not help by itself: a native Sheet lands on disk as a `.gsheet` stub of about
190 bytes that merely points at the real file on Google's servers, so writing over it destroys
the shortcut and changes nothing.

What does work, and is what La Casa uses: keep the log as a real `.xlsx` inside the synced Drive
folder. It is an ordinary file on disk, so the agent opens it, appends the row and saves, and
Drive syncs it up. Google Sheets opens and edits `.xlsx` the same as a native sheet. Check the
preset for the brand's log path and column order.

Two things not to do:

- Do **not** rebuild a native sheet with `create_file` to fake a write. A new file is a new ID,
  which breaks every existing link to the log and throws away its formatting and history.
- Do **not** write to a synced file the user may have open in the browser without saying so
  first — Drive resolves that into a conflicted copy. Mention it, or ask.

If a brand insists on a native Sheet, the row is emitted **ready to paste** instead:
tab-separated, in the log's exact column order, handed over with the sheet link and a plain
statement that pasting it is the user's step.

### Gotchas that already cost a debugging round

- `ebur128` only emits its per-frame profile with `-loglevel verbose`. Without it there are
  zero samples and the window picker silently falls back to a fixed offset — which looks like
  a working measurement until you notice every track lands on the same percentage.
- ffmpeg writes that profile to **stderr and exits 0**, so `execFileSync` inside a `try/catch`
  never sees it. Use `spawnSync` and read `.stderr` unconditionally.
- The profile line reads `t: 1.0  TARGET:-23 LUFS  M:-14.2`. A pattern expecting `t:` directly
  followed by `M:` never matches.
- Do **not** compute slide durations as "reading speed, then clamp to a maximum": every
  content slide overshoots the cap, so they all come out at exactly the maximum and the
  share-out shares nothing.
- ffmpeg cannot seek cleanly into an arbitrary point of a long MP3 — it reads forward.
  Measured on an 8-hour, 1 GB file: jumping to minute 10 took 19s, jumping to hour 7 never
  finished. The duration ceiling is what keeps the download cheap.
- archive.org returns a file's `length` sometimes as `MM:SS` and sometimes as seconds.

## Captions

Always generate post descriptions with hashtags.

**Never more than 5 hashtags, on any platform.** This is a platform limit, not brand taste, so it holds for every preset and outranks a caption template that asks for more: if the template's fixed tags plus its dynamic ones add up past 5, the template is wrong and gets fixed before the caption is written — never trimmed silently at the last moment. How the 5 are split between fixed and per-topic tags is a brand decision and lives in the preset.

If the active preset defines a caption template, follow it exactly: fixed blocks (greetings, service lines, links, fixed hashtags) are reproduced verbatim and never adapted to the topic; only the blocks the template marks as written change per carousel. Deliver the caption as one plain-text block, clearly labelled and ready to paste with no further editing.

Check the template is actually filled before writing a single caption. A preset whose caption section still carries `<…>` placeholders, or that has no caption section at all, is not usable: ask the user for the greeting, the fixed lines, the links and the fixed hashtags, write them into the preset, and only then assemble the caption. Shipping a caption invented around a placeholder is worse than asking.

**Ship the caption as a file, not only as chat text.** Write it to `caption.txt` inside the delivery folder — plain text, UTF-8, no markdown, no headings, no code fences, nothing but the caption itself, ready to select-all and paste. It sits next to the PNGs because that is the folder the user opens to publish. Paste it in the chat too.

Use `$humanizer` on each slide passage and each post description before final export. If `$humanizer` is not installed, ask to install it globally with the skill installer when available. If installation is not available, continue only after applying the built-in humanizer pass:

- Remove generic AI phrasing.
- Remove inflated claims.
- Cut filler.
- Keep one meaning once.
- Use natural rhythm for the selected language.
- Avoid dictionary-style explanations.

## Deliverable

Return the delivery folder and a short validation summary.

What the user actually publishes — everything else is working material:

- Ordered PNG exports in `<tema-en-kebab-case>/`.
- `caption.txt` in that same folder — the caption alone, plain text, ready to paste.
- `short.mp4` in that same folder — the vertical video, same caption, for YouTube Shorts.

What the package keeps so the carousel can be fixed later without rebuilding it:

- Editable HTML/CSS/data source plus `assets/`.
- `manifest.json` (size, CTA variant, layout exceptions).
- `carousel-brief.md` — short: source, angles, decisions, caveats. Not a report.

Nothing else ships. `qa-report.json` and `contact-sheet.png` are deleted after the QA pass; there is no `exports/` and no `post-descriptions.md`.

And in the chat: la caption pegada entera, la nota de QA visual (tamano, legibilidad, composicion centrada, comportamiento del CTA y cualquier salvedad que quede), y **el atajo para abrir la carpeta**.

### Mirar las placas, no el reporte

**Antes de decir una sola palabra sobre cómo quedó un carrusel, hay que abrir cada PNG a
tamaño real y mirarlo.** Uno por uno, los nueve. No el contact sheet: los archivos.

No es una recomendación. Es el paso que evita el peor error posible, que es afirmarle al
usuario que una placa está bien sin haberla visto.

**El contact sheet no sirve para esto.** A esa escala una palabra cortada se ve como una
palabra. Una portada donde `ALUCINACIONES` sale como `ALUCINACIONI` —la palabra se va del
lienzo— se ve entera en el contact sheet sin que se note. El
contact sheet es para el ritmo de la serie; la placa a tamaño real es para todo lo demás.

**`QA automática OK` no quiere decir que esté bien.** Dice que ningún chequeo programático
saltó, y los chequeos no leen. En ese mismo carrusel el reporte salió limpio con:

- una palabra del titular cortada por el borde,
- un número gigante `01` arriba de un kicker que decía `SEGUNDA CAUSA`,
- titulares de cinco renglones ocupando un tercio de la placa,
- un kicker (`LO QUE LE FALTA`) repitiendo la primera palabra de su propio titular
  (`Le falta decir «no sé»`).

Ninguna de las cuatro la puede ver un script.

**Ojo particular con `typography-floor` y `safe-area`.** El template `02` las trae como
excepción de fábrica, y bajan a nota **todos** los avisos de su tipo — incluido
`"ALUCINACIONES" fuera del safe area`, que es exactamente como se reporta una palabra que
se fue del lienzo. Con esas excepciones activas, **el texto cortado no bloquea nada**. Hay
que leer las notas una por una y mirar la placa.

### Las capas de fondo se miden, no se estiman

Retículas, tramas, curvas, glows: todo lo que vive detrás del contenido **se declara en
niveles de diferencia sobre el fondo**, medidos, no en una opacidad elegida a ojo.

**El umbral está medido por la marca: a 14 niveles la línea es invisible en un teléfono.**
Sale del `01-editorial-oscuro`, cuyas curvas estaban a 14 y hubo que subirlas; el valor que
funcionó es **28**. Ese es el piso para una línea de 1px que tiene que leerse como textura.

Se calcula mezclando el color de la línea con el del fondo según la opacidad, y comparando
contra el fondo. Una opacidad no dice nada por sí sola: `0.07` sobre papel claro da 15
niveles y `0.05` sobre campo oscuro da 8.

Retículas a 15, 8 y 13 niveles se ven apagadas en pantalla y ningún chequeo las mide: el
que las nota es el que mira la placa.

**Cuando se corrige, el valor medido va al `estilo.md` del template**, con la cuenta, para
que la próxima vez no vuelva a bajar.

### Dos cosas que solo se ven mirando

Ninguna la agarra un script:

- **Una palabra repetida entre el rótulo y el titular.** El kicker decía `LO QUE LE FALTA` y
  el titular `Le falta decir «no sé»`. Se lee como un error de armado. Lo mismo vale para el
  pie: `FUENTE: LILIAN WENG` debajo de una pieza cuyo campo `FUENTE` está en blanco a
  propósito son dos "fuente" con sentidos distintos en la misma placa.
- **Un ícono que no significa nada.** Una flecha hacia abajo al lado de *"le enseñaste algo
  nuevo"* sugiere que algo baja, y no baja nada. El ícono dice lo mismo que la línea que
  acompaña o no va.

### No persigas el número del audit

Cuando un chequeo marca un hueco o un desbalance, **el arreglo sale de mirar la placa, no
de mover una constante hasta que el número baje.**

Bajar el titular de la portada de `88px` a `268px` del borde tapa el aviso de hueco interno
y deja el carrusel peor: la portada pasa a ser la única placa cuyo titular no arranca a la
misma altura que las demás, y la serie pierde la línea superior. El audit no lo ve;
`audit-serie.mjs` sí, como `arranque-por-rol`.

Dos reglas que salen de ahí:

- **Lo que alinea la serie no se toca para cerrar un hueco.** El titular arranca donde
  arranca en todas las placas.
- **Si el único modo de pasar el chequeo es empeorar la composición, el chequeo tiene
  razón sobre el síntoma y vos sobre el arreglo: a esa placa le falta contenido.** Ponele
  contenido real o preguntale al usuario. No la estires. Inflar una tarjeta hasta que
  quede hueca por dentro es la misma trampa un nivel más abajo.

### El titular tiene que entrar en dos renglones

La regla de *Cómo se escribe una placa* pide que el titular sea una oración con verbo
conjugado. Falta la otra mitad: **tiene que entrar en dos renglones del template activo.**

Sin ese límite salen oraciones de 45 caracteres que en el `02` se componen a 104px en
mayúsculas y ocupan **cinco renglones y un tercio de la placa**:
`ENSEÑARLE LO QUE NO SABÍA LE ENSEÑA A INVENTAR` es exactamente eso.

Contá los caracteres contra el template:

| Template | Titular de contenido | Caracteres que entran en 2 renglones |
|---|---|---|
| `02-editorial-oscuro-v2` | Archivo 104px, mayúsculas | **~22** |

Las del set del propio template: `La máscara causal.` (18) · `Más capas, más sesgo.` (21)
· `El orden no es neutro.` (22). Ese es el largo, no 45.

**Un `<br>` no achica nada.** Si la línea no entra a lo ancho, envuelve igual y el `<br>`
sólo agrega un renglón más. La cuenta es de caracteres, no de dónde ponés el corte.

Cuando la oración completa no entra, **el titular se acorta y la bajada completa la idea**
— para eso está. Lo que no se hace es bajarle el cuerpo al titular.

### Un campo opcional no es una invitación

**Si el usuario pidió sacar un elemento, se saca del template — no se deja opcional.** Un
campo que sigue existiendo se vuelve a llenar, y el que lo llena es el agente.

El caso testigo es el número gigante del `02`: se pidió sacarlo, se lo dejó opcional
(`s.num ? bignum(s) : head(s)`), y el primer carrusel siguiente salió con `01` y `02`
puestos por el agente, uno de ellos arriba de un kicker que decía `SEGUNDA CAUSA`.

Y en general: **un campo opcional del template no se llena sin que el usuario lo pida.** Va
al gate de aprobación de copy como cualquier otra decisión de composición.

### Mandale la imagen, no se la cuentes

**Cada vez que se renderiza, el contact sheet va al chat.** No alcanza con mirarlo vos y
describir lo que ves: la revisión visual la hace el usuario, y sólo la puede hacer sobre
la imagen. Contarle que "quedó bien" es pedirle que confíe en el mismo ojo que compuso la
placa.

- **Después de cada tanda de render**, el contact sheet, aunque la QA automática haya
  dado limpia.
- **Si el pedido es sobre una placa puntual**, esa placa a tamaño completo. Un recorte de
  contact sheet no sirve para juzgar cuerpos ni separaciones.
- **Después de cada corrección**, la placa corregida. Una corrección que el usuario no
  ve no está confirmada.
- El atajo para abrir la carpeta sigue yendo, pero **no reemplaza mandar la imagen**: es
  para el archivo final, no para revisar.

Que el usuario mande recortes para marcar algo puntual está perfecto y es lo más
preciso que hay: la regla no existe para evitar eso. Existe porque quien compuso la placa
no puede ser el único que la mira.

### Una referencia ambigua se pregunta, no se elige

`el 02` puede ser la placa 2 o el template `02-...`, y en una conversación que viene
hablando de las dos cosas no hay forma de saberlo por contexto. Ahí se pregunta en una
línea. Elegir la interpretación más probable y seguir cuesta una tanda entera de trabajo cuando
sale mal: mandar la placa 2 a quien pedía el template 02 es rehacer el carrusel completo.

Vale para cualquier referencia corta: un número suelto, "el anterior", "ese", "el otro".

### El atajo para abrir la carpeta

**Toda entrega termina con un bloque que abre la carpeta de entrega, sin excepcion.** La app le pone boton de Run a los bloques marcados como `bash`, asi que es un clic y se abre el explorador — el usuario no tiene que ir carpeta por carpeta buscandola en el explorador de Windows.

Va con la ruta absoluta real, nunca con un placeholder:

    ```bash
    explorer.exe "RUTA_ABSOLUTA_DE_LA_CARPETA_DE_ENTREGA"
    ```

Reglas:

- **La carpeta de entrega primero**, que es la que tiene los PNG, la caption y el video. Es la que el usuario quiere ver.
- **Un solo comando por bloque.** Si tambien hace falta abrir la carpeta del paquete —para editar el fuente o revisar el brief— va en su propio bloque, abajo, aclarando cual es cual.
- **Ruta absoluta y entre comillas**, para que aguante los espacios de `Documents` y de cualquier carpeta con nombre compuesto.
- **Tambien va cuando la entrega todavia no esta terminada.** Si se renderizo aunque sea una tanda para revisar, el bloque va igual: sirve justamente para mirar antes de aprobar.
- Si el preset nombra una carpeta de Drive y el carrusel ya se copio ahi, va un segundo bloque con esa ruta, aclarando que esa es la copia publicada.
- En macOS o Linux el comando cambia (`open` / `xdg-open`); lo que no cambia es que el bloque va siempre.
