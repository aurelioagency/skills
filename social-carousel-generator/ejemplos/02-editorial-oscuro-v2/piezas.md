# Piezas del carrusel de ejemplo — `02-editorial-oscuro-v2`

Lo que el `render()` de este estilo ya sabe dibujar hoy, con los campos que lee
cada pieza.

**Esto no es un menu de composicion.** Son las placas del carrusel con el que se
armo el estilo: un carrusel es evidencia de un carrusel, no la capacidad del
sistema. Esta lista no dice cuantas placas entran, ni que placa corresponde a que
contenido, ni que estas sean las unicas posibles.

Que recurso visual pide cada placa sale de `references/composicion.md`, del
contenido. Recien despues se mira aca si ya esta dibujado.

Elegir una pieza porque ya existe y despues buscar con que llenarle los campos es
el defecto que este archivo esta separado para evitar.

---

Lo que el `render()` de `index.html` ya sabe dibujar hoy, con los campos que lee cada
pieza. **Es un punto de partida, no un menú cerrado**: cada carrusel compone sus placas
dentro del estilo, y si le falta una pieza se agrega — la entrada acá + el bloque en
`render()` + sus clases en `styles.css`. Los tres, o la pieza no existe.

| `type` | Qué dibuja | Campos |
|---|---|---|
| `cover` | eyebrow · titular en blanco · giro en serif · gráfico: tira de nueve celdas (`weights`) **o** elementos bajo un bus (`devices`) | `eyebrow`, `headTop`, `headBottom`, `twist`, `stripLabel`, y **o bien** `weights` (9 valores 0–1) + `axis`, **o bien** `devices` = `[{ lbl, ico }]` |
| `rows` | eyebrow · titular · bajada · filas con etiqueta mono y descripción, barra de acento a la izquierda | `rows` = `[{ lbl, t }]`, `aside` opcional |
| `docs` | tres hojas con nueve renglones, un renglón marcado en cada una y un pie que dice si acertó | `docs` = `[{ hit, cap, miss }]`, `close` |
| `chart` | eyebrow con fuente · titular · bajada · gráfico de línea con área y puntos · rótulos de eje · cierre | `id`, `chartLabel`, `path` (viewBox 904x380), `dots`, `axis`, `close` |
| `steps` | eyebrow · titular · bajada · diagrama opcional · chips (uno activo, uno tachado) · cierre | `chipsLabel`, `diagram`, `chips` = `[{ t, state }]`, `close` |
| `layers` | eyebrow · titular · cuatro barras que llegan cada vez menos lejos · rótulos de extremos · cierre | `layersLabel`, `layers` = `[{ lbl, reach, tail }]`, `axis`, `close` |
| `list` | eyebrow · titular · bajada · ítems numerados separados por filete · cierre | `items`, `close` |
| `cards` | eyebrow · titular · bajada opcional · tres tarjetas en fila · remate con parte resaltada | `cards` = `[{ lbl, t, tone }]`, `lede` opcional, `punch`, `aside` opcional |
| `stats` | eyebrow · titular · bajada · dos cifras grandes con su unidad, rótulo y detalle | `stats` = `[{ fig, sub, lbl, t }]` |
| `cta` | firma · titular · subtítulo en serif · filete · sitio · contador | `signature`, `headline`, `sub` |

Cada ítem de `list` entra en una línea a 44px, ~40 caracteres. Si no entra, se acorta el
ítem: nunca se baja el cuerpo. Lo mismo vale para las filas de `rows`: la columna mide
471px cuando lleva `aside`, así que arriba de ~20 caracteres parte y deja huérfana.

En `cards`, si va sin `aside` el remate queda solo contra un campo vacío a su derecha.
