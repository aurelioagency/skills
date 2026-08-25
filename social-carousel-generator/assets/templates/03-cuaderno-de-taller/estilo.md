# Estilo — `03-cuaderno-de-taller`

Registro didáctico: papel claro, retícula tenue, titulares manuscritos. El tono baja la
guardia — explica sin postura de autoridad.

## Las reglas que dan consistencia

- **Papel `#F2EFE7` con retícula de 60px al 7%.** Al 7% se lee como papel cuadriculado;
  más fuerte compite con el texto y más débil desaparece en pantalla.
- **Tres familias con roles fijos:** Architects Daughter para titulares, Space Grotesk
  para cuerpo, JetBrains Mono para rótulos. No se cruzan.
- **La regla de cota** —rombo · línea · rombo— va debajo del titular en toda placa de
  contenido, y su ancho acompaña al largo del titular, no al ancho de la placa.
- **Los cuatro pasteles van siempre con borde de 3px de tinta.** Sin borde pierden el
  carácter de recorte pegado en un cuaderno.
- **Una nota manuscrita por placa como máximo.** Dos le sacan el peso a las dos.
- **Pie de dos columnas:** fuente a la izquierda, firma manuscrita a la derecha.
- **Margen de 80px parejo.** No se reduce.

Pasteles: `#D9A79C` rosa (el caso caro, el antes) · `#B9CFE0` celeste (el caso bueno, el
después) · `#F0C874` amarillo (el subrayado, la nota al margen) · `#C9CEC7` gris (lo
neutro, la línea base).

## Piezas construidas

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
| `cta` | titular · regla · bajada · pasos numerados · firma grande | `headline`, `lede`, `steps`, `source` |

`tone`: `rosa` · `celeste` · `amarillo` · `gris`.

**Sobre `compare`:** `h` es la altura en px y la elegís vos — no es un gráfico a escala.
Las dos cajas muestran que una es mucho más chica que la otra; la magnitud exacta la lee
el lector del número escrito adentro, a 56px. Por eso funciona con un factor de 25:1,
que dibujado a escala sería ilegible. Lo único que no podés hacer es invertir la
relación: si el valor es menor, la caja va más chica.
