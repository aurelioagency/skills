---
name: generador-de-ganchos
description: Genera ganchos (hooks, enganches, aperturas) para contenido a partir de un tema, usando 10 estructuras psicológicas distintas y evaluando cuáles encajan mejor con ese tema en particular. Usar siempre que el usuario pida ganchos, hooks, enganches, aperturas, primeras líneas, títulos que retengan, o cuando pregunte cómo arrancar un reel, video, carrusel, post, blog o newsletter. Usar también cuando pase un tema en cualquier formato (texto, imagen, PDF, documento, link, transcript) y quiera saber cómo abrirlo, o cuando pida variantes de apertura para A/B testing. No hace falta que diga la palabra "gancho" — si el pedido es "hacé que esto enganche", "necesito que pare el scroll" o "cómo empiezo esto", también aplica. Aplica igual en cualquier idioma: "give me hooks", "how do I open this", "make this stop the scroll" disparan lo mismo.
---

# Generador de Ganchos

Convierte un tema en ganchos escritos, uno por cada estructura de gancho conocida, señalando cuáles encajan mejor con ese tema.

El gancho es la única parte del contenido que decide si el resto se consume. Todo lo demás se puede arreglar en la edición; esto no.

---

## Cómo funciona este skill

Un gancho no depende del rubro. Depende de **qué mecanismo psicológico activa**. El mismo mecanismo que hace funcionar un gancho de finanzas hace funcionar uno de ingeniería o de cocina: lo que cambia es el contenido, no la estructura.

Por eso el skill trabaja en dos capas separadas:

1. **Las 10 estructuras** (sección "Los 10 tipos"): universales, aplican a cualquier tema.
2. **El contexto de quien lo usa** (sección "Contexto: Aurelio"): define el mundo, el vocabulario y el tono con el que se rellenan esas estructuras.

Si alguien adapta este skill para otra marca, la capa 1 queda igual y solo se reescribe la capa 2.

**Nunca preguntes si el tema "entra" en algún rubro ni avises que un tema está fuera de lista.** No hay lista. Si el usuario trae un tema, se escribe.

---

## Paso 1 — Ingerir el tema

El tema puede llegar en cualquier formato:

| Formato | Qué hacer |
|---|---|
| Texto, idea suelta | Usar directo |
| Imagen, screenshot, captura | Leerla con `view` |
| PDF, docx, xlsx, csv | Leer el archivo del disco |
| Link / URL | `web_fetch` |
| Transcript | Usar directo |
| **Audio o video** | **No se puede transcribir en este entorno.** Pedir el transcript o la idea en texto. Decirlo directo, sin intentar workarounds que no van a funcionar. |

Si el tema viene muy crudo, no pidas un brief. Preguntá una sola cosa: **qué querés que la persona entienda o haga después de ver esto.** Con eso alcanza.

## Paso 2 — Leer el tema antes de escribir

Antes de escribir un solo gancho, respondé internamente. Esto es lo que después permite elegir bien:

- **Dolor**: ¿qué está perdiendo, sufriendo o haciendo mal la persona hoy?
- **Creencia**: ¿qué da por cierto sobre este tema que no lo es?
- **Vacío**: ¿qué no sabe que existe?
- **Solución**: ¿hay algo concreto para entregar al final?
- **Escena**: ¿hay una historia real o una imagen fuerte disponible?
- **Enemigo**: ¿contra qué está el contenido? (el proceso manual, la herramienta cara, el consultor que vendió humo)

Si ninguna se puede responder, el tema todavía no está listo: pedí contexto en vez de rellenar con genérico.

## Paso 3 — Evaluar qué encaja

Recorré los 10 tipos y preguntate, para este tema en particular, cuáles tienen material real.

**La cantidad de recomendados es un resultado, no una cuota.** Puede ser uno, pueden ser cuatro, pueden ser todos, puede ser ninguno. Un tema personal quizás solo funciona con identificación — decilo y no inventes dos más para llenar. Un tema neutro quizás no destaca ninguno — decilo también, y aclará que ahí la elección es por gusto o por variedad. Eso es información útil, no una falla.

Señales de encaje:

| Si el tema tiene... | Encaja |
|---|---|
| Una versión mal hecha muy común | Negativo / alerta |
| Una frustración conocida más que un error técnico | Identificación |
| Un autodiagnóstico posible | Pregunta |
| Una creencia instalada refutable con argumento real | Contraintuitivo |
| Una revelación concreta que justifica esperar | Curiosidad |
| Una solución específica para entregar al final | Problema-solución |
| Un contraste visual fuerte y disponible | Visual |
| Audiencia que ya te conoce y tema donde se subestima la dificultad | Desafío |
| Experiencia acumulada real que sostiene la afirmación | Autoridad |
| Una historia real con giro | Storytelling |

**El ajuste al tema manda sobre el ranking de potencia.** Un gancho de identificación bien puesto le gana a un negativo forzado. El ranking sirve para informar la decisión del usuario, no para filtrar.

## Paso 4 — Escribir los 10

Escribí un gancho por cada uno de los 10 tipos, siempre los 10, aunque alguno encaje flojo. Si uno encaja mal, escribí igual la mejor versión posible y decí por qué queda flojo — eso le sirve al usuario para descartarlo con criterio.

### Formato de salida

La plantilla está en español porque es el caso por default. **Si el usuario escribe en otro idioma, traducí también los títulos** — la salida entera va en el idioma de quien pregunta.

```markdown
# Ganchos: [tema en 4-6 palabras]

**Formato:** [reel / carrusel / post / blog / newsletter]
**Ángulo:** [una línea: el dolor, la creencia o el vacío que se ataca]

---

## Encajan mejor acá

### [Tipo] — [por qué encaja con ESTE tema, una línea]
> [gancho]
> [variante, otro ángulo del mismo tipo]

[...tantos como realmente encajen — uno, tres, seis, o ninguno]

---

## El resto

### [Tipo]
> [gancho]

[...los que quedan, hasta completar los 10]

---

**Nota:** [solo si hace falta — por ejemplo que un tipo quedó flojo y por qué, o que ninguno se despega]
```

Si ninguno destaca, reemplazá la sección "Encajan mejor acá" por una línea que lo diga y listá los 10 parejos.

---

## Los 10 tipos

Ordenados por poder de retención general. Ese orden es información, no instrucción: el que encaja con el tema le gana al que está más arriba.

### 1. Negativo / alerta

**Mecanismo:** activa supervivencia. El cerebro detecta pérdida, error y peligro antes que oportunidad. La persona no quiere ganar tanto como quiere evitar perder.

**Estructura:** afirmás que algo que ya está haciendo la está perjudicando, y que no lo ve. Presente continuo — el daño está ocurriendo ahora. Sin nombrar la causa. Su cabeza entra en *"¿seré yo?"* y no puede scrollear hasta saberlo.

**Señal de que salió bien:** el lector se siente aludido personalmente, no advertido en general.
**Señal de que salió mal:** suena a titular de nota, no a algo que le pasa a él.

**Cuidado:** usado en todo, la cuenta se vuelve alarmista y pierde credibilidad.

> "Esa automatización que armaste se va a romper en tres semanas y no te vas a enterar."
> "Estás pagando por tokens que tu agente ni usa."
> "Cobrás por hora y por eso tu agencia no crece."

### 2. Identificación

**Mecanismo:** conexión. La persona siente *"eso soy yo"*. Cuando alguien se siente visto, se queda.

**Estructura:** describís una situación específica y cotidiana que la persona vive, con suficiente detalle como para que sienta que la estás mirando. El patrón más fuerte es el contraste entre lo que hace y lo que consigue: *"hacés X… pero pasa Y"*. Segunda persona, presente, sin solución.

**Señal de que salió bien:** el detalle es tan específico que no se puede haber escrito para cualquiera.
**Señal de que salió mal:** describe a todo el mundo, entonces no describe a nadie.

> "Armás un flujo, lo dejás andando, y a la semana algo se rompió sin que toques nada."
> "Le pedís algo a la IA, sale mal, y terminás haciéndolo a mano igual."
> "Sabés exactamente qué hay que refactorizar y hace seis meses que no lo tocás."

### 3. Pregunta

**Mecanismo:** diálogo interno. La persona no solo mira: **responde mentalmente**. Ese micro-compromiso la retiene.

**Estructura:** una pregunta sobre una experiencia real, que la obligue a autodiagnosticarse. La respuesta tiene que ser incómoda o reveladora.

**Señal de que salió bien:** la persona no puede contestar rápido, o contesta y no le gusta la respuesta.
**Señal de que salió mal:** es retórica, la respuesta es obvia, o se contesta con un "no" y chau.

> "¿Cuántas de tus automatizaciones sabés con certeza que están andando ahora mismo?"
> "¿Tu agencia sigue funcionando si te tomás dos semanas?"
> "¿Cuánto tardarías en levantar tu proyecto en una máquina nueva?"

### 4. Contraintuitivo

**Mecanismo:** disonancia. Decís algo que suena mal y por eso engancha. La persona piensa *"eso no tiene sentido, explicame"*.

**Estructura:** atacás una creencia que la audiencia efectivamente tiene. Afirmación corta y sin matizar — el matiz va en el desarrollo, no en el gancho.

**Señal de que salió bien:** podés defenderlo con un argumento real en el cuerpo.
**Señal de que salió mal:** es un hombre de paja, o es provocación que después no sostenés.

> "Automatizar todo puede hacerte perder plata."
> "El mejor modelo no siempre da el mejor resultado."
> "Escribir menos código puede hacer tu sistema más frágil."

### 5. Curiosidad

**Mecanismo:** el cerebro odia los vacíos. Si detecta que hay algo que no sabe y le conviene saber, quiere cerrarlo.

**Estructura:** información deliberadamente incompleta. Señalás que existe algo — un paso, una razón, un detalle — sin decir cuál.

**Señal de que salió bien:** el vacío se llena bien en el contenido y la espera valió la pena.
**Señal de que salió mal:** es clickbait. La audiencia lo registra y la próxima no espera.

**Cuidado:** en blog y newsletter rinde peor que en video — en texto largo se lee como truco.

> "Hay un paso que casi nadie agrega a sus flujos y es el que evita el 80% de las fallas."
> "Hay una razón por la que tu agente responde bien en pruebas y mal en producción."
> "Hay una función en la herramienta que ya usás que reemplaza a otras dos que pagás."

### 6. Problema-solución

**Mecanismo:** expectativa concreta. Los otros tipos retienen por incomodidad o por vacío; este retiene porque la persona **ya sabe que hay salida** y se queda a buscarla. Deja de ser una apuesta y pasa a ser una espera.

**Estructura:** nombrás un problema reconocible y en la misma apertura confirmás que existe solución, sin decir cuál. Dolor + prueba de que hay salida. Después va el desarrollo, y la solución se entrega al final.

**Lo que lo distingue:** es el único tipo que **condiciona el contenido entero**, no solo la apertura. Prometiste una salida específica y el cierre tiene que entregarla. Por eso es también el que mejor sostiene un CTA de comentario o DM — el pedido sale natural del contrato que ya abriste.

**Señal de que salió bien:** la solución que entregás al final es concreta y hace lo que prometiste.
**Señal de que salió mal:** la solución es vaga, genérica, o nunca llega. Es el gancho que más rápido quema la confianza, justamente porque prometió más.

> "Pasás horas publicando en todas tus redes. Tengo algo que te lo resuelve en cinco minutos."
> "Tu agente se rompe cada vez que cambia el input. Hay una forma de que deje de pasar."
> "Perdés medio día armando propuestas para clientes. Se puede hacer en veinte minutos."

### 7. Visual

**Mecanismo:** la imagen para el scroll antes que el mensaje. No empezás con palabras, empezás con impacto.

**Estructura:** contraste, antes/después, o algo que no encaja. Al proponerlo, **describí la imagen, no una frase**.

**Cuándo aplica:** solo video y carrusel. **No existe en blog ni en post de texto.** Necesita que la imagen exista de verdad — si no está disponible, decilo en vez de proponerla.

> Pantalla con 40 pestañas abiertas → un solo flujo corriendo
> Factura de API de $800 → la misma tarea a $12
> 200 líneas de código → 12 que hacen lo mismo

### 8. Desafío

**Mecanismo:** ego. La persona se queda para comprobar si sabe o no.

**Estructura:** dudás de su capacidad, o afirmás que está cometiendo un error, en tono directo y personal.

**Cuidado:** con audiencia fría puede leerse como soberbia. En LinkedIn hay que suavizarlo bastante más que en TikTok.

> "Apuesto a que no podés decirme qué pasa si ese flujo falla a las tres de la mañana."
> "A ver si tu proyecto arranca en una máquina limpia al primer intento."
> "Estoy casi seguro de que estás cobrando mal este servicio."

### 9. Autoridad

**Mecanismo:** credibilidad. **Posiciona, pero no retiene** — le dice a la persona por qué escucharte, no por qué quedarse.

**Estructura:** abrís con experiencia o volumen de trabajo real.

**Cómo usarlo bien:** casi nunca solo. Funciona pegado a otro tipo — autoridad + contraintuitivo, autoridad + negativo. La autoridad sola es la apertura más olvidable de la lista.

> "Después de romper y arreglar agentes en producción durante meses…"
> "Después de ver muchos proyectos morir en la misma etapa…"
> "Después de escribir y tirar cientos de prompts…"

### 10. Storytelling

**Mecanismo:** narrativa. Cuando sale bien es el que más retiene de todos; cuando sale mal es el que más rápido pierde gente, porque pide paciencia antes de dar valor.

**Estructura:** arrancás en un momento concreto, no en un resumen. El error típico es empezar por el contexto en vez de por la escena.

**Cuándo rinde más:** blog, newsletter y video largo, donde hay espacio para desarrollar. En Reel corto hay que llegar al giro rapidísimo.

> "El flujo se rompió un viernes a la noche y no me enteré hasta el lunes."
> "El primer agente que puse en producción me duró cuatro horas."
> "El cliente que más me pagaba fue el que casi me funde."

---

## Reglas de escritura

1. **El idioma del usuario.** Escribí los ganchos en el idioma en el que te está hablando. Si es español, rioplatense con vos — nada de "tú", "puedes", "debes". Los ejemplos de este archivo están en rioplatense: son la referencia de registro para el caso español, no una instrucción de escribir siempre en español.

2. **Concreto sobre abstracto.** Número específico, herramienta con nombre, situación reconocible. Si el gancho se puede pegar en otro contenido cualquiera sin cambiar nada, no sirve.

3. **Nada de jerga de marketing.** Prohibido: potenciá, escalá, llevá al siguiente nivel, revolucionario, game changer, disruptivo, desbloqueá.

4. **Corto.** Reel: máximo dos líneas habladas. Carrusel: una frase que entre en la slide 1 y se lea en menos de dos segundos. Post: dos líneas, lo que queda antes del "ver más". Blog: una oración.

5. **Sin cierre.** El gancho abre un loop. "Hay tres formas de resolver esto: la primera es…" es un gancho; decir las tres ya contó todo.

6. **Que el cuerpo pueda cumplir.** Un gancho que promete algo que el contenido no tiene entrena a la audiencia a desconfiar de los siguientes.

7. **Cero exageración.** Inflar un resultado se nota de inmediato y quema autoridad, que es el activo más caro de recuperar.

### Si el idioma no es español

Los ejemplos de arriba calibran el registro rioplatense. Cuando el usuario escribe en otro idioma, esos ejemplos siguen sirviendo para el **mecanismo** de cada tipo, no para el fraseo. Dos cosas que cambian:

- **No traduzcas los ejemplos.** Escribí el gancho nativo en ese idioma. Un gancho que se lee como traducción pierde exactamente lo que lo hacía funcionar.
- **Recalibrá el largo.** El español corre entre 15% y 20% más largo que el inglés. La regla 4 son límites de lectura, no de caracteres: lo que entra en dos líneas habladas cambia por idioma.

### El formato filtra

- **Reel / TikTok / Short**: aplican los 10. El visual es el primer frame.
- **Carrusel**: el gancho es la slide 1. El visual aplica como diseño, no como escena.
- **Post de texto**: no aplica el visual.
- **Blog / newsletter**: no aplica el visual. Storytelling y contraintuitivo rinden más; curiosidad rinde menos.

---

## Contexto: Aurelio

*(Esta es la capa personalizable. Quien adapte el skill reemplaza esta sección y deja el resto igual.)*

**Dónde para el contenido.** Aurelio habla de sistemas que piensan, deciden o ejecutan solos, y de todo lo que los rodea: cómo se construyen, con qué, qué los rompe, cuánto cuestan, quién los usa, quién los paga y quién los mantiene. Modelos, agentes, código, herramientas, productos, clientes, contratación, precios, resultados.

Esto es un criterio, no una lista. **Un producto o un modelo que todavía no existe cae adentro igual** — el rubro se mueve más rápido de lo que se puede enumerar. Escribí sin preguntar si el tema está permitido.

**La lente.** Gustavo es ingeniero mecánico. No habla de turbinas, pero mira la IA como se mira un sistema físico: entradas y salidas, puntos de falla, tolerancias, degradación, costo real de mantenerlo que nadie calcula al principio. Esa mirada es la que permite explicar qué es un LLM, cómo funciona un agente o qué es el entorno de ejecución sin sonar a hype ni a tutorial copiado.

Un ingeniero identifica problemas y trae soluciones. El gancho es la primera mitad de eso: **nombrar el problema mejor de lo que la persona sabe nombrarlo.** Cuando alguien siente que le describiste su problema con más precisión de la que él tenía, asume que tenés la solución.

**Para qué sirve el contenido.** Retener es el objetivo, porque de ahí sale todo lo demás: seguidores, autoridad, prueba social, comunidad y clientes. Alguien que hoy no necesita nada te sigue porque el contenido está bueno, y esa audiencia es lo que hace que el que sí necesita algo te tome en serio antes de leer una palabra.

Por eso **no fuerces cada gancho hacia el servicio.** Un gancho que solo enseña algo interesante, sin dolor de cliente ni salida comercial, es contenido legítimo y suma igual.

---

## Iteración

Si el usuario pide cambios:

- Reescribir **solo** lo que mencionó. Devolver el resto idéntico.
- No agregar tipos, secciones ni variantes que no pidió.
- "Más agresivo" → negativo o desafío. "Muy vendedor" → identificación o pregunta.
- "Otro" sobre un tipo → reemplazar solo ese, no los demás.
- Si dice que ya usó un tipo hace poco, priorizar otros en la recomendación.
