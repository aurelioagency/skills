---
name: reel-pipeline
description: Flujo de trabajo completo de un reel, de punta a punta, en el orden en que se hace. Usar cuando el usuario pase un reel y pida armar todo el proceso ("te paso el reel", "armá todo el flujo del reel", "hacé el pipeline", "reel pipeline"). Solo marca el orden y llama a las otras skills; cada una sigue funcionando también por separado.
---

# Reel Pipeline

Este es el orden de trabajo con un reel. Cada paso lo hace su skill, con sus propias reglas.

1. **Te paso el reel.** `social-video-producer` crea los subtítulos, la portada (frame 0), el caption, el mensaje de respaldo (`dm-reply`) y la carpeta de entrega. Se la muestro y espero la aprobación del video, la portada y el caption.
2. **Aprobado → Drive.** `social-video-producer` sube la carpeta a la unidad compartida (Reels).
3. **Página del recurso.** `resource-page` crea la página del recurso y devuelve su URL.
4. **Automatización de respuestas.** `replykaro-automation` crea la automatización de comentario a DM con esa URL.
5. **Publicación.** `post-for-me` publica en LinkedIn, TikTok y YouTube Shorts. Instagram se sube a mano desde Edits.
6. **Cierre.** Le devuelvo al usuario la carpeta de entrega, la URL de la página y los links de lo publicado.
