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

## Las piezas que este estilo ya dibuja

Estan en `ejemplos/04-plano-en-negativo/piezas.md`, con los campos que lee cada una.
Viven ahi y no aca a proposito: son las placas del carrusel con el que se armo el
estilo, no un menu de donde elegir.

Que lleva cada placa lo decide el contenido — el arbol de
`references/composicion.md`. Recien con el recurso ya elegido se mira si este
estilo lo dibuja.

**Cuando no lo dibuja, se agrega al estilo**, con las reglas de arriba: la entrada
en `piezas.md`, el bloque en el `render()` de `index.html`, y sus clases en
`styles.css` usando solo variables de `tokens.css` y la grilla de `grid.css`. Los
tres, o la pieza no existe. Eso es componer dentro del sistema visual.

Lo que no se hace es al reves: elegir una pieza porque ya esta hecha y despues
buscar con que llenarle los campos. **Si tuviste que inventar el contenido de un
campo para que la pieza no quede vacia, esa pieza no va en esa placa.**

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

## Consistencia de serie (2026-09-04)

Decidido por el usuario despues de armar el carrusel de Claude Fable 5.1. **Lo que se
repite en todas las placas tiene que caer siempre en el mismo lugar**: al deslizar, una
linea que salta 20px se ve mas que cualquier detalle de composicion.

- **El pie va anclado al borde inferior**, fuera del flujo. Antes lo empujaba el contenido:
  una placa con un parrafo de mas lo bajaba 49px y la fila saltaba. El `padding-bottom` de
  `.slide` reserva su lugar.
- **Si el contenido no entra, se acorta el contenido.** No se corre el pie ni se achica el
  cuerpo del texto. `render-and-audit.mjs` marca como red issue el texto que queda debajo
  del pie anclado — es un chequeo que antes no existia, porque con el pie fuera del flujo
  el desbalance vertical ya no se dispara.
- **El arranque de la cabecera es uno solo** para portada y contenido.

Cuando toques el layout, medi: renderiza cada placa y compara la posicion de cabecera, cota
y pie. Si un valor no se repite en toda la serie, es un defecto — no una variante.

## La portada (2026-09-05)

Reglas generales en *La portada* (`references/proporcion.md`). Lo de este estilo:

- **Titular a 220px de techo** contra los 112px del resto, centrado, caja de 520px.
- **El filete cae en y=720 y mide el titular**, por el mismo mecanismo que el `03`.
- **El remate es opcional** y por default no va.
- **El grafico se apoya contra el filete en vez de centrarse en el hueco.** Centrado
  partia el sobrante en dos y dejaba un agujero de 382px entre titular y grafico, que el
  chequeo de `internal-gap` bloqueaba. Ahora el aire sobrante queda abajo, de una pieza.
- **El grafico de portada va mas grande que el de contenido** (cifras a 132px, rotulos a
  32px, chips a 32px) y centrado. Agrandarlo es el arreglo que pide *La portada* cuando
  sobra aire; bajar el titular o devolver un parrafo, no.
- Se retiro la excepcion `cover-hook-centered`.
