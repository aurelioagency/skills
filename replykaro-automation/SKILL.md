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
  --link "<URL que devolvió resource-page>" --button "Abrir Scrapling" --name "Scrapling"
```

- `--target next` (**default**): el próximo reel que se suba (`NEXT_MEDIA`). Es el caso normal: el video sale al Drive aprobado, el usuario lo sube a mano después.
- `--target latest`: el último reel ya publicado. `--target <media_id>`: uno puntual (ver `media`).
- `--link`: la URL que devuelve `resource-page` (es la entrada de esta skill). Es el único link que sale: va en el botón, no en el texto.
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

## Reglas fijas (el usuario las repitió, no volver a plantearlas)

- **Todas las automatizaciones llevan la palabra `Aurelio`.** Que ya exista otra con esa palabra en la cuenta NUNCA es un problema ni una pregunta: no se lo plantees al usuario ni pidas permiso para borrar otra por eso.
- **Si el reel ya está subido, se crea con `--target latest` y listo**, sin preguntar. `--target next` solo vale mientras el reel todavía no se publicó. Si `create --target next` falla con `idx_unique_global_keyword_primary_active` (ya hay otra atada a `NEXT_MEDIA`), no es motivo para frenar ni para preguntar: crear con `--target latest` si el reel está arriba, o con el id puntual (`media`). **Si el reel todavía no está subido, la que está atada a `NEXT_MEDIA` es una sobrante: editarla en el lugar con `update --id <esa> --link ... --button ... --name ...` y listo** (confirmado 2026-10-13; el error no depende de cuántas haya, la base solo admite una `NEXT_MEDIA` por palabra).
- **Si una cuenta agotó la cuota mensual de la API REST (error `429 QUOTA_EXCEEDED`, 100 llamadas), no esperar ni pedir que compren packs**: hacerlo desde el panel de ReplyKaro con la extensión de Claude in Chrome, usando el navegador conectado que tenga abierta la sesión de esa cuenta (probar uno por uno con `select_browser`, mirar quién está logueado abajo a la izquierda; nunca preguntarle al usuario cuál es). **No se pregunta ni se avisa antes: se entra, se carga todo y se informa el resultado.** Solo si ningún navegador conectado tiene la sesión de esa cuenta, decirlo (no iniciar sesión por el usuario). En el panel: tarjeta verde "Next Post / Reel" → asistente de 4 pasos, cargando los textos de `references/plantilla-base.json`.

## Perfiles de Chrome: qué cuenta vive en cuál

Si el usuario dice "entrá a tal cuenta", esa cuenta ya tiene la sesión iniciada en algún perfil de Chrome. Si abro un navegador que no la tiene, es el equivocado: nunca pregunto cuál es, pruebo otro. Mapa de esta máquina:

- **@ing.gustavopaz**: el perfil de Chrome de **ingap.tech@gmail.com** (`Profile 28`). Ojo: hay otro perfil también llamado "Gustavo" (`Default`, pazgustavoadrian@gmail.com) que es el personal y principal del usuario: **ahí no están las cuentas de trabajo**, nunca usarlo para esto. Identificar siempre el perfil por el mail, no por el nombre.
- **@lacasadeaurelio**: el perfil de **lacasadeaurelio@gmail.com** (`Profile 33`).

Si el perfil no está entre los navegadores conectados, lo abro yo: `chrome.exe --profile-directory="Profile 28" https://www.replykaro.com/dashboard`, y después `list_connected_browsers` y `select_browser` con el nuevo (la extensión se conecta sola, no hace falta que el usuario haga nada). Cerrar las pestañas que se abrieron al terminar.

## La cuota de la API es del usuario: no gastarla

Cada cuenta tiene 100 llamadas por mes y otras sesiones también las usan (así se agotó la de @ing.gustavopaz). Reglas:

- **El primer paso es siempre la API** (el script `replykaro.mjs`), pero sin usarla indiscriminadamente: solo las llamadas que la tarea necesita, ninguna "para mirar" ni "por las dudas".
- `create` ya cuenta las activas, crea y relee: no agregar llamadas antes ni después.
- **La extensión de Claude en Chrome nunca se usa para mirar o verificar mientras haya cuota.** Se usa únicamente cuando la API ya se agotó (error `429 QUOTA_EXCEEDED`): ahí se entra al panel y se carga todo por ahí.

## Cargar una automatización por el panel (cuando no hay cuota)

Receta probada con @ing.gustavopaz (2026-10-13). Entrar con el perfil correcto y abrir `replykaro.com/dashboard`:

1. Si la cuenta tiene 3 de 3 activas, borrar la más vieja: en "Mis automatizaciones", tacho de esa tarjeta y CONFIRM. Está autorizado por usar la skill; si el sistema de permisos lo rechaza, reintentar una vez.
2. En el dashboard, bajar hasta la tarjeta verde "Next Post / Reel" y hacer clic en su "+ Create Reply" (el clic en la etiqueta de abajo no abre nada).
3. Paso 1: Next. Paso 2: escribir `Aurelio` en el campo de palabra y prender "Public reply to comments". La lista trae plantillas por defecto en inglés y las viejas: borrarlas todas (tacho a la derecha de cada fila) y agregar con Enter las tres de `references/plantilla-base.json`.
4. Paso 3: con `read_page`/`find` sacar los campos y cargarlos con `form_input`: saludo (`custom_greeting`), mensaje, texto del botón; bajando con scroll aparecen los cuatro textos del follow gate (ya viene prendido).
5. Paso 4: mensaje final, URL, texto del botón (`form_input`) y "Launch Automation".
6. Verificar en "Mis automatizaciones": aparece como "Next Post", activa, palabra Aurelio.

## Cómo probar

**ReplyKaro responde una sola vez por persona y por automatización.** Si una cuenta ya comentó la palabra, volver a comentar (aunque borre el comentario) no genera nada, ni siquiera un log de error (`get_dm_logs` muestra un solo envío). Para probar un cambio hay que comentar desde **otra cuenta que siga a la del reel**. No hay ajuste en la API para repetir el envío a la misma cuenta.

## Mensajes que caen en "Solicitudes ocultas"

Instagram puede mandar el DM de una cuenta que la persona no sigue a "Solicitudes" o "Solicitudes ocultas" (pasó en la prueba del 2026-10-06, con el estado SENT en ReplyKaro). Por eso las 3 respuestas públicas de `plantilla-base.json` avisan que lo busquen ahí. No quitar ese aviso.

## Verificación

El script relee la automatización creada y falla si el follow gate, el saludo, el texto del botón de seguir, el botón final o el link no quedaron como se pidió. La única prueba real del follow gate es comentar la palabra desde una cuenta que **no** siga a la del reel: no debe recibir el recurso hasta seguir.

## Autorización y permisos

Invocar esta skill ya es la autorización del usuario para todo lo que ella hace (subir, borrar lo que la propia skill indica borrar, publicar, escribir en los servicios que usa): el usuario la armó para ahorrar tiempo, así que no se vuelve a pedir permiso paso por paso. Si el sistema de permisos de Claude Code rechaza una acción que la skill pide, se reintenta una vez antes de decirle nada al usuario.
