# Audio y voz con Fish Audio (opcional)

Si el video necesita voiceover, usar **Fish Audio** en vez de una API de texto-a-voz que cobra por carácter. Su modelo S2.1 Pro es gratis sin límite de uso, soporta 83 idiomas y permite clonar voces. Es un paso opcional e independiente del render visual — se puede agregar en cualquier nivel de la progresión de prompts.

## Setup (una sola vez)

1. Crear una cuenta en Fish Audio (fish.audio).
2. En el dashboard de Fish Audio, ir a la página del **MCP** (conector para agentes). Ahí hay una opción para "claude.ai" — seleccionarla y copiar la URL de conexión que te da.
3. En Claude Code: Settings → **Connectors** → "Add custom connector". Poner nombre `Fish Audio` y pegar esa URL.
4. Una vez conectado, ir a **Tool Permissions** del conector y poner "Always allow" — si no, el agente va a pedir confirmación en cada llamada de audio, lo cual rompe el flujo cuando se está iterando rápido.

## Prompts de ejemplo

**Voiceover simple:**
```
Use Fish Audio to generate a voiceover for this script: "[SCRIPT TEXT]". The tone should be [e.g. energetic, calm, professional].
```
El modelo va a devolver varias opciones de voz para elegir.

**Clonar la voz del usuario:**
```
Clone my voice from this YouTube channel: [URL]. Keep the same script, but use my cloned voice, and add some [emotion, e.g. excitement].
```

## Notas

- No pagar nada ni dar datos de tarjeta para esto — el modelo S2.1 Pro es gratuito. Si en algún momento la cuenta pide un método de pago para seguir usándolo, avisar al usuario antes de ingresar cualquier dato.
- Nunca clonar la voz de otra persona sin su autorización explícita — esto solo está pensado para que el usuario clone su propia voz, o una voz para la que tenga permiso de uso.
- El audio generado se guarda dentro de la carpeta del proyecto (`opus-motion-studio\<slug>\render\` o una subcarpeta de audio), nunca se sube a ningún lado sin que el usuario lo pida.
