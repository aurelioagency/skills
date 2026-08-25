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

## Piezas construidas

Lo que el `render()` de `index.html` ya sabe dibujar hoy, con los campos que lee cada
pieza. **Es un punto de partida, no un menú cerrado**: cada carrusel compone sus placas
dentro del estilo, y si le falta una pieza se agrega — la entrada acá + el bloque en
`render()` + sus clases en `styles.css`. Los tres, o la pieza no existe.

Este estilo no tiene placas con nombre: se compone a mano combinando componentes dentro
de la gramática de arriba.

| Componente | Qué dibuja |
|---|---|
| `fanout` | Un nodo que se abre hacia varios destinos. Patrón por defecto del gráfico de tapa. |
| `verdict` | Caja con borde de acento y una frase en mayúsculas. |
| `checklist` | Ítems con marca de color. |
| `flow` | Cajas verticales con flecha hacia abajo. |
| `grid` | Grilla 2x2 de tarjetas. |
| `bars` | Tres barras de acento, anchos decrecientes. |
| `mascot` | El personaje de la marca. **Nunca solo en su fila**: siempre con un componente al lado, a la misma altura. |
| `userImg` | Imagen que pasó el usuario. Transparente va directo; opaca va enmarcada. |
