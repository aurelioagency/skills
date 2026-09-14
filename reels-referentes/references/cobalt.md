# Por qué cobalt.tools por la web y no por API

cobalt tiene una API JSON (`POST` a `https://api.cobalt.tools/` con `{ "url": ..., "downloadMode": "audio" }`), pero la documentación oficial del proyecto dice explícitamente que la instancia pública `api.cobalt.tools` usa bot-protection y **no está pensada para usarse desde otros programas sin permiso explícito**. Una llamada directa (curl, fetch, etc.) desde acá se rechaza.

Por eso el flujo pasa por la página web real (`cobalt.tools`) con Claude in Chrome (el navegador real del usuario, no el browser sandboxeado):

1. Ir a `https://cobalt.tools`.
2. Pegar el link del reel aprobado.
3. Elegir modo de descarga "audio" (no video).
4. Click en descargar.
5. El archivo cae en la carpeta de Descargas real de Windows — moverlo desde ahí con Bash/PowerShell a `Documents\reels-referentes\aprobados\<reel_id>\audio.<ext>`.

Si cobalt.tools cambia de layout, ajustar los selectores en el momento — no hay nada hardcodeado que dependa de la estructura exacta de la página.

## Cuando cobalt no trae el audio real (bloqueo con Instagram)

Comprobado en la práctica: para algunos reels, la instancia pública de cobalt.tools no logra pasar el bloqueo de Instagram y devuelve solo la foto de portada (un `.jpg`), tanto en modo "audio" como en modo "auto" — no es un problema de elegir mal el modo, cobalt simplemente no consigue el video/audio real para ese contenido. Señal de que pasó esto: el archivo descargado es una imagen de unos 100KB, no un audio/video.

En ese caso, no reintentar en loop cambiando de modo — avisarle al usuario y usar como respaldo **yt-dlp** (herramienta open-source, gratis, ya probada en esta skill):

```bash
python -m pip install --user yt-dlp   # una sola vez
python -m yt_dlp -f "bestaudio/best" -o "audio.%(ext)s" "<link del reel>"
```

Esto baja el audio directo sin pasar por cobalt. Seguir intentando primero por cobalt.tools (es lo que pidió el usuario), y caer a yt-dlp solo si cobalt devuelve una imagen en vez de audio/video.
