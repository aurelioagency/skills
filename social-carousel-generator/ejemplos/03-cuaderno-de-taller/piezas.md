# Piezas del carrusel de ejemplo — `03-cuaderno-de-taller`

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
| `cover` | pestaña · titular manuscrito 104px · regla de cota · bajada · dos cajas comparadas · pie | `tab`, `headline`, `ruleWidth`, `lede`, `a`/`b`, `source` |
| `compare` | cabeza estándar + dos cajas pasteles con flecha, valor adentro y epígrafe debajo | `a`/`b` = `{ v, h, tone, cap }` |
| `parts` | cabeza estándar + piezas con etiqueta `P-01`, nombre manuscrito y descripción | `parts` = `[{ tag, tone, name, desc }]`, `img` opcional |
| `bars` | cabeza estándar + barras horizontales con rótulo y valor, párrafo y nota manuscrita | `bars` = `[{ lbl, val, w, tone }]`, `after`, `note` |
| `ficha` | ficha de respuesta con renglones de texto y el campo `FUENTE` en blanco, con un pie manuscrito. Alternativa a `compare` en la portada cuando no hay dos magnitudes que comparar | `ficha` = `{ lbl, lines, foot }` |
| `cta` | titular · regla · bajada · pasos numerados · firma grande | `headline`, `lede`, `steps`, `source` |

`tone`: `rosa` · `celeste` · `amarillo` · `gris`.

**Sobre `compare`:** `h` es la altura en px y la elegís vos — no es un gráfico a escala.
Las dos cajas muestran que una es mucho más chica que la otra; la magnitud exacta la lee
el lector del número escrito adentro, a 56px. Por eso funciona con un factor de 25:1,
que dibujado a escala sería ilegible. Lo único que no podés hacer es invertir la
relación: si el valor es menor, la caja va más chica.
