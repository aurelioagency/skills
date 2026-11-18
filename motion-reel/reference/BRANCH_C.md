# Branch C: filmed talking head without a resource (the assistant finds the media)

User 2026-11-15: "cuando no tenés recurso se usaría este estilo o formato, hay como 20 videos más de este estilo, en el que necesito que salgas a internet a buscar cosas, videos, fotos, imágenes, lo que sea, para armar esto".

Use it when the user films a talking head and there is NO resource page, no product and no resource URL: the animation is made of real media the assistant searches on the internet. First format: the quiz reel "¿Sabés más de X o de inteligencia artificial?" (two questions, three options each, answer and short explanation). Other topics can reuse the engine and the rules.

Everything of Branch B still applies (prepare, cuts, join, transcript, gates, draft, review, cover, final, deliver, caption rules, music, SFX, captions). Branch C changes only what the animation is made of and the extra checks below. There is NO new resource page. The resource for every Branch C reel is the existing page `https://www.aurelioagency.com/es/la-casa-de-aurelio` (user 2026-11-16): deliver `dm-reply-<slug>.txt` (two lines, greeting + that URL, nothing else) next to the caption; `replykaro-automation` uses that URL as the DM link.

## Template (ships with the skill)
`templates/quiz-aurelio/`: `quiz.js` (engine fed by one data object), `film.example.js` (data of the first finished reel, futbol-mcp), `clips.example.json`, `prep-clips.py`, `fetch-assets.py`, `aurelio-star.svg`, `trophy-cut.png`, and `README.md` with the full step list and style rules. Read that README first and copy the files into the project (`film/quiz.js`, `film/film.js`, `assets/...`). Change only the data and the media.

## Style (fixed, from aurelioagency.com; never the neon/violet look)
Pure black, warm white #F4F0EA, Cormorant Garamond serif (italic for the emphasis word), thin outlined pills and cards, the REAL Aurelio star (`aurelio-star.svg`, never a hand-drawn star), no accent colour, no confetti, no stickers, no single-word black screens. Details in the template README.

## Hard rules learned from the user's rejections
1. **Face windows:** the face appears only when he looks at the camera (hook, question, jump to the second question, close). While he reads options or explains with eyes down, only his voice plays over media. Measure the gaze with `gaze.py` (`<Videos>/Motion Reel/.control/tools/gaze.py`; reading = eyes down > 0.4 and head down; camera = eyes down < 0.3) before planning windows, and again on the joined video.
2. **Nothing covers the face** in a face window. Titles and logos above the head, loose objects (a trophy, a ball) as transparent PNG beside it, never in a box or "vitrina".
3. **Cuts:** no silence over 0.25 s except the thinking pause (up to 3 s with a 3, 2, 1 countdown). Every return of the face starts on a frame looking at the camera. Remove false starts, repeated sentences and self-corrections. Check every joint frame by frame.
4. **Figures on screen = figures spoken**, at that exact word. Never cumulative numbers or counts he did not say.
5. **Every option card must show the real thing** (the player, the logo, the object) clearly: build a contact sheet of the clip crop before rendering. A crop that shows crowd or ad boards is a defect.
6. **Real media only** and legible on a vertical phone: clips cropped 9:16 so no scoreboard text is readable, no tiny screen recordings, own large graphics (chains, calendars, networks with big names) for AI concepts. Prefer official channels and transparent PNGs; note the licence of each cut-out image.
7. Something changes on screen every 1 to 1.5 s (hard cut, punch-in, text, whip). No more than 1.8 s of static image.
8. Do not move or restyle a thing the user did not ask to change. Interpret literally ("subirlo un poco" = move it up).

## Finding the media (the assistant does it, the user only drops videos)
1. Per option and per answer, choose what a viewer recognises at once: a player's celebration, a logo, a product demo, an official diagram.
2. Search with `fetch-assets.py search "..."` (YouTube through `python -m yt_dlp`), download into `E:\Motion Reel\Recursos\<topic>\` (or the disk with space), build the contact sheet, pick the exact seconds.
3. For loose objects use a transparent PNG (cut with rembg or find one) and keep the source and licence.
4. Write every URL and licence in `docs/overlay_plan.md`.
5. Disk C: may be nearly full: keep work and downloads on E:.

## Music
Music is mandatory (see Branch B step 5). Use the skill's music library: an instrumental, medium-tempo track, one constant level under the voice (about 24 dB below it, `bed.under`; no ducking or rises, the user rejected a level that moves), short fade in and out. Voice stays at -21.5 LUFS, mix peak below -1 dBFS. Save the track under `Recursos\musica\`, note source and licence in `overlay_plan.md` and check the licence on the source page before using it for a client.

## Comment to DM (ReplyKaro), Branch C only (user 2026-11-16)
Every Branch C reel uses ReplyKaro (not Jack, which is Aurelio's AI that answers messages and is not used here) with this rule: ANY comment triggers it, whatever the person writes, no keyword. Public reply to the comment: "¿Querés aprender más sobre inteligencia artificial? Te mandé algo por DM". DM: the link `https://www.aurelioagency.com/es/la-casa-de-aurelio` (the section with LinkedIn, Skool and YouTube, so the person chooses where to go), with the follow gate on so that people also follow the account. Use the `replykaro-automation` skill (its fixed Aurelio keyword does not apply to this format; check that ReplyKaro really offers an any-comment trigger, and if its API only accepts a keyword, tell the user instead of faking it). The text of `dm-reply-<slug>.txt` stays as the manual backup.

## Delivery
Same folder rules as Branch B (`source/` + `output/`). Caption text and hashtags follow DELIVERY.md (Instagram: at most 5 hashtags). No new resource page; `dm-reply-<slug>.txt` points to La Casa de Aurelio (see top). Publishing needs the user's explicit approval, only to Aurelio accounts.

## Delivery folder name (user 2026-11-16)
The folder and every file inside it use `<tema>-vs-<concepto de IA>-de-que-sabes-mas` (e.g. `futbol-vs-mcp-de-que-sabes-mas`, `tenis-vs-llm-de-que-sabes-mas`, `historia-romana-vs-rag-de-que-sabes-mas`), so the name says it belongs to the quiz series. The work project keeps its short slug; only the delivery and Drive names carry the long one. Rename after `deliver`/`publish` (the pipeline's own slug is the short one) or pass the long slug when delivering.

## Consistencia con los reels aprobados (user 2026-11-17, obligatorio)

Los reels ya aprobados (futbol-mcp, tenis-llm, colon-temperatura, historia-romana-rag) son la referencia. Cada reel nuevo replica su formato, estilo, recorte y música sin variar. El usuario no debe repetir estas reglas.

1. Antes de armar cualquier reel Branch C, leer los valores reales (negro, alpha, borde, radio, tamaños, tiempos) del proyecto aprobado futbol-mcp y reutilizarlos tal cual. La píldora "Pregunta N de 2" y el bloque de título llevan el mismo negro opaco en todos. Nada de recuadros transparentes ni grises.
2. Gancho siempre igual: bloque de título con estrella, "<tema> vs IA", objetos PNG a cada lado, píldora "Pregunta 1 de 2".
3. Los objetos del gancho son el emblema propio del tema, buscado y recortado en PNG nítido con fondo transparente: River = escudo de River, Boca = escudo de Boca, Messi = la M o recorte de Messi, Cristiano = CR7 o recorte, Mundiales = la copa. Prohibido usar emoji o la pelota genérica cuando existe un emblema propio. Hay que salir a buscarlo.
4. Las opciones de la pregunta 1 son VIDEO real reproduciéndose en cada tarjeta, nunca capturas congeladas de un video.
5. Calidad: prohibido sacar capturas de un video para usarlas como foto (salen pixeladas). Fotos de alta resolución (mínimo 1080 px de lado corto) o clips HD reales. Para jugadores, material con la camiseta correcta (Argentina, Portugal). Verificar nitidez con zoom antes de mostrar.
6. Coherencia entre opciones: si dos opciones muestran estadios, la tercera también. Mismo tipo de imagen en A, B y C.
7. Opciones con identidad del tema (River con clips o imágenes de River, no números sueltos).
8. Fondos negros como el aprobado, sin transparencias que dejen ver el fondo claro.
9. Mismos recortes, mismo tratamiento de cara y misma música que los aprobados.

## Estructura del reel quiz, igual que los aprobados (user 2026-11-17, obligatorio)

Una versión hecha con Codex fue rechazada por no replicar esta estructura visual. Codex y Claude Code pueden ejecutar esta rama usando el mismo motor de Motion Reel; el requisito es respetar el formato aprobado. Antes de armar o delegar un reel, copiar la estructura de futbol-mcp/river-gpu.
1. Cuando pregunta sobre inteligencia artificial (pregunta 2) está EN PANTALLA mirando a cámara.
2. Cuando dice "¿cuántos acertaste?" también está en pantalla mirando a cámara.
3. La respuesta de inteligencia artificial lleva ANIMACIONES reales: golpes de 1 a 1.5 s con siglas grandes, clips reales y gráficos propios. Nunca solo texto y tarjetas de palabras clave.
4. Opciones, textos y tarjetas con el formato exacto del aprobado, en negro opaco, sin transparencias.
5. Variedad de imágenes: nunca alternar dos fotos ni repetir la misma imagen o estatua. Muchos clips y fotos distintos, HD.
