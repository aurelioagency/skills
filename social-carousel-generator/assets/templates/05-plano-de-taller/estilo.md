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
