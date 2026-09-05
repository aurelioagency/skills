# Estilo — `05-plano-de-taller`

El lenguaje visual del dibujo técnico aplicado tal cual, sin metáforas. Es el más denso
de la familia y el que más autoridad transmite.

Las figuras están en `figures.md` — **eso sí es una biblioteca declarada**, con sus 24
formas, sus 6 tramas, los 8 tipos de línea ISO 128-20 y la simbología normalizada.

## Las reglas que dan consistencia

- **Papel `#EDEAE3` con retícula de 60px al 6%.**
- **Barlow Condensed 600 en mayúsculas para titulares**, Barlow para cuerpo, JetBrains
  Mono para rótulos y cifras. La condensada es la firma del estilo.
- **Dos grosores de línea y nada más**, en proporción 2:1: gruesa 6px, fina 3px. Toda la
  jerarquía sale de combinar esos dos con los patrones. **Un tercer grosor es lo que
  hace que un plano se vea amateur.**
- **El relleno es siempre trama, nunca color plano.** Y la trama dice qué es: azul es lo
  bueno o lo nuevo, naranja es el problema. Nunca al revés y nunca por gusto estético.
- **La línea de eje (trazo y punto) es el separador entre bloques.** No la reemplaces
  por un filete liso: es la que le da el idioma al estilo.
- **El cartucho va en todas las placas.** Dato / fuente / autor. Obliga a citar, y eso
  solo separa del resto.
- **Máximo 3 figuras distintas por placa.** Más que eso deja de ser un diagrama y pasa a
  ser decoración.
- **Una forma por concepto, no por placa.** Si el modelo es el hexágono en la placa 2,
  sigue siendo el hexágono en la 7.
- **Margen de 80px parejo.** No se reduce.

- **Reticula de 60px a `opacity: 0.13`** = 28 niveles de diferencia sobre el papel
  `#EDEAE3`. A 0.06 daba 13, por debajo del umbral medido por la marca (14). No bajarla.
  (2026-09-01)

- **El valor `v` de las piezas de `corte` va corto.** La linea de cota cruza el cuadro a
  media altura, asi que una etiqueta larga queda tachada por la linea. `SI` / `NO` entra;
  `NO LA VES` sale tachado. (2026-09-01)

## Las piezas que este estilo ya dibuja

Estan en `ejemplos/05-plano-de-taller/piezas.md`, con los campos que lee cada una.
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

## La portada (2026-09-05)

Las reglas generales de portada estan en *La portada* en `references/proporcion.md` y
valen para todos los templates. Lo que este estilo resuelve distinto:

- **Titular con techo de 220px** contra los 112px del resto de la serie. Los 220 son el
  maximo del CSS, no el cuerpo de cada carrusel: ese se mide con `hsize`, que crece hasta
  que la linea mas larga llena los 918px utiles. En el carrusel de Fable 5.1 dio 220
  (`MYTHOS 5.1` mide 916); en otro con un titular mas largo va a dar menos. Si un titular
  no entra, se acorta el titular — no se baja el cuerpo.
- **La cota cae en y=720**, la mitad exacta del lienzo. La caja del titular es de 517px
  (del arranque de la cabecera a esa altura, menos los 48 que la separan de la cota), y el
  titular queda centrado adentro con `display: grid` + `align-content: center`, que aguanta
  cualquier cantidad de renglones.
- **La cota mide el titular**, en vez del 62% que usa el resto de la serie, y lo hace sola:
  titular y cota van envueltos en `.covertitle` con `width: fit-content`, asi que la caja se
  achica al renglon mas largo y la cota toma el 100% de esa caja. No hay un ancho clavado ni
  una medicion a mano por carrusel — cambia el titular y la cota lo sigue.
- **Todo el bloque va centrado.** Es la unica placa centrada del template. Por eso la
  portada dejo de necesitar la excepcion `cover-hook-centered`, que este template
  declaraba de fabrica y se saco.
- **El remate es opcional** y por default no va (`s.lede` esta guardado en `index.html`).
- **Las `secciones` van a 34px, en negrita y en tinta plena.** A 26px y en gris se leian
  como un pie de pagina, y son el grafico de la portada.

La consistencia de serie de abajo **no aplica a la portada**: su arranque, su escala y su
eje son propios por diseno, y `audit-serie.mjs` la deja fuera de la comparacion.

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
