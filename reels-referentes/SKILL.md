---
name: reels-referentes
description: Buscar reels de Instagram de cuentas referentes que el usuario indica, proponer candidatos con link para que el usuario verifique las views, llevar una lista de los aprobados, y para cada aprobado bajar solo el audio (con cobalt.tools), transcribir el diálogo, traducirlo al español si hace falta, y detectar qué recurso/link menciona el reel. Usar cuando pida "buscar reels referentes", "auditar cuentas de Instagram", "reels ganadores", "sacar el guion/diálogo de un reel", o pegue una o más cuentas/links de Instagram para analizar. No descarga el video completo salvo que haga falta el audio.
---

# Reels referentes

Flujo de 4 pasos. Cada paso depende del anterior — no te saltees ninguno.

1. **Cuentas** → el usuario pasa cuentas de Instagram, se guardan como referentes.
2. **Propuesta** → se buscan reels de esas cuentas, se proponen los de más views con su link para que el usuario los vea y decida.
3. **Aprobación** → el usuario dice cuáles usar; se anotan en la lista de aprobados.
4. **Extracción** → para cada aprobado: bajar el audio, transcribir el diálogo, traducir si no está en español, y decir qué recurso/link menciona.

Todo el estado (cuentas, candidatos, aprobados) se guarda en `Documents\reels-referentes\` — ver `references/estado.md` para el formato exacto de cada archivo. Nunca inventes datos ahí: si un archivo no existe todavía, se crea vacío la primera vez.

## Paso 1 — Cuentas referentes

Cuando el usuario pase una o más cuentas (@usuario o link de perfil), agregalas a `Documents\reels-referentes\cuentas.json` (crear el archivo si no existe). No pidas confirmación para este paso, es solo guardar la lista que el usuario ya dio. La lista blanca inicial está en `references/cuentas-lista-blanca.md` — solo se busca en cuentas de esa lista; se van agregando más cuando el usuario las pase.

## Paso 2 — Buscar y proponer candidatos

Para cada cuenta referente, abrí `instagram.com/<cuenta>/reels/` en el browser (cuentas públicas muestran el conteo de reproducciones en la grilla, sin necesidad de login). Usá `mcp__Claude_Browser__navigate` + `read_page`/`get_page_text` para leer los números de views de cada miniatura.

- Andá cuenta por cuenta, nunca en loop agresivo sobre muchas cuentas seguidas — Instagram banea scraping automatizado si detecta patrón de bot.
- Elegí los reels con más views (o los que se destaquen claramente sobre el promedio de la cuenta) **y que además caigan en alguno de los temas de `references/temas.md`**: divulgación de IA (novedades, conocimiento técnico, herramientas, configuraciones, modelos), o un recurso puntual para compartir (una skill, un repo de GitHub, una página/herramienta que le sirve a la gente). Un reel con muchas views pero de otro tema no se propone.
- Para cada candidato devolvé: cuenta, link directo al reel, views (aproximado, el número que muestra Instagram), a qué tema pertenece, y una línea de por qué lo proponés.
- Si el tema es "recurso para compartir" (skill, repo, página, herramienta), el link de ese recurso es el dato central del candidato — si se ve en la descripción o en pantalla, incluilo ya en la propuesta; si solo se sabe escuchando el audio, avisá que hace falta aprobarlo para poder extraerlo (paso 4).
- Guardalos en `candidatos\<cuenta>.json`.
- **No descargues ni transcribas nada en este paso.** Esto es solo para que el usuario entre a Instagram, mire el reel y decida.

## Paso 3 — Aprobación

Cuando el usuario diga cuáles reels aprueba, agregalos a `aprobados.json` con su link, cuenta y fecha. Esto es la confirmación explícita — recién acá se pasa al paso 4, y solo para los reels que el usuario nombró (no proceses el resto de los candidatos sin que los apruebe).

## Paso 4 — Audio, diálogo, traducción y recurso

Para cada reel recién aprobado:

1. **Bajar el audio con cobalt.tools.** La API pública de cobalt tiene bot-protection y rechaza llamadas directas (ver `references/cobalt.md`), así que se usa la página web real: `cobalt.tools`, pegar el link del reel, elegir modo audio, descargar. Usá `Claude in Chrome` (el navegador real del usuario) para esto, no el browser sandboxeado — así el archivo cae en la carpeta de Descargas real y se puede mover con Bash/PowerShell. Movelo a `aprobados\<reel-id>\audio.<ext>`.
2. **Transcribir.** Corré `scripts/transcribir.py <audio> <salida.json>` (usa faster-whisper local, detecta el idioma solo, sin costo). Guardá el texto en `aprobados\<reel-id>\dialogo.txt`.
3. **Traducir si hace falta.** Si el idioma detectado no es español, traducí vos mismo el texto (sos el modelo, no hace falta ninguna API de traducción) y guardalo en `aprobados\<reel-id>\dialogo_es.txt`. Si ya está en español, no crees ese archivo.
4. **Recurso mencionado.** El recurso (app, sitio, producto, link) casi siempre se dice en el propio audio, no en la descripción — buscalo en el diálogo transcripto. Si no aparece ahí, revisá la descripción del reel. Guardá lo que encuentres (nombre + link si lo tiene) en `aprobados\<reel-id>\recurso.txt`, o escribí "no se menciona ningún recurso" si no hay nada.

Al terminar cada reel, mostrale al usuario: el diálogo (traducido si correspondía) y el recurso encontrado, listos para que él los adapte.

## Reglas duras

- Nunca descargues el video completo — solo el audio, y solo de reels ya aprobados.
- Nunca publiques ni compartas nada de esto en ninguna red — es investigación interna.
- No proceses candidatos que el usuario no aprobó explícitamente.
- No entres a Instagram logueado con una cuenta real salvo que el usuario lo pida — la lectura de views funciona en cuentas públicas sin login.

## Referencias

- `references/estado.md` — formato de `cuentas.json`, `candidatos\*.json` y `aprobados.json`.
- `references/cuentas-lista-blanca.md` — cuentas referentes iniciales.
- `references/temas.md` — qué temas se buscan y por qué el link importa en cada uno.
- `references/cobalt.md` — por qué se usa la web de cobalt.tools y no su API.
- `scripts/transcribir.py` — transcripción local con faster-whisper (auto-detecta idioma).
