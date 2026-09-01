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
| `cover` | encabezado · titular condensado 112px · regla de cota con la magnitud · bajada · corte y sección · cartucho | `tab`, `headline`, `ruleWidth`, `ruleLabel`, `lede`, `a`/`b`, `cartucho` |
| `nodos` | cabeza estándar + nodos con figura, rótulo mono azul, nombre condensado y descripción, separados por línea de eje | `nodos` = `[{ fig:{ id, px, trama }, k, name, desc }]`, `img` opcional |
| `bars` | cabeza estándar + barras rayadas, línea de eje, cifra dominante y sellos | `bars` = `[{ lbl, val, w, tone }]`, `factor` = `{ n, t }`, `sellos`, `cartucho` |
| `ficha` | ficha de respuesta en lenguaje de plano: renglones con trama, linea de corte punteada y el campo `FUENTE` en blanco. Alternativa a `corte` en la portada cuando no hay dos magnitudes que comparar | `ficha` = `{ lbl, lines, foot }` |
| `cta` | titular condensado 116px · regla · bajada · checklist · cartucho | `headline`, `ruleWidth`, `lede`, `checks`, `cartucho` |

`tone`: `azul` · `naranja` · `normal` · `invert` · `densa`. Los `id` de figura y las
tramas están en `figures.md`.

El `ruleLabel` de la portada lleva la magnitud (`FACTOR 25:1`), no una etiqueta
genérica: es una cota, y una cota siempre mide algo. El `factor` es la cifra dominante
de la placa: una sola, porque dos compiten y ninguna se lee.
