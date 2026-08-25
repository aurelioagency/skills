# Estilo — `02-editorial-oscuro-v2`

El mismo campo del `01`, con la capa visual rehecha: plano, sin grilla ni curvas, con un
glow que rota de esquina y una barra de progreso arriba. Deriva del 01 — es un rediseño
visual, no un sistema distinto de composición.

## Las reglas que dan consistencia

- **Un acento por placa, elegido por función, no por gusto:** coral = problema, causa,
  lo que falla · verde = dato, evidencia, solución · dorado = apertura, cierre, neutro.
- **El glow rota de esquina placa a placa** (`tl` / `tr` / `bl` / `br` / `tc`) para que
  la secuencia no se lea repetida.
- **La barra de progreso arriba** va en todas las placas.
- **La portada alinea a la izquierda**, con el titular partido en dos mitades: la
  primera en gris, la segunda en blanco, y el giro en serif itálica.
- **El CTA es una placa HTML, no un PNG fijo.** Una variante es un cambio de datos, no
  un asset nuevo que haya que regenerar y comparar.
- **Cada `chart` necesita su `id` único** en el carrusel, o los gradientes SVG se pisan
  entre placas.

## Piezas construidas

Lo que el `render()` de `index.html` ya sabe dibujar hoy, con los campos que lee cada
pieza. **Es un punto de partida, no un menú cerrado**: cada carrusel compone sus placas
dentro del estilo, y si le falta una pieza se agrega — la entrada acá + el bloque en
`render()` + sus clases en `styles.css`. Los tres, o la pieza no existe.

| `type` | Qué dibuja | Campos |
|---|---|---|
| `cover` | eyebrow · titular en dos mitades · giro en serif · tira de nueve celdas con sus rótulos de eje | `eyebrow`, `headTop`, `headBottom`, `twist`, `stripLabel`, `weights` (9 valores 0–1), `axis` |
| `rows` | eyebrow · titular · bajada · filas con etiqueta mono y descripción, barra de acento a la izquierda | `rows` = `[{ lbl, t }]`, `aside` opcional |
| `docs` | tres hojas con nueve renglones, un renglón marcado en cada una y un pie que dice si acertó | `docs` = `[{ hit, cap, miss }]`, `close` |
| `chart` | eyebrow con fuente · titular · bajada · gráfico de línea con área y puntos · rótulos de eje · cierre | `id`, `chartLabel`, `path` (viewBox 904x380), `dots`, `axis`, `close` |
| `steps` | número gigante · eyebrow · titular · bajada · diagrama opcional · chips (uno activo, uno tachado) · cierre | `num`, `chipsLabel`, `diagram`, `chips` = `[{ t, state }]`, `close` |
| `layers` | número gigante · titular · cuatro barras que llegan cada vez menos lejos · rótulos de extremos · cierre | `num`, `layersLabel`, `layers` = `[{ lbl, reach, tail }]`, `axis`, `close` |
| `list` | eyebrow · titular · bajada · ítems numerados separados por filete · cierre | `items`, `close` |
| `cards` | eyebrow · titular · tres tarjetas en fila · remate grande con parte resaltada | `cards` = `[{ lbl, t, tone }]`, `punch`, `aside` opcional |
| `cta` | firma · titular · subtítulo en serif · filete · sitio · comunidad · contador | `signature`, `headline`, `sub`, `community` |

Cada ítem de `list` entra en una línea a 44px, ~40 caracteres. Si no entra, se acorta el
ítem: nunca se baja el cuerpo.

En `cards`, si va sin `aside` el remate queda solo contra un campo vacío a su derecha.
