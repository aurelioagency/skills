# Piezas del carrusel de ejemplo — `01-editorial-oscuro`

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
