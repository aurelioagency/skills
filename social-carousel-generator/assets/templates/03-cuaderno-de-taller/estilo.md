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

- **Reticula de 60px a `opacity: 0.13`** = 28 niveles de diferencia sobre el papel
  `#F2EFE7`. A 0.07 daba 15 y no se veia en un telefono; el umbral medido por la marca es
  14. No bajarla. (2026-09-01)

## Las piezas que este estilo ya dibuja

Estan en `ejemplos/03-cuaderno-de-taller/piezas.md`, con los campos que lee cada una.
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

**Grosor de linea: 3px reales sobre el lienzo.** Es el unico estilo de papel, y el unico donde el icono IGUALA su chrome exacto: los bordes de tinta de los pasteles, las etiquetas y la regla de cota son todos de 3px. A 2px el icono queda flaco al lado de la etiqueta que tiene enfrente.

`stroke-width` NO esta en pixeles: esta en las unidades del viewBox del icono, que en
Lucide y en Tabler es de 24. Un icono a 56px se escala x2,33, asi que el valor a poner
depende del tamanio al que vaya:

```
stroke-width = 3 x 24 / tamanio_en_px
```

Tamanio del icono: 40-56px, segun cuanto peso tenga que cargar el slide. Chico como para
no competir con el titular, nunca tan chico que se lea como una marca perdida.

`stroke="currentColor"` y el color manejado desde el CSS del elemento que lo envuelve,
siempre con un acento de la paleta de este estilo, nunca un hex escrito a mano.

Nunca mezcles dos grosores de icono dentro de un mismo carrusel.

**Qué piezas lo aceptan:** `parts` — va antes de la etiqueta `P-01`, alineado con ella.

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
- **La cota va a la misma altura y con el mismo ancho en toda la serie.** El titular tiene
  altura fija de tres renglones, asi que con dos renglones el bloque igual ocupa tres y la
  cota no se mueve; el ancho salio de `ruleWidth` por slide y paso a ser uno solo. Cuando el
  tema lo permita, se escribe el titular a tres renglones: con dos queda aire entre el
  titular y la cota.

Cuando toques el layout, medi: renderiza cada placa y compara la posicion de cabecera, cota
y pie. Si un valor no se repite en toda la serie, es un defecto — no una variante.

## La portada (2026-09-05)

Reglas generales en *La portada* (`references/proporcion.md`). Lo de este estilo:

- **Titular a 220px de techo** contra los 104px del resto de la serie, centrado, con la
  caja de 520px que va del arranque de la cabecera a la mitad del lienzo.
- **La cota cae en y=720 y mide el titular**, no el 62% que usa el resto de la serie.
  Sale de envolver titular y cota en `.covertitle` con `width: fit-content`: la cota toma
  el 100% de esa caja, asi que sigue al titular sin numeros clavados.
- **El remate es opcional** y por default no va.
- **Las `secciones` van a 32/36px en negrita** en vez de 24/30px: son el grafico de la
  portada, no una nota al pie.
- Se retiro la excepcion `cover-hook-centered`.
- El titular del fixture se acorto: el anterior entraba a 120px, apenas por encima de los
  104px de contenido, o sea que la portada no se distinguia. Es el caso tipico de *cuanto
  mas larga la frase, mas chico entra*.
