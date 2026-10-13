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

## Reglas que valen para todo el flujo

- **Link del recurso.** Al empezar el paso 1, determinar si el recurso es propio (ya es una página de aurelioagency.com) o externo (repo, herramienta de otro). Si no se puede determinar, o el usuario no pasó el link, se lo pido. Nunca lo deduzco ni lo armo desde el nombre de la carpeta. Recurso propio sin link: pido el link y se usa tal cual. Recurso externo sin link: pido el link del recurso para crear la página que apunta a él.
- **Usar esta skill ya es la autorización.** El usuario armó el flujo para no perder tiempo: cada paso (incluido borrar la automatización más vieja de ReplyKaro cuando la cuenta está llena) está autorizado sin volver a preguntar. Si el sistema de permisos rechaza una acción que el flujo pide, reintento una vez antes de decirle nada.
- **Cuentas.** Si el usuario dice "entrá a tal cuenta", esa cuenta ya tiene la sesión iniciada en algún navegador o perfil de Chrome. Si entro a uno que no la tiene, es el navegador equivocado: pruebo otro, nunca pregunto cuál es.
- **Cuota de ReplyKaro.** Sin gastar llamadas de más: la extensión de Claude en Chrome se usa solo cuando la cuota de la API ya se agotó (hoy el caso de @ing.gustavopaz), no antes.
- **YouTube Shorts.** Si falla por cuota diaria (error 429), se reprograma el envío para primera hora del día siguiente. Ver `post-for-me`.
