# Selección de arquetipo narrativo para carrusel

Dado un tema o fuente de contenido, seleccioná el arquetipo narrativo más adecuado
siguiendo este orden de evaluación. Evaluá las condiciones en secuencia y detenete en la
primera que se cumpla.

El orden importa: es lo que define la precedencia cuando un tema cumple más de una
condición.

1. **¿La fuente es un paper, estudio o research externo con un hallazgo o dato
   sorprendente?**
   → Usar **Data-driven narrative**: dato impactante (slide 1) → qué significa (slides
   medios) → consejo accionable (cierre).

2. **¿El tema corrige una creencia específica y reconocible que la audiencia
   probablemente tiene?**
   → Usar **Myth-busting**: mito instalado → corrección con datos/razón.
   Requisito: debe existir un mito real y reconocible, no forzarlo si no lo hay.

3. **¿Hay un resultado propio o de un cliente con números reales de por medio?**
   → Usar **Case study con números**: resultado (slide 1) → cómo se llegó ahí
   (desarrollo) → takeaway replicable.

4. **¿El tema es un proceso con pasos que deben ejecutarse en un orden obligatorio?**
   → Usar **Tutorial/step-by-step**: un paso = un slide, secuencial, numerado, cierre
   con resumen.

5. **¿Es una lista de ítems sin dependencia entre ellos (herramientas, recursos, tips
   sueltos)?**
   → Usar **Listicle numerado**: variante liviana del tutorial, sin orden obligatorio
   entre ítems.

6. **¿Hay un "antes" y un "después" que se pueda mostrar visualmente (no solo
   explicar)?**
   → Usar **Before/After**: contraste visual directo entre estado inicial y estado
   final.

7. **¿El tema es un problema con consecuencias concretas si no se resuelve?**
   → Usar **PAS (Problem-Agitate-Solve)**: problema → consecuencias de no resolverlo →
   solución.

8. **¿Son dudas o resistencias repetidas y reales que tiene la audiencia sobre algo?**
   → Usar **FAQ/Objeciones**: pregunta/objeción → respuesta que la disuelve.

9. **Si ninguna condición se cumple con claridad:**
   → Default a la **Slide Grammar** de `SKILL.md` (gancho → contexto → insight →
   evidencia → ejemplo → contracaso → conclusión → cierre), o marcar que falta contexto
   para decidir.

## Salida esperada

Al aplicar esto, indicar:

- Arquetipo elegido
- Por qué (qué condición del árbol se cumplió)
- Estructura de slides sugerida para ese arquetipo aplicada al tema puntual

## Cuándo se corre

Después de escribir la `Lectura` en `carousel-brief.md` (ver *Understanding the topic
before writing it* en `references/redaccion.md`) y antes de escribir un solo slide. **Primero se
entiende el tema, después se elige el arquetipo** — al revés, el arquetipo decide qué se
busca en la fuente y aparecen pasos inventados para completarlo.

La salida esperada va en el mismo mensaje que el split y los ganchos, y se confirma todo
junto. Se registra en `carousel-brief.md` y en `manifest.json` bajo `content_archetype`.

## El arquetipo no elige el estilo ni la pieza

Son ejes independientes. Que el arquetipo sea Before/After no significa que la placa vaya
en una pieza llamada `antes` o `compare`: la pieza la decide el material dentro del
estilo activo, en el gate de aprobación de copy.

La condición 6 es la única que mira el estilo, y sólo para evaluarse: pide que el
contraste **se pueda mostrar**, no sólo explicar. Si el estilo activo no tiene con qué
mostrarlo, esa condición no se cumple y el árbol sigue bajando.
