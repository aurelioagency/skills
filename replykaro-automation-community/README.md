# ReplyKaro Community: respuestas automáticas de Instagram, gratis

Una skill para Claude Code (y agentes parecidos) que te deja funcionando en tu Instagram la automatización **"comentá la palabra y te mando el link por DM"** con [ReplyKaro](https://www.replykaro.com), la alternativa gratuita a ManyChat.

No hace falta saber nada técnico. La skill te acompaña paso a paso:

1. Revisa que tu Instagram sea profesional (de empresa o de creador).
2. Te guía para crear tu cuenta en ReplyKaro (gratis, sin tarjeta).
3. Te ayuda a sacar tu clave de la API y a guardarla en tu computadora **sin pegarla nunca en el chat**.
4. Te hace las preguntas necesarias sobre tu negocio: qué querés mandar, en qué publicación, qué palabra van a comentar, si solo lo reciben tus seguidores, y con qué tono.
5. Te escribe todos los mensajes, te muestra cómo va a ser la conversación completa y espera tu OK.
6. Crea la automatización, revisa que haya quedado guardada tal cual y te explica cómo probarla.

Nunca publica nada en tu Instagram y nunca borra una automatización tuya sin preguntarte.

## Qué hay en esta carpeta

| Archivo | Para qué |
|---|---|
| [SKILL.md](SKILL.md) | La guía que sigue el agente: los 6 pasos, la entrevista, los límites y cómo probar |
| [scripts/replykaro.mjs](scripts/replykaro.mjs) | El comando que habla con ReplyKaro: `setup`, `check`, `media`, `list`, `create`, `update`, `delete` |
| [references/ejemplo-automatizacion.json](references/ejemplo-automatizacion.json) | Un ejemplo completo (una pastelería que regala su recetario) |

## Instalación

**Opción A: que la instale tu agente (recomendada).** Abrí Claude Code y pegá esto:

```text
Instalá la skill replykaro-automation-community desde https://github.com/aurelioagency/skills :
1. Corré: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git en una carpeta temporal.
2. Adentro, corré: git sparse-checkout set replykaro-automation-community
3. Copiá la carpeta replykaro-automation-community/ a ~/.claude/skills/replykaro-automation-community/
4. Borrá el clon temporal y confirmá que la skill carga.
5. Revisá que tenga Node.js 18 o más nuevo.
6. Explicame cómo se usa y preguntame si arrancamos ya con mi primera automatización.
```

**Opción B: a mano.** Cloná el repo y corré el instalador:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs replykaro-automation-community
```

## Cómo se usa

Con la skill instalada, pedíselo a tu agente con tus palabras:

> Quiero que cuando comenten RECETAS en mi próximo reel les llegue el PDF por DM

> Ayudame a configurar ReplyKaro desde cero

> Cambiá el link de la automatización que hicimos

## Lo que tenés que saber de ReplyKaro (plan gratis)

- Tu Instagram tiene que ser **profesional** (de empresa o de creador). No hace falta página de Facebook.
- **3 automatizaciones activas** a la vez y **1.000 DMs por mes**.
- **100 llamadas por mes a la API**, que es lo que usa la skill. Alcanza de sobra para crear y ajustar tus automatizaciones. Si se terminan, la skill te guía para cargarla a mano en el panel.
- ReplyKaro responde **una sola vez por persona y por automatización**: para probar, comentá desde otra cuenta.

Los precios y límites pueden cambiar: los vigentes están en [replykaro.com](https://www.replykaro.com).

## Tu clave, segura

La clave de ReplyKaro es como una contraseña. La skill la guarda con el comando `setup`, que corrés en tu propia terminal y no la muestra en pantalla. Queda en `~/.replykaro/keys.json`, en tu usuario, fuera de cualquier proyecto. Si alguna vez la pegás en un chat o sale en una captura, borrala en ReplyKaro (Dashboard → Developer API) y generá otra.

## Requisitos

- Node.js 18 o más nuevo.
- Un Instagram profesional conectado a una cuenta de ReplyKaro.

## Licencia

MIT, ver [LICENSE](../LICENSE) en la raíz del repo.
