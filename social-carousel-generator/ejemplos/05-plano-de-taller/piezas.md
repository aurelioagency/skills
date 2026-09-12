# Piezas del carrusel de ejemplo — `05-plano-de-taller`

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
| `cover` | encabezado · titular condensado 112px · línea de cota · bajada · corte y sección · cartucho | `tab`, `headline`, `ruleWidth`, `lede`, `a`/`b`, `cartucho` |
| `nodos` | cabeza estándar + nodos con figura, rótulo mono azul, nombre condensado y descripción, separados por línea de eje | `nodos` = `[{ fig:{ id, px, trama }, k, name, desc }]`, `img` opcional |
| `bars` | cabeza estándar + barras rayadas, línea de eje, cifra dominante y sellos | `bars` = `[{ lbl, val, w, tone }]`, `factor` = `{ n, t }`, `sellos`, `cartucho` |
| `ficha` | ficha de respuesta en lenguaje de plano: renglones con trama, linea de corte punteada y el campo `FUENTE` en blanco. Alternativa a `corte` en la portada cuando no hay dos magnitudes que comparar | `ficha` = `{ lbl, lines, foot }` |
| `pasos` | cabeza estandar + secuencia numerada, un paso por renglon, linea de eje entre pasos | `pasos` = `[{ n, t }]` |
| `cifras` | cabeza estandar + dos cifras independientes, cada una con rotulo y detalle. Va cuando las dos magnitudes NO se comparan entre si | `cifras` = `[{ n, u, lbl, t }]` |
| `image` | cabeza estandar + una imagen publicada por la fuente, enmarcada | `img`, `imgTransparent` opcional |
| `cita` | cabeza estandar + cita textual atribuida (marca de comillas, texto real, linea de eje, atribucion en mono). Rama 8 de `composicion.md`: cuando la fuente lo dice mejor de lo que lo diriamos nosotros. Distinta de `ficha`: esta lleva texto real, no lineas en blanco | `cita` = `{ texto, atr }` |
| `cta` | titular condensado 116px · línea de cota · bajada · cartucho | `headline`, `ruleWidth`, `lede`, `cartucho` |

**`cita` agregada el 2026-09-12.** `ficha` es una metafora especifica de "una respuesta
que no se apoya en nada" (nacio para un carrusel sobre alucinaciones); usarla para citar
texto real de la fuente invertiria su significado. `cita` es la pieza para eso: texto
legible y atribuido, sin lineas en blanco.

`tone`: `azul` · `naranja` · `normal` · `invert` · `densa`. Los `id` de figura y las
tramas están en `figures.md`.

El `factor` es la cifra dominante de la placa: una sola, porque dos compiten y ninguna
se lee.


## El cartucho ya no sale de los datos (2026-09-04)

Es identico en todas las placas, asi que lo arma `cartucho()` con `footerBrand` y
`footerAuthor` de `slide-data.js`. El campo `cartucho` por slide quedo sin efecto; las
placas del ejemplo todavia lo traen y se ignora. No lo pongas en un carrusel nuevo.
