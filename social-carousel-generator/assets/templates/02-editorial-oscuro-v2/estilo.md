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
- **La portada alinea a la izquierda**, con el titular **entero en blanco** y el giro en
  serif itálica. La partición gris/blanco se sacó el 2026-08-29: con mitades desparejas
  —una palabra arriba, dos abajo— se lee como un error de render y no como jerarquía. El
  contraste lo dan el giro en serif y el tamaño, que ya alcanzan.
- **La placa de cierre no lleva el link de la comunidad.** Firma, titular, subtítulo,
  filete y el sitio. Nada más. El link de Skool va en el caption, nunca en la imagen —
  decidido por el usuario el 2026-08-29, después de que saliera dos veces seguidas.
- **Cualquier otro dato de marca sale del preset, nunca del `slide-data.js` de ejemplo.**
- **El CTA es una placa HTML, no un PNG fijo.** Una variante es un cambio de datos, no
  un asset nuevo que haya que regenerar y comparar.
- **Cada `chart` necesita su `id` único** en el carrusel, o los gradientes SVG se pisan
  entre placas.
- **`strip` dibuja la forma de un dato.** Si la fuente no publica una serie, no se usa:
  nueve celdas iguales se leen como un gráfico y no afirman nada. Para esa portada va
  `devstrip`. Casi se publica una tira uniforme el 2026-08-29.
- **Dos piezas que cumplen el mismo rol llevan el mismo cuerpo.** El remate de `cards` y
  el cierre de `list`/`chart`/`steps` son la misma línea de una placa: los dos a 44px,
  peso 800. Estuvieron a 52 y 44 hasta el 2026-08-29 y el audit no lo ve — se chequea a
  ojo en el contact sheet.
- **El footer no lleva filete superior** (2026-08-29).
- **El cierre lleva `margin-bottom: 88px`** (2026-08-31): sin eso se apoya contra el
  footer y la placa se pasa del area segura por abajo.
- **No hay número gigante.** Se eliminó el 2026-08-31 por pedido del usuario: corría el
  titular a un costado y no numeraba nada. El campo `num` no existe más, ni en `steps` ni
  en `layers`. No se vuelve a agregar.
- **`cards` va con bajada.** Sin ella la placa queda corta y el sobrante se junta entre
  las tarjetas y el remate. Si no hay qué poner en la bajada, a la placa le falta
  contenido — no se arregla separando bloques.
- **La portada carga más tinta que en el `01`.** Titular Archivo a 100px y entero en
  blanco: por eso este template trae `density-budget` entre sus excepciones de fábrica.
  Las bandas del audit están medidas sobre el set del `01`, cuyo titular es más chico.

## Piezas construidas

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

## Iconos de Lucide/Tabler

**Grosor de linea: 2px reales sobre el lienzo.** Los filetes de este estilo son de 1px y las barras de acento de 4px. Como el campo es oscuro, el icono no iguala el filete sino que se apoya entre los dos. A 3px ya compite con la barra.

`stroke-width` NO esta en pixeles: esta en las unidades del viewBox del icono, que en
Lucide y en Tabler es de 24. Un icono a 56px se escala x2,33, asi que el valor a poner
depende del tamanio al que vaya:

```
stroke-width = 2 x 24 / tamanio_en_px
```

Tamanio del icono: 40-56px, segun cuanto peso tenga que cargar el slide. Chico como para
no competir con el titular, nunca tan chico que se lea como una marca perdida.

`stroke="currentColor"` y el color manejado desde el CSS del elemento que lo envuelve,
siempre con un acento de la paleta de este estilo, nunca un hex escrito a mano.

Nunca mezcles dos grosores de icono dentro de un mismo carrusel.

**Qué piezas lo aceptan:** `rows` — va a la izquierda de la etiqueta y la descripción.

Se copia el **interior** del `<svg>` de lucide.dev o tabler.io/icons — los `<path>`, sin
la etiqueta `<svg>` — y va en el slide como `ico: { d: '<path .../>' }`. Opcional `px`
para cambiar el tamaño.

**El `stroke-width` no se escribe a mano.** Lo calcula `ico()` en `index.html` con el
grosor de arriba y el tamaño del ícono. Si lo escribís vos, se rompe la consistencia en
cuanto un ícono vaya a otro tamaño.

Para que una pieza más acepte ícono hay que tocar los tres archivos: `index.html` (que
lo dibuje), `styles.css` (cómo se alinea) y este archivo (que quede documentado). Los
tres, o el dato queda en `slide-data.js` y no aparece nada.
