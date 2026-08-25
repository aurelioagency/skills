# Estilo — `04-plano-en-negativo`

Plano técnico en negativo: campo oscuro, retícula turquesa tenue, tipografía geométrica
apretada. El tono es autoridad y prueba — afirma y muestra el número.

## Las reglas que dan consistencia

- **Campo `#101418` con retícula turquesa de 60px al 5%.** Al 5% da papel milimetrado
  sin competir con el texto; más fuerte y el campo deja de leerse negro.
- **Una sola familia de texto: Space Grotesk.** El peso y el tamaño hacen toda la
  jerarquía. JetBrains Mono sólo para rótulos y cifras.
- **Titulares en peso 700 con tracking negativo fuerte** (`-0.03em`) y line-height ~1.
- **El filete va debajo del titular** en toda placa de contenido. Es lo que separa
  titular de cuerpo en todo el estilo.
- **El estado del encabezado es la firma del formato:** un punto de color y una palabra
  (`VERIFICADO`, `MISMO MODELO`, `CUPOS ABIERTOS`). Dice en qué situación está el dato;
  no decora.
- **Los tres acentos tienen función asignada.** Turquesa: lo bueno, lo verificado, el
  resultado. Ámbar: la advertencia, el caso viejo. Azul: la tercera vía, cuando hacen
  falta tres categorías. No se eligen por gusto.
- **Un remate por placa.** El filete de acento a la izquierda pierde peso si aparece dos
  veces.
- **Margen de 80px parejo.** No se reduce.

## Piezas construidas

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
