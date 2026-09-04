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
| `pasos` | cabeza estandar + secuencia numerada, un paso por renglon | `pasos` = `[{ n, t }]` |
| `cifras` | cabeza estandar + dos cifras independientes con rotulo y detalle. Va cuando las dos magnitudes NO se comparan entre si | `cifras` = `[{ n, u, lbl, t }]` |
| `image` | cabeza estandar + una imagen publicada por la fuente, enmarcada | `img`, `imgTransparent` opcional |
| `secciones` | grafico de portada: los bloques en que se divide el tema | `secciones` = `{ lbl, items: [str] }` |
| `cta` | titular · regla · bajada · pasos numerados · firma grande | `headline`, `lede`, `steps`, `source` |

`tone`: `rosa` · `celeste` · `amarillo` · `gris`.

**Sobre `compare`:** `h` es la altura en px y la elegís vos — no es un gráfico a escala.
Las dos cajas muestran que una es mucho más chica que la otra; la magnitud exacta la lee
el lector del número escrito adentro, a 56px. Por eso funciona con un factor de 25:1,
que dibujado a escala sería ilegible. Lo único que no podés hacer es invertir la
relación: si el valor es menor, la caja va más chica.


## Densidad compartida con la familia de ingenieria (2026-09-04)

El `03`, el `04` y el `05` comparten escala y estructura, para que un carrusel escrito una
vez entre en cualquiera de los tres sin reeditar la copy:

- **Cuerpo de la descripcion: 40px.** El `03` y el `04` estaban en 42.
- **Un item es rotulo + descripcion.** El `parts` del `03` dibujaba ademas un nombre
  manuscrito: tres bloques donde los otros dos tienen dos, y en una placa de cuatro items
  eso son 208px que no existen en los demas. `tag` y `name` quedaron opcionales.
- **Arranque de cabecera `--grid-top: 34px`** en los tres.
- **El pie sale del render**, con `footerBrand` y `footerAuthor`, y se lee igual en todas
  las placas — incluida la de cierre, que antes agrandaba la firma.
