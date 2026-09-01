# Piezas del carrusel de ejemplo — `06-handmade`

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

**Excepcion declarada de este estilo: `repeticion-deliberada`.** El 06 se compone con
cinco plantillas y la repeticion es parte de su identidad — asi se ve una receta hecha a
mano, no un carrusel de nueve composiciones distintas. Es la unica excepcion viva a la
regla de variedad de `references/composicion.md`, y por eso esta escrita aca con nombre.

No la vuelve un molde. El recurso de cada placa lo sigue eligiendo el contenido: lo que
esta excepcion autoriza es que el mismo recurso pase del 40% de las placas, no que se
elija una plantilla y despues se busque con que llenarla. Antes de agregar una sexta,
mira si alguna de estas hace lo que la placa necesita.

| `type` | Qué dibuja | Campos |
|---|---|---|
| `cover` | título · subrayado · bajada · escena de iconos | `titulo`, `subWidth`, `bajada`, `escena` = `[{ name, px, pastel }]` o `img` |
| `lista` | título · subrayado · bajada opcional · filas de icono + término resaltado + definición | `lista` = `[{ ico, pastel, k, t }]` |
| `antes` | título · subrayado · dos cajas irregulares con una flecha entre ellas | `a`/`b` = `{ k, t }` |
| `semaforo` | título · subrayado · filas de luz de color + chip de estado + consecuencia | `semaforo` = `[{ pastel, k, t }]` |
| `cta` | título · subrayado · bajada · mancha · frase de cierre · firma grande | `titulo`, `bajada`, `cierre` |

En `semaforo` el color del estado no es decorativo: verde bien, amarillo atención, coral
mal.
