# Estructura de contenido del carrusel

Qué dice cada placa y en qué orden. Se corre sobre la `Lectura`, antes de escribir un
solo slide.

## El método

Corre **siempre**, sobre cualquier tema. Es una pregunta:

> ¿Qué quiere saber alguien sobre esto, y en qué orden lo preguntaría?

Escribí esas preguntas sobre la `Lectura`, en el orden en que alguien las haría. **Esas
son las placas**, y la respuesta a cada una es su contenido.

La salida cambia según qué **es** el tema, y eso es exactamente el punto:

| Si el tema es | Las preguntas son |
|---|---|
| Una cosa — un modelo, una herramienta, un producto | Qué es · qué tan bueno es · qué cuesta · qué te deja hacer · qué riesgos tiene |
| Una técnica o un método | Qué problema resuelve · cómo funciona · cuándo sirve · cuándo no |
| Un hecho o un caso | Qué pasó · cómo · qué resultó · qué cambia |
| Una afirmación discutible | Qué se dice · qué muestra la evidencia · qué queda en pie |

**Esas cuatro filas son ejemplos de salida, no opciones para elegir.** Si tu tema no se
parece a ninguna, el método igual funciona: la pregunta no cambia.

### El chequeo

Leídos solos, los títulos de las placas tienen que ser **las preguntas que alguien se
hace sobre el tema**.

Si son los **roles de un relato** —evidencia, ejemplo, contracaso— la estructura salió de
una grilla narrativa y no del tema. Si son **los nombres propios y las anécdotas que trae
la fuente**, salió del material y tampoco del tema. En los dos casos se rehace: son las
dos maneras en que esto falla, y las dos se ven en diez segundos leyendo los títulos
seguidos.

## Formas que se repiten

Ocho formas que aparecen seguido. **Son una guía de consulta, no un árbol de decisión.**
No se evalúan en orden, no hay precedencia entre ellas y no hay que encajar el tema en
ninguna. Si lo que dio el método se parece a una, mirá su secuencia: te ahorra pensar el
orden. Si no se parece a ninguna, no falta nada — la estructura ya la tenés.

**Forzar un tema adentro de una de estas es de donde salen los errores.** La mayoría de
los temas no es ninguna de las ocho, y eso es normal, no un problema a resolver.

- **Data-driven narrative** — cuando la fuente es un paper o un estudio con un hallazgo
  sorprendente. Dato impactante → qué significa → consejo accionable.
- **Myth-busting** — cuando el tema corrige una creencia instalada y reconocible. Mito →
  corrección con datos. Sólo si el mito existe de verdad; si hay que inventarlo, no es
  esto.
- **Case study con números** — cuando hay un resultado propio o de un cliente con cifras
  reales. Resultado → cómo se llegó → takeaway replicable.
- **Tutorial/step-by-step** — cuando el proceso tiene pasos en orden obligatorio. Un paso
  por placa, numerado, cierre con resumen.
- **Listicle numerado** — ítems sin dependencia entre sí. Variante liviana del tutorial,
  sin orden obligatorio.
- **Before/After** — cuando el contraste entre dos estados **se puede mostrar**, no sólo
  explicar. Si el estilo activo no tiene con qué mostrarlo, no es esta forma.
- **PAS (Problem-Agitate-Solve)** — un problema con consecuencias concretas si no se
  resuelve. Problema → consecuencias → solución.
- **FAQ/Objeciones** — dudas o resistencias repetidas y reales de la audiencia.
  Pregunta → respuesta que la disuelve.

## Salida esperada

- **La estructura derivada**: la lista de preguntas, en orden, una por placa, aplicada al
  tema puntual.
- Si se parece a una de las formas de arriba, nombrarla. Es opcional y no cambia nada: es
  para que el usuario ubique rápido de qué va.

Va en el mismo mensaje que el split y los ganchos, y se confirma todo junto. Se registra
en `carousel-brief.md` y en `manifest.json` bajo `content_archetype`.

## Cuándo se corre

Después de escribir la `Lectura` en `carousel-brief.md` (ver *Understanding the topic
before writing it* en `references/redaccion.md`). **Primero se entiende el tema, después
se deriva la estructura** — al revés, la estructura decide qué se busca en la fuente y
aparecen placas inventadas para completarla.

## La estructura no elige el estilo ni la pieza

Son ejes independientes. Que la estructura contraste dos estados no significa que la
placa vaya en una pieza llamada `antes` o `compare`: la pieza la decide el material
dentro del estilo activo, en el gate de aprobación de copy (`references/composicion.md`).
