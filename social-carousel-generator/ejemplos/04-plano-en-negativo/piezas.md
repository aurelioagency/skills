# Piezas del carrusel de ejemplo — `04-plano-en-negativo`

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
| `cover` | encabezado con estado · titular 112px · filete · bajada · dos cifras con flecha · chips · pie | `tab`, `state`, `headline`, `lede`, `a`/`b`, `chips`, `source` |
| `stack` | cabeza estándar + fichas sobre panel con filete de acento, rótulo mono y una línea | `stack` = `[{ lbl, t, tone }]`, `img` opcional |
| `bars` | cabeza estándar + barras verticales con base compartida, párrafo y remate | `vbars` = `[{ val, h, on }]`, `after`, `punch`, `punchTone` |
| `cta` | titular 100px · filete · bajada · checklist · firma grande | `headline`, `lede`, `checks`, `state`, `source` |

`tone` / `punchTone`: `teal` · `amber` · `blue`. `state` = `{ t, tone }`.

En `vbars`, `h` es el porcentaje del alto y `on` marca la barra que lleva el acento; el
hueco a la derecha las devuelve a lo que son —dos puntos de una comparación— en vez de
un gráfico de dos categorías sobre todo el ancho. En `chips`, el primero lleva el acento
y los demás quedan apagados: dos encendidos no dicen nada.
