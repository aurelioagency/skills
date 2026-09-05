# Estilo — `01-editorial-oscuro`

Campo negro editorial con grilla de puntos, curvas de contorno y dos glows radiales. Es
el estilo original de La Casa y el que más carruseles publicados tiene.

Los valores medidos —hex, tramas, glows, tipografía— están en
`references/la-casa-preset.md`, que es la copia que manda. Acá va lo que hay que
respetar al componer.

## Las reglas que dan consistencia

- **La gramática es fija**, y `render-and-audit.mjs` la verifica:

  ```
  kicker → titular → cuerpo chico → componente → veredicto
  ```

  Un slide sin kicker o sin titular es red issue. El titular puede ser una cifra
  dominante de 90px o más: un `25,6%` grande manda la placa igual que un titular. Un
  cuerpo inflado a 64-70px no llega — y esa es justo la salida fácil que hay que evitar.
- **Un acento dominante por placa.** Las cuatro familias pueden convivir en el carrusel,
  nunca las cuatro en una misma placa salvo en elementos chicos agrupados.
- **El campo nunca es plano.** Grilla de puntos, curvas y los dos glows van siempre; sin
  ellos el fondo se lee como negro liso y deja de ser este estilo.
- **La portada es centrada**, con dos familias y dos colores: titular Archivo Black y
  remate Georgia itálica en el acento dominante.
- **La lista de "nunca en una placa" del preset es cerrada.** Sin badges de esquina, sin
  monogramas, sin watermark, sin logo en placas de contenido.

## Las piezas que este estilo ya dibuja

Estan en `ejemplos/01-editorial-oscuro/piezas.md`, con los campos que lee cada una.
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

**Grosor de linea: 2px reales sobre el lienzo.** El chrome de este estilo son bordes de panel de 1.5px y curvas de 1.6px, pero el campo es oscuro: una linea clara sobre negro se lee mas fina de lo que es, asi que el icono queda un escalon por encima del filete al que acompania. A 1.5px reales se afina y desaparece.

`stroke-width` NO esta en pixeles: esta en las unidades del viewBox del icono, que en
Lucide y en Tabler es de 24. Un icono a 56px se escala x2,33, asi que el valor a poner
depende del tamanio al que vaya:

```
stroke-width = 2 x 24 / tamanio_en_px
```

Tamanio del icono: 40-56px, segun cuanto peso tenga que cargar el slide. Chico como para
no competir con el titular, nunca tan chico que se lea como una marca perdida.

`stroke="currentColor"` y el color manejado desde el CSS del elemento que lo envuelve,
siempre con un acento de la paleta de este estilo, nunca un hex escrito a mano.

Nunca mezcles dos grosores de icono dentro de un mismo carrusel.

**Qué piezas lo aceptan:** `checklist` — el ícono reemplaza a la marca de color, no van los dos.

Se copia el **interior** del `<svg>` de lucide.dev o tabler.io/icons — los `<path>`, sin
la etiqueta `<svg>` — y va en el slide como `ico: { d: '<path .../>' }`. Opcional `px`
para cambiar el tamaño.

**El `stroke-width` no se escribe a mano.** Lo calcula `ico()` en `index.html` con el
grosor de arriba y el tamaño del ícono. Si lo escribís vos, se rompe la consistencia en
cuanto un ícono vaya a otro tamaño.

Para que una pieza más acepte ícono hay que tocar los tres archivos: `index.html` (que
lo dibuje), `styles.css` (cómo se alinea) y este archivo (que quede documentado). Los
tres, o el dato queda en `slide-data.js` y no aparece nada.

## La portada (2026-09-05)

Reglas generales en *La portada* (`references/proporcion.md`). Esta portada ya estaba
centrada y con su grafico, asi que casi todo ya se cumplia. Lo que cambio:

- **El giro pasa a ser opcional** en el render.
- **El titular no puede ir mas grande: 90px es el techo de la fuente.** Archivo Black es
  muy ancho y a 90px un titular de dos palabras ya llena los 972px utiles; subir el cuerpo
  solo suma renglones. Este template no cumple el "titular sensiblemente mas grande" de
  *La portada* por escala — lo cumple por centrado, contraste de familias y grafico.
  Medido el 2026-09-05.
