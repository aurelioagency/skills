---
name: content-diario
description: Genera cada mañana un menú de ideas de carrusel y de reel para Aurelio Agency, a partir de una lista blanca de fuentes técnicas (Google Sheet), canales de YouTube y cuentas de Instagram referentes. Corre sola vía tarea programada a las 7 AM; también se puede invocar manualmente con "el menú de hoy", "ideas para hoy" o "arrancá el contenido del día". Al elegir una idea de carrusel invoca social-carousel-generator; al elegir una idea de reel, esta misma skill escribe el guion y busca opciones de hook — nunca usa hook-generator ni social-video-producer.
---

# Content diario

Skill padre: genera el menú del día, lo persiste, y al elegir una idea delega la producción. No publica nada — solo propone y arma borradores.

## Paso 1 — Recolección

Tres fuentes independientes, cada una con su propio circuito de búsqueda:

1. **Planilla de fuentes técnicas** — ver `references/fuentes.md` para el link y la clasificación por categoría. Mirá lo publicado en los últimos días en las fuentes de "novedades"; en las de "teoría" buscá explicaciones/artículos relevantes sin importar antigüedad.
2. **Canales de YouTube** — lista en `references/canales-lista-blanca.md` (arranca vacía, se completa con lo que el usuario vaya pasando, igual que el paso 1 de `reels-referentes`). Revisá los videos recientes de esos canales.
3. **Cuentas de Instagram referentes** — delegá directo a los **pasos 1 y 2** de la skill `reels-referentes` para traer candidatos de "reel-copia" (los de más views, con su link). No uses los pasos 3-4 de esa skill todavía — eso solo corre si el usuario aprueba ese candidato acá (ver paso 6).

## Paso 2 — Clasificación: novedad vs. teoría

- **Novedad**: fuentes categoría "Labs oficiales", "Periodismo técnico", "Newsletters curadas" de la planilla, o cualquier video/artículo publicado en los últimos días sobre un release, lanzamiento o anuncio.
- **Teoría**: fuentes categoría "Research académico", "Practitioners/builders", "Referentes técnicos", "Fundamentos/academias oficiales", o cualquier video/artículo que explica un concepto en vez de anunciar algo nuevo.

## Paso 3 — Verificación de teoría

Ver `references/verificacion.md` para el detalle. Regla corta:

- **Fundamentos/academias oficiales** (Claude Academy, OpenAI Academy, Microsoft Learning) → nunca se reverifican, son la fuente de verdad y las mantienen ellos.
- **Todo lo demás en "teoría"** (blogs de referentes, papers, practitioners) → si la fuente tiene varios meses o años, reverificá si lo que dice sigue vigente contra una fuente actual (labs oficiales, academia oficial, o una búsqueda web) antes de proponerla.
  - Si cambió o quedó obsoleto → descartala o corregila.
  - Si hay avances posteriores pero el núcleo sigue vigente → proponela igual, mencionando el avance.
  - Si hay duda real → proponela marcada "verificar antes de publicar".
- **Contenido de las últimas semanas** → no hace falta este paso, se propone directo.

## Paso 4 — Prioridad: novedad fuerte manda

Antes de armar el menú, evaluá si hoy hay una **novedad fuerte**: release de modelo o funcionalidad nueva de un lab grande (OpenAI, Anthropic, Google DeepMind, Meta), o algo con cobertura across varias fuentes de "Periodismo técnico"/"Newsletters" el mismo día.

- Si la hay: esa novedad ocupa los primeros lugares del menú, y se propone **tanto en formato carrusel como en formato reel de actualidad** ese mismo día (no esperar a mañana). Reducí la cantidad de ideas de teoría ese día (2-3 en vez de 5) para no diluir la urgencia.
- Si no hay ninguna novedad fuerte ese día: compensá con más teoría (podés subir a 5-6 ideas de teoría).
- Las ideas de teoría que no entran por falta de lugar no se pierden — quedan `pendiente` en el backlog para un día sin novedades.

## Paso 5 — Armar el menú y guardarlo

Generá ~5 ideas de carrusel + ~5 ideas de reel en total (mezclando novedad, teoría y reel-copia, según la prioridad del paso anterior). Cada una con: título, fuente (link), tipo, y el porqué en una línea.

Guardalas en `Documents\content-diario\backlog.json` — ver `references/estado.md` para el formato exacto. Nunca borres una idea del backlog, solo cambiale el estado (`propuesto` → `elegido` / sigue `pendiente`). Las `pendiente` se pueden volver a proponer en rondas futuras.

Mostrá el menú numerado en el chat para que el usuario elija cualquier combinación (0 a N de cada tipo) — no hace falta que la pida, ya tiene que estar generada y guardada cuando el usuario abre la sesión de la mañana.

## Paso 6 — Delegación al elegir

**Carrusel elegido:** invocá `social-carousel-generator` con el tema y la fuente.

**Reel elegido:** nunca uses `hook-generator` ni `social-video-producer` en este flujo. En su lugar:

1. **Guion (~40 segundos de diálogo):**
   - Si es "reel-copia" (viene de una cuenta de Instagram referente): corré los **pasos 3 y 4** de `reels-referentes` para ese candidato (aprobación + bajar audio con cobalt.tools + transcribir con `reels-referentes/scripts/transcribir.py` + traducir si hace falta). Si el original está en otro idioma, podés usar casi tal cual ese diálogo traducido, adaptándolo mínimamente a la voz de Aurelio Agency — no hace falta reescribirlo desde cero.
   - Si es de YouTube: bajá el audio con `yt-dlp` y transcribilo con el mismo `reels-referentes/scripts/transcribir.py`.
   - Si es novedad o teoría de la planilla (viene de un link/página, no de un video): escribí vos el guion desde cero, ~40 segundos, basado en el tema ya verificado.
2. **Opciones de hook:** además del diálogo, buscá hooks virales reales (mirá reels con muchas views sobre temas parecidos) y adaptalos al tema del día. Dale al usuario 2-3 opciones de hook para elegir.
3. Entregá guion + opciones de hook como texto. La producción del video (edición en CapCut, subtítulos con `social-video-producer`) la hace el usuario manualmente después — esta skill no la toca.

## Reglas duras

- Nunca inventes datos de una fuente — si una categoría no tiene nada nuevo relevante ese día, decilo, no rellenes con relleno.
- Nunca borres ideas del backlog, solo cambiá su estado.
- No uses `hook-generator` ni `social-video-producer` en este flujo.
- No publiques nada en ninguna red — esta skill solo genera ideas y borradores.
- No proceses (guion, hook) ninguna idea que el usuario no haya elegido explícitamente.

## Referencias

- `references/fuentes.md` — link a la planilla y clasificación por categoría.
- `references/verificacion.md` — reglas detalladas de verificación de teoría, con ejemplos.
- `references/canales-lista-blanca.md` — canales de YouTube referentes.
- `references/estado.md` — formato de `backlog.json`.
