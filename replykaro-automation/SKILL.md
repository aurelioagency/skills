---
name: replykaro-automation
description: Crea en ReplyKaro la automatización "comentá la palabra y te mando el recurso por DM" con follow gate (solo recibe el recurso quien te sigue), para un reel que todavía no se subió (por defecto) o para un reel ya publicado. Usar cuando social-video-producer entrega un video con `dm-reply-<slug>.txt` y el usuario lo aprobó, o cuando el usuario pida crear/borrar/listar una automatización de ReplyKaro, "armá la automatización del reel", "pegale la automatización al último reel", "limpiá la más vieja". Habla con ReplyKaro por su endpoint MCP (la API REST simple no guarda los textos). No publica nada en Instagram.
---

# ReplyKaro — automatización de comentario a DM

Crea la automatización completa del asistente de 4 pasos de ReplyKaro (saludo, follow gate, mensaje final, botones, respuestas públicas) con un solo comando. La parte **fija** sale de `references/plantilla-base.json`; lo único que cambia por reel es el mensaje final y el link del recurso.

## Por qué MCP y no la API REST

`https://www.replykaro.com/api/v1/automations` solo guarda palabra clave, follow gate (prendido/apagado), respuestas públicas y un botón. **Ignora** en silencio el saludo, los textos del follow gate, el mensaje final y los botones extra (probado tres veces, 2026-10-06). El endpoint `https://www.replykaro.com/api/mcp` (herramienta `create_automation`) sí guarda todo, con tildes y emojis. El script usa MCP para crear y REST solo para listar, leer y borrar. Siempre releer lo guardado: el script lo hace y falla en voz alta si algo no quedó.

## Claves

Viven **fuera del repo**, en `%USERPROFILE%\.replykaro\keys.json`:

```json
{ "personal": "rk_live_...", "aurelio": "rk_live_..." }
```

Cada cuenta de Instagram tiene su propio panel de ReplyKaro y su propia clave (Panel → Developer API → Nueva clave, permisos de lectura y de automatizaciones). Nunca pegar una clave en el chat ni commitearla. Si el usuario la muestra en una captura, decirle que la revoque.

Cuentas hoy: `personal` (@ing.gustavopaz) y `aurelio` (@lacasadeaurelio), las dos con clave. El mismo reel se sube a las dos.

## Uso

Script: `node "<skill-dir>\scripts\replykaro.mjs" <comando> [--account <nombre|a,b|all>] ...`. Sin `--account`, `create`, `list` y `check` actúan sobre **todas** las cuentas de `keys.json` (personal y aurelio); si una falla, la otra sigue y el script termina con error.

| Comando | Qué hace |
|---|---|
| `check` | Verifica la clave e imprime el usuario de Instagram |
| `create` | Crea la automatización (ver abajo) |
| `list` | Lista las activas, de la más vieja a la más nueva |
| `media` | Lista los posts/reels de la cuenta con su id |
| `update --account <n> --id <id> --link ... --button ... --name ...` | Edita en el lugar saludo, mensaje final, link y botón. **Usar esto, no borrar y recrear** |
| `delete --id <id>` | Borra una automatización |

### `create`

```
node "<skill-dir>\scripts\replykaro.mjs" create --target next ^
  --dm-reply "<ruta>\dm-reply-<slug>.txt" --button "Abrir Scrapling"
```

- `--target next` (**default**): el próximo reel que se suba (`NEXT_MEDIA`). Es el caso normal: el video sale al Drive aprobado, el usuario lo sube a mano después.
- `--target latest`: el último reel ya publicado. `--target <media_id>`: uno puntual (ver `media`).
- `--link`: la URL de la página del recurso (skill `resource-page`). Si falta, se toma del `--dm-reply` su URL (la de la página del recurso). Es el único link que sale: va en el botón, no en el texto.
- `--dm-reply`: es el mensaje de respaldo para mandar a mano; acá solo se lee para sacar la URL de la página. No aporta texto al mensaje de la automatización.
- **Mensaje final** (junto al botón): se genera solo, creativo y sin links: `Acá tenés <name> 🚀` + salto de línea + `Tocá el botón de abajo y entrá.` Cambiarlo solo con `--final-message`. `--name` es el nombre del recurso (si falta usa el texto del botón).
- `--button`: texto del botón del recurso, **máximo 20 caracteres** (si no se pasa, "Abrir recurso"). Elegirlo según lo que es el recurso ("Abrir Scrapling", "Ver el repo", "Descargar guía").
- `--dry-run`: arma y muestra exactamente lo que enviaría `create_automation`, sin crear ni borrar nada. Usarlo para revisar el resultado antes de crear.
- `--keyword`: solo para pruebas. La palabra de producción es siempre **Aurelio**.

El mensaje final no lleva links ni datos del recurso: solo la frase corta junto al botón (voseo, palabras simples).

## Botones

**Un solo botón de link por automatización: el del recurso (la URL de la página).** Sin botones de Skool ni de Aurelio Agency (`additional_buttons` vacío). El botón del saludo dice `Quiero el recurso!` (con signo de exclamación). Confirmado con el usuario el 2026-10-07.

## Saludo

`reply_message` de la plantilla lleva un salto de línea: `Gracias por comentar 🙌🏻` / `Tocá el botón de abajo y te lo mando enseguida.` No juntarlo en una línea.

## Límite del plan gratis: 3 activas

Antes de crear, el script cuenta las activas **de cada cuenta**; si ya hay 3 **borra la más vieja** para dejar lugar y lo informa en la salida. Esto lo pidió el usuario y se verifica siempre, en cada creación. La API no impone el límite al crear (se probó con 4 activas y ninguna quedó pausada), así que el borrado es para no depender de cómo lo controle ReplyKaro al llegar los comentarios.

## Errores conocidos

- `duplicate key ... idx_unique_specific_post_primary_active`: ese reel ya tiene automatización. No crear otra: usar la existente o borrarla.
- `NEXT_MEDIA` solo se aplica al próximo post que publique esa cuenta. Si el usuario sube otro post antes, se lo lleva ese. Avisarle que el próximo post sea el reel.
- Sin acceso a Internet o clave revocada: el script termina con `ERROR:` y el motivo. Fallback manual: pegar los textos en el asistente de ReplyKaro (paso 1 "Próximo post / reel").

## Estado final correcto (verificado en producción, 2026-10-07)

Las dos cuentas (personal y aurelio) llevan **exactamente lo mismo**; solo cambia el `media_id`:

- Saludo `Aurelio a su servicio!`, y `reply_message` con salto de línea: `Gracias por comentar 🙌🏻` / `Tocá el botón de abajo y te lo mando enseguida.`
- Botón del saludo `Quiero el recurso!`; follow gate prendido; palabra `Aurelio`.
- Mensaje final sin links (`Acá tenés <nombre> 🚀` / `Tocá el botón de abajo y entrá.`) y **un solo botón** de link: el del recurso, con la URL de la página. Sin Skool ni Aurelio Agency (`additional_buttons` vacío).
- Comentario público sin paréntesis y con el emoji al final (`Listo, revisá tus mensajes y las solicitudes, por las dudas 🙌`).

Para comparar las dos cuentas: `list_automations`/`get_automation` por MCP o `GET /automations/<id>` por REST, y diff de los campos (todo igual salvo `media_id`).

## Reel ya subido o ajustes después de crear

- **No borrar y recrear: editar con `update`** (`update_automation` por MCP). El comando `update` del script reaplica saludo, botones, mensaje y link y relee lo guardado. `update_automation` **no** acepta cambiar `media_id`.
- `NEXT_MEDIA` se convierte en el id del reel cuando Instagram avisa del post; puede tardar un rato en una de las cuentas. Si ya lo subieron, mirar `media` y `get_automation` antes de tocar nada.
- Antes de crear, comprobar si el reel ya tiene automatización (el error `duplicate key` lo avisa) y usar `update`.

## Cómo probar

**ReplyKaro responde una sola vez por persona y por automatización.** Si una cuenta ya comentó la palabra, volver a comentar (aunque borre el comentario) no genera nada, ni siquiera un log de error (`get_dm_logs` muestra un solo envío). Para probar un cambio hay que comentar desde **otra cuenta que siga a la del reel**. No hay ajuste en la API para repetir el envío a la misma cuenta.

## Mensajes que caen en "Solicitudes ocultas"

Instagram puede mandar el DM de una cuenta que la persona no sigue a "Solicitudes" o "Solicitudes ocultas" (pasó en la prueba del 2026-10-06, con el estado SENT en ReplyKaro). Por eso las 3 respuestas públicas de `plantilla-base.json` avisan que lo busquen ahí. No quitar ese aviso.

## Verificación

El script relee la automatización creada y falla si el follow gate, el saludo, el texto del botón de seguir, el botón final o el link no quedaron como se pidió. La única prueba real del follow gate es comentar la palabra desde una cuenta que **no** siga a la del reel: no debe recibir el recurso hasta seguir.
