---
name: replykaro-automation-community
description: Guía paso a paso a cualquier persona para automatizar las respuestas de Instagram con ReplyKaro (replykaro.com), la alternativa gratuita a ManyChat. "Comentá la palabra y te mando el link por DM", con follow gate opcional. Acompaña desde cero, crear la cuenta, sacar la clave de la API y guardarla sin pegarla en el chat, y después le hace a la persona todas las preguntas sobre su negocio y su publicación para dejar la automatización creada, verificada y probada. Usar cuando alguien pida automatizar respuestas o DMs de Instagram, "comentá X y te lo mando", una alternativa a ManyChat, configurar ReplyKaro, crear, editar, listar o borrar una automatización de ReplyKaro, o mandar un link, PDF, catálogo o recurso por DM a quien comente. No publica nada en Instagram.
---

# ReplyKaro para cualquier negocio: comentario → DM

Esta skill acompaña a una persona que **puede no saber nada técnico** a dejar funcionando en su Instagram la automatización "comentá la palabra y te mando el link por DM", usando [ReplyKaro](https://www.replykaro.com) (plan gratis, sin tarjeta). Vos hacés el trabajo técnico; ella solo responde preguntas y hace los pasos que necesitan su cuenta (registrarse, crear la clave).

El flujo tiene 6 pasos. Andá de a uno, confirmá que cada paso quedó hecho antes de pasar al siguiente, y no avances con supuestos.

1. Requisitos
2. Cuenta en ReplyKaro
3. Clave de la API (sin pasar por el chat)
4. Entrevista sobre el negocio y la publicación
5. Vista previa, aprobación y creación
6. Prueba y publicación

## Cómo hablarle a la persona

- En su idioma y con su forma de hablar (vos, tú o usted: la que use ella). Palabras simples, sin jerga. Si aparece un término técnico inevitable ("clave de la API", "follow gate"), explicalo en una línea.
- **Una pregunta o un paso por mensaje** cuando le pidas que haga algo en su cuenta. Las preguntas de la entrevista pueden ir en bloques cortos (de 2 a 4), con un ejemplo en cada una.
- Siempre proponé un texto ya escrito para que ella lo apruebe o lo cambie, en vez de pedirle que escriba desde cero.
- No inventes cómo funciona ReplyKaro. Si algo no está en esta skill ni en la web de ReplyKaro ([guía](https://www.replykaro.com/how-to/auto-dm-instagram), [API](https://www.replykaro.com/docs/api), [preguntas frecuentes](https://www.replykaro.com/faq)), revisalo ahí antes de afirmarlo.

## 1. Requisitos

- **Instagram profesional** (de empresa o de creador). Las cuentas personales no pueden usar la mensajería automática de Instagram. Si la suya es personal: Instagram → Configuración → Tipo de cuenta y herramientas → Cambiar a cuenta profesional. Es gratis y se puede volver atrás.
- **Node.js 18 o más nuevo** en la computadora (`node --version`). Si no está, ayudala a instalarlo desde nodejs.org.
- No hace falta página de Facebook: ReplyKaro se conecta iniciando sesión con Instagram.

## 2. Cuenta en ReplyKaro

1. Que entre a https://www.replykaro.com y toque **Start free / Connect Instagram**.
2. Que inicie sesión con su Instagram y acepte los permisos. ReplyKaro nunca le pide la contraseña: el inicio de sesión lo hace Instagram.
3. Que te confirme que ve el panel (Dashboard) con su cuenta conectada.

Contale lo que trae el **plan gratis**, sin vencimiento ni tarjeta: 1 cuenta de Instagram, **3 automatizaciones activas a la vez**, 1.000 DMs por mes, follow gate incluido y **100 llamadas por mes a la API** (lo que usa esta skill). Los planes pagos suben esos límites; los precios están en la web y pueden cambiar, así que no los prometas: que los mire ahí si le interesan.

## 3. La clave de la API (nunca por el chat)

La clave es como una contraseña de su cuenta de ReplyKaro. **Nunca le pidas que la pegue en el chat**, y si la pega (o la muestra en una captura), decile enseguida que la borre en ReplyKaro y genere otra.

1. En ReplyKaro: **Dashboard → Developer API** (https://www.replykaro.com/dashboard/developer) → crear una clave nueva.
2. Permisos: alcanza con **`read`** y **`automations:write`**. No hace falta `full`.
3. Que copie la clave (empieza con `rk_live_`). No la pega en ningún lado todavía.
4. Que abra **su propia terminal** (no el chat) y corra:

   ```
   node "<skill-dir>/scripts/replykaro.mjs" setup
   ```

   El comando le pide la clave sin mostrarla en pantalla, la verifica contra ReplyKaro y la guarda en `~/.replykaro/keys.json` (en su usuario, fuera de cualquier proyecto). Escribile el comando ya completo, con la ruta real de la skill, para que solo tenga que copiarlo.
   - Si maneja más de una cuenta de Instagram, una clave por cuenta: `setup --account <alias>` (por ejemplo `--account tienda`), y después `--account <alias>` en cada comando.
5. Verificá vos que quedó bien:

   ```
   node "<skill-dir>/scripts/replykaro.mjs" check
   ```

   Tiene que mostrar su usuario de Instagram y el plan. Si da 401, la clave está mal copiada o le faltan permisos: que genere otra y repita `setup`.

## 4. Entrevista: lo que necesitás saber para armarla bien

El objetivo es que la automatización quede hecha **para su negocio**, no una genérica. Preguntá todo esto (en bloques cortos, con ejemplos) y no completes con suposiciones lo que ella no dijo.

**Sobre el negocio**
1. ¿A qué se dedica tu cuenta o negocio, y a quién le habla? (para el tono de los mensajes)
2. ¿Cómo le hablás a tu público: de vos, de tú o de usted? ¿Usás emojis?

**Qué recibe la persona que comenta**
3. ¿Qué le vas a mandar por DM? (un PDF, una guía, un catálogo, un descuento, un turno, tu WhatsApp, una página…) y ¿cómo se llama?
4. ¿Cuál es el link exacto? Tiene que ser una URL completa (`https://…`) que se abra sin iniciar sesión. Si el recurso es un archivo en su computadora, ayudala a subirlo a algún lado con link público (Google Drive con "cualquier persona con el enlace", su web, etc.) y probá que abra.

**En qué publicación**
5. ¿En qué publicación funciona?
   - **la próxima que subas** (lo normal si todavía no la publicaste: queda atada al próximo post o reel de la cuenta, el que sea),
   - **la última que subiste**,
   - **una publicación puntual** (corré `media` y que elija de la lista),
   - **todas las publicaciones** (cualquier post donde comenten la palabra).

**La palabra clave**
6. ¿Qué palabra tienen que comentar? Recomendá una sola palabra corta y poco común, relacionada con lo que se lleva (por ejemplo RECETAS, CATÁLOGO, GUÍA). Tiene que aparecer en el texto de la publicación y, si es un video, también dicha o escrita en el video.

**Seguidores (follow gate)**
7. ¿Querés que solo lo reciba quien te sigue? Si dice que sí, ReplyKaro le pide que te siga y le da un botón "Ya te sigo" para destrabarlo. Sirve para ganar seguidores; si su objetivo es llegar a más gente sin fricción, puede ir sin.

**Los textos** (proponelos vos, con el tono de la pregunta 2, y que ella los apruebe o cambie)
8. **Saludo y primer mensaje**: lo primero que llega por DM, con un botón para pedir el recurso (por ejemplo "Gracias por comentar 🙌 Tocá el botón y te lo mando").
9. **Mensaje del follow gate** (solo si respondió que sí en la 7): el pedido de seguir, el texto del botón de seguir, el del botón "Ya te sigo" y el mensaje si toca "Ya te sigo" sin seguir.
10. **Mensaje final**: el que acompaña al botón con el link. Corto y sin el link en el texto (el link va en el botón).
11. **Respuestas públicas**: 3 variantes cortas que ReplyKaro alterna como respuesta al comentario. Que avisen que revise también las **solicitudes de mensajes**: Instagram a veces manda esos DMs ahí, sobre todo a quien no te sigue.

Límites que tenés que respetar al proponer: **cada botón tiene como máximo 20 caracteres** (contalos) y cada mensaje como máximo 1.000.

## 5. Vista previa, aprobación y creación

1. Escribí las respuestas en un archivo JSON con el formato de `references/ejemplo-automatizacion.json` (por ejemplo `replykaro-<palabra>.json` en la carpeta donde estés trabajando). Campo `target`: `next`, `latest`, `all` o el id de la publicación.
2. Mostrale a la persona **cómo va a ser la conversación, en orden**, como la va a vivir quien comenta:
   - responde en público: (una de las 3 respuestas)
   - DM: saludo + primer mensaje + [botón]
   - si no te sigue: pedido de seguir + [Seguir] [Ya te sigo]
   - DM final: mensaje final + [botón con el link]

   Más la palabra, la publicación y el link. **Esperá su OK explícito** antes de crear. Si cambia algo, actualizá el JSON y volvé a mostrar.
3. Revisá sin crear nada (no gasta cuota):

   ```
   node "<skill-dir>/scripts/replykaro.mjs" create --config replykaro-<palabra>.json --dry-run
   ```

4. Creá:

   ```
   node "<skill-dir>/scripts/replykaro.mjs" create --config replykaro-<palabra>.json
   ```

   El script relee lo que quedó guardado en ReplyKaro y falla si algún texto o el link no coincide.
   - **Plan gratis con 3 activas:** el script frena y lista las activas. **Nunca borres una por tu cuenta**: preguntale cuál quiere sacar (o si prefiere pasarse a un plan pago) y recién con su respuesta corré `create ... --replace <id>`.
   - `duplicate key ... specific_post`: esa publicación ya tiene una automatización. Ofrecé editar la existente (`update`) en vez de crear otra.
   - `duplicate key ... keyword ... active` con `target: next`: ya hay otra automatización esperando al próximo post con esa palabra. Preguntale si la reemplaza (editarla con `update`) o si usa otra palabra.

## 6. Prueba y publicación

- **Cómo probar:** comentar la palabra **desde otra cuenta** (no la propia). ReplyKaro responde **una sola vez por persona y por automatización**: si esa cuenta ya comentó, volver a comentar no hace nada, aunque borre el comentario. Para probar de nuevo, otra cuenta.
- **Follow gate:** la prueba real es comentar desde una cuenta que **no** la sigue: no tiene que recibir el link hasta seguirla y tocar "Ya te sigo".
- Si el DM no aparece, que mire en **Solicitudes** y **Solicitudes ocultas** de Instagram.
- **Si eligió "la próxima publicación":** la automatización se engancha al próximo post o reel que suba esa cuenta, el que sea. Avisale que el próximo que suba sea el correcto; si sube otro antes, se lo lleva ese.
- Recordale poner la palabra en el texto de la publicación ("Comentá RECETAS y te lo mando por DM").
- Al terminar, resumile qué quedó creado (palabra, publicación, link, follow gate) y cómo pedirte cambios.

## Después: editar, listar, borrar

| Para | Comando |
|---|---|
| Ver las activas | `list` |
| Ver sus publicaciones con su id | `media` |
| Cambiar textos, link o botones de una existente | editar el JSON y `update --config <archivo> --id <id>` (no cambia la publicación: para otra publicación, crear otra) |
| Borrar una | `delete --id <id>`, **solo si la persona lo pidió** |

Para cambiar algo, preferí siempre `update` a borrar y volver a crear.

## Cuota de la API: no la gastes

El plan gratis trae **100 llamadas por mes** (se reinicia el día 1), y la cuota se comparte con lo que la persona use desde el panel. Cada comando gasta entre 1 y 4. Usá solo los necesarios: nada de `list` o `check` "para mirar". `--dry-run` no gasta.

## Sin cuota: cargarla a mano en el panel

Si la API responde `429` (se terminó la cuota del mes), guiala para cargar los mismos textos en la web, con el JSON aprobado a mano:

1. En el panel de ReplyKaro, crear una automatización nueva y elegir dónde corre (una publicación puntual, todas, o la próxima).
2. Palabra clave y respuestas públicas al comentario.
3. Saludo, primer mensaje y botón; si va con follow gate, prenderlo y cargar sus textos.
4. Mensaje final, link y texto del botón. Activarla.
5. Verificar que aparece activa en la lista de automatizaciones.

Los nombres exactos de los botones del panel pueden cambiar: guiala por lo que ve en pantalla.

## Reglas

- La clave nunca pasa por el chat, ni por un archivo del proyecto, ni por un commit. Solo `setup` en su terminal.
- Nunca borrar una automatización sin que la persona lo pida o lo elija.
- Nada se crea sin que la persona haya visto y aprobado la vista previa del paso 5.
- No publicar nada en Instagram: esta skill solo arma la automatización.
- No inventar funciones, precios ni límites de ReplyKaro: los de esta skill salen de su web; si algo no está, revisalo en la fuente.
