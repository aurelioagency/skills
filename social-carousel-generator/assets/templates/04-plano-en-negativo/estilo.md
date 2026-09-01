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

- **Reticula turquesa de 60px a `opacity: 0.16`** = 26 niveles de diferencia sobre el
  campo `#101418`. A 0.05 daba 8, la mitad del umbral medido por la marca (14). No
  bajarla. (2026-09-01)

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

## Iconos de Lucide/Tabler

**Grosor de linea: 2.5px reales sobre el lienzo.** Los filetes son de 2px y las barras de acento de 5px. Campo oscuro otra vez, asi que el icono queda apenas por encima del filete: a 2px se va liviano y a 3px empieza a pesar mas que la barra.

`stroke-width` NO esta en pixeles: esta en las unidades del viewBox del icono, que en
Lucide y en Tabler es de 24. Un icono a 56px se escala x2,33, asi que el valor a poner
depende del tamanio al que vaya:

```
stroke-width = 2.5 x 24 / tamanio_en_px
```

Tamanio del icono: 40-56px, segun cuanto peso tenga que cargar el slide. Chico como para
no competir con el titular, nunca tan chico que se lea como una marca perdida.

`stroke="currentColor"` y el color manejado desde el CSS del elemento que lo envuelve,
siempre con un acento de la paleta de este estilo, nunca un hex escrito a mano.

Nunca mezcles dos grosores de icono dentro de un mismo carrusel.

**Qué piezas lo aceptan:** `stack` y `checks` — en `checks` reemplaza a la marca ▪, no van los dos.

Se copia el **interior** del `<svg>` de lucide.dev o tabler.io/icons — los `<path>`, sin
la etiqueta `<svg>` — y va en el slide como `ico: { d: '<path .../>' }`. Opcional `px`
para cambiar el tamaño.

**El `stroke-width` no se escribe a mano.** Lo calcula `ico()` en `index.html` con el
grosor de arriba y el tamaño del ícono. Si lo escribís vos, se rompe la consistencia en
cuanto un ícono vaya a otro tamaño.

Para que una pieza más acepte ícono hay que tocar los tres archivos: `index.html` (que
lo dibuje), `styles.css` (cómo se alinea) y este archivo (que quede documentado). Los
tres, o el dato queda en `slide-data.js` y no aparece nada.
