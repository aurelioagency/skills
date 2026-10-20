---
name: motion-reel-pipeline
description: Flujo de trabajo completo de un reel animado con motion-reel, de punta a punta, en el orden en que se hace. Usar cuando el usuario pase un video suyo hablando y pida armar todo el proceso con motion-reel ("te paso el reel para motion", "armá todo el flujo con motion-reel", "motion reel pipeline"). Es la versión de reel-pipeline con motion-reel en lugar de social-video-producer. Solo marca el orden y llama a las otras skills; cada una sigue funcionando también por separado.
---

# Motion Reel Pipeline

Este es el orden de trabajo con un reel animado. Cada paso lo hace su skill, con sus propias reglas.

1. **Te paso el reel.** `motion-reel` (rama B) anima el video, crea los subtítulos y la portada (frame 0). `social-video-producer` arma el caption, el mensaje de respaldo (`dm-reply`) y la carpeta de entrega, porque `motion-reel` no hace esas tres cosas. Se la muestro y espero la aprobación del video, la portada y el caption.
2. **Aprobado → Drive.** `social-video-producer` sube la carpeta a la unidad compartida (Reels).
3. **Página del recurso.** `resource-page` crea la página del recurso y devuelve su URL.
4. **Automatización de respuestas.** `replykaro-automation` crea la automatización de comentario a DM con esa URL.
5. **Publicación.** `post-for-me` publica en LinkedIn, TikTok y YouTube Shorts. Instagram se sube a mano desde Edits.
6. **Cierre.** Le devuelvo al usuario la carpeta de entrega, la URL de la página y los links de lo publicado.

## Qué es esta skill y qué no

Esta skill solo orquesta: marca el orden y llama a las otras skills. No lleva reglas propias. Toda regla o mejora de un paso va en la skill dueña de ese paso (`motion-reel`, `social-video-producer`, `resource-page`, `replykaro-automation`, `post-for-me`), porque cada una tiene que funcionar completa también cuando se usa por separado. No agregar reglas acá.
