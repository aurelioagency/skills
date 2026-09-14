# Por qué cobalt.tools por la web y no por API

cobalt tiene una API JSON (`POST` a `https://api.cobalt.tools/` con `{ "url": ..., "downloadMode": "audio" }`), pero la documentación oficial del proyecto dice explícitamente que la instancia pública `api.cobalt.tools` usa bot-protection y **no está pensada para usarse desde otros programas sin permiso explícito**. Una llamada directa (curl, fetch, etc.) desde acá se rechaza.

Por eso el flujo pasa por la página web real (`cobalt.tools`) con Claude in Chrome (el navegador real del usuario, no el browser sandboxeado):

1. Ir a `https://cobalt.tools`.
2. Pegar el link del reel aprobado.
3. Elegir modo de descarga "audio" (no video).
4. Click en descargar.
5. El archivo cae en la carpeta de Descargas real de Windows — moverlo desde ahí con Bash/PowerShell a `Documents\reels-referentes\aprobados\<reel_id>\audio.<ext>`.

Si cobalt.tools cambia de layout, ajustar los selectores en el momento — no hay nada hardcodeado que dependa de la estructura exacta de la página.
