# Plantilla quiz "¿Sabés más de X o de IA?" (v3, estilo Aurelio)

Formato de 17 reels. Ejemplo completo: `futbol-mcp` (su `film/film.js` = `film.example.js`). La v2 (violeta y verde neón) fue rechazada y quedó en `v2-viejo/` solo como referencia: no usarla.

## Estilo (medido en aurelioagency.com, no cambiarlo)
- Fondo negro #000 (tarjetas #0A0A0A), texto blanco cálido #F4F0EA, secundario al 72 % y 52 %. Sin color de acento.
- Títulos y palabras clave en Cormorant Garamond 400/500, itálica para la palabra de énfasis (`<i>`). Etiquetas chicas en Inter, mayúsculas espaciadas.
- Bordes finos (#F4F0EA al 24 a 42 %), esquinas redondeadas, píldoras con contorno y la ESTRELLA REAL de Aurelio (`aurelio-star.svg`, la misma `public/logo-mark.svg` del repo Aurelio-Agency-Website; va en `assets/brand/aurelio/logo-mark.svg`), luces suaves. Nunca una estrella dibujada a mano.
- En las ventanas con cara NADA tapa el rostro: título y logos arriba de la cabeza, objetos al costado. Objetos sueltos (ej. la Copa) como PNG sin fondo (`trophy-cut.png`, recortado con rembg), nunca en una caja.
- Explicaciones de IA con gráficos propios legibles en vertical (`chains`: IA → MCP → app con nombres grandes; `calendars`: semana con el hueco libre; `network`: apps con nombre), no grabaciones de pantalla chicas.
- En cada tarjeta de opción el jugador/objeto tiene que verse claro: hoja de cuadros del clip recortado antes de renderizar.
- Correcta: borde blanco y círculo blanco con check negro. Incorrectas: gris y bajan opacidad.
- Prohibido: violeta, verde neón, amarillo, confeti, stickers, pantallas negras con una sola palabra gigante, flashes blancos.
- Ritmo: algo cambia cada 1 a 1.5 s. Whip (desenfoque horizontal) en cada cambio de ventana, zooms sobre la cara en palabras fuertes, cortes duros de clips reales a pantalla completa después de la respuesta, cámara lenta en el remate, congelado al final, contador, sacudón en cada gol.

## Archivos
- `quiz.js`: el motor. Todo sale de un objeto de datos (ver la cabecera del archivo): `layout`, `punch`, `whips`, `shakes`, `stage` (clips, imágenes, `lights`), `frames` (logos y fotos con borde fino, o html), `texts` (serif, entrada `rise`), `pills`, `questions` (etiqueta, pregunta, tarjetas con clip o con palabras que se encienden, cuenta 3 2 1, revelación), `counters`, `network` (IA al centro y apps conectadas), `rings`, `close` (cierre Aurelio).
- `film.example.js`: los datos de futbol-mcp, punto de partida.
- `clips.example.json`: la receta de clips de futbol-mcp (tarjetas 640x360, recortes 9:16 sin marcador, fondos desenfocados).
- `prep-clips.py`: corta los clips (vertical 1080x1920, banda 16:9 para tarjetas, recorte 9:16 para esconder marcadores, cámara lenta, fondo desenfocado).
- `fetch-assets.py`: busca en YouTube, baja a `E:\Motion Reel\Recursos\<tema>\` y arma la hoja de cuadros para elegir los segundos.

## Pasos para un reel nuevo
1. Proyecto motion-reel Branch B hasta `prepare`. Medir la voz (energía cada 10 ms) y la mirada (`gaze.py` cada 0.1 s) sobre la toma.
2. Recortes en `pipeline.json`: inicio y final de cada tramo a la palabra más 0.1 s, ningún silencio de más de 0.25 s salvo la pausa de pensar (hasta 3 s). Cada vuelta de la cara arranca en un cuadro que mira a cámara. `join`, revisar silencios y mirada otra vez sobre el video unido.
3. `transcribe` y `approved.json` (corregir nombres; los tiempos de whisper suelen adelantarse en el arranque de cada frase: ajustarlos a la energía).
4. Ventanas: cara solo cuando mira a cámara (gancho, pregunta, pase a la segunda pregunta, cierre). Mientras lee opciones o la explicación, solo su voz con clips y gráficos.
5. Recursos: `python fetch-assets.py search "..."`, `get`, `sheet`. Por opción, un clip o foto real; para la respuesta, 6 a 10 clips cortos reales. Logos reales (pelota, logo de la IA, apps). URLs en `docs/overlay_plan.md`.
6. `assets/clips/clips.json` y `python prep-clips.py assets/clips/clips.json assets/clips`.
7. Copiar `quiz.js` a `film/quiz.js` (con `<script src="quiz.js">` después de `overlay.js` en `film/index.html`), `film.example.js` a `film/film.js`, y cambiar solo los datos. Fuentes: `CormorantGaramond.ttf`, `CormorantGaramond-Italic.ttf` e `Inter.ttf` en `assets/fonts/` (Google Fonts) y la carpeta `assets/brand/aurelio/` del cierre.
8. Sonidos en `timeline.json` `sfx`: tic tac en la pausa, ding suave en la respuesta, estadio o ambiente bajito, golpe en cada gol. Los whoosh de los whips y los clics salen solos.
9. Probar cuadros con `node scripts/render.mjs --at ...`, después `draft` y `review`, y mirar la hoja cada 0.5 s y cada vuelta de la cara.

## Música (para los 16 que siguen)
- Siempre lleva música de fondo instrumental, sin voz. Sale de la biblioteca de la skill (`~/.claude/skills/motion-reel/music/library.json`, temas de Jamendo/archive.org y YouTube Audio Library, todos parejos: rango de volumen de 2 LU o menos). `bed.py` rota los temas para que no se repitan entre videos; el proyecto conserva el suyo en las repeticiones.
- Para fijar un tema: copiarlo a `E:\Motion Reel\Recursos\musica\` y poner en `pipeline.json` `"bed": { "track": "<ruta>", "under": 19 }`; en `timeline.json` `"mix": { ..., "bedCarve": true }` (le hace lugar a la voz bajando 5 dB alrededor de 2.5 kHz). Anotar título, autor y fuente en `overlay_plan.md` y revisar la licencia en la página de la fuente antes de usarlo para un cliente.
- Nivel: UNO solo y constante, 19 dB bajo la voz (voz -21.5 LUFS, cama alrededor de -40.5 LUFS). Aprobado en futbol-mcp: a 24 dB se escuchaba poco y 14 dB fue "muy fuerte"; no subir de 17. Sin ducking, sin subir ni bajar en pausas o revelaciones: el usuario ya rechazó una música que sube y baja en medio del video. La skill pone fade in de 0.4 s y fade out de 1.2 s.
- Control: voz -21.5 LUFS, mezcla con pico de -1 dBTP o menos (`ffmpeg -i audio/mix.wav -af ebur128=peak=true -f null -`).

## Reglas que ya trae
- La cifra en pantalla es EXACTAMENTE la que dice la voz en ese momento: si dice "4 en Rusia, 8 en Qatar, 10 en 2026", se ven 4, 8 y 10, cada una en su palabra. Nunca acumulados ni conteos que no dijo (el contador ya no cuenta hacia arriba; `count: true` solo si lo pide el guion). Revisar todas las cifras contra el transcript antes de renderizar.
- Nada animado antes de 1 s después de la primera palabra; el cierre Aurelio necesita 1.4 s libres (aterrizarlo en "Nos vemos").
- Todo lo importante entre y 180 y y 1380 (los subtítulos van abajo). Arriba de la cabeza hasta y 560.
- Nunca rojo y blanco en gráficos propios; nada de marcadores legibles en los clips.
- Textos en voseo, palabras simples, sin rayas largas.
