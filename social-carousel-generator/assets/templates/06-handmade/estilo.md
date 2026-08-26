# Estilo — `06-handmade`

Cuaderno a mano: papel crema, dos manuscritas, cinco pasteles y cuatro marcas hechas con
cajas y bordes. Ninguna ilustración dibujada hace falta.

Este estilo no se transcribió de un carrusel: se construyó desde la receta de siete
decisiones del archivo de origen, así que los valores de abajo están declarados, no
estimados.

## Las reglas que dan consistencia

- **Papel crema `#FCEFE3` en TODAS las placas**, sin degradados y sin excepción.
- **Dos manuscritas, nunca tres.** Gochi Hand para títulos, Patrick Hand para cuerpo. El
  cuerpo lleva tracking abierto (`+0.02em`) y mucho aire entre líneas: se lee como
  escrito con marcador fino, no como fuente.
- **Título siempre arriba y centrado, con subrayado verde debajo.**
- **Los pasteles nunca son fondo:** sólo resaltador, relleno de caja o subrayado.
- **Un pastel = un concepto, en todo el carrusel.** Si Tabla es verde en la placa 2,
  sigue siendo verde en la 7.
- **Ningún radio de borde es simétrico.** Es el detalle que hace la magia: escribir
  `border-radius: 22px 20px 24px 18px` en vez de `20px` y el ojo lo lee como trazo
  humano. Con un radio único se pierde todo el carácter del formato.
- **Una idea por placa.** Si necesitás dos, son dos placas.
- **Aire sí, agujeros no.** Este estilo respira más que los otros cinco y está bien, pero
  el contenido tiene que quedar repartido: nada de bloques pegados arriba y abajo con un
  vacío enorme en el medio. Lo mide el chequeo de hueco interno, igual que a todos.
- **Firma en la misma esquina en todas las placas.**
- **Margen de 88px a los lados y 96px arriba y abajo.** No se reduce.

## La grilla, que es siempre la misma

Cinco zonas fijas, en este orden:

1. Título arriba, centrado
2. Subrayado verde debajo del título
3. Bajada opcional, máximo 2 líneas
4. Contenido (lista, cajas o ilustración)
5. Firma abajo a la derecha

## Escala

| Elemento | px |
|---|---|
| Título | 108 (rango 96–120), line-height 1.02, 2 líneas máx |
| Bajada | 52 (rango 44–54), line-height 1.5, tracking 0.02em, máx 6 palabras por línea |
| Etiqueta | 46 |
| Cuerpo | 44 |
| Firma | 40 |

**Nada por debajo de 38px.** Es el piso que declara este formato, más bajo que el de
`SKILL.md` — por eso lleva la excepción `typography-floor`.

## Las cuatro marcas a mano

Todo el hecho a mano sale de cuatro recursos repetidos.

| Marca | Spec | Cuándo |
|---|---|---|
| Resaltador (`.hl`) | padding `2px 10px`, radius `6px` | **sólo términos técnicos**, nunca énfasis genérico |
| Subrayado de título (`.sub-titulo`) | alto `12px`, verde línea, ancho 55–70% del título | en todas las placas, debajo del título |
| Subrayado de frase (`.uline`) | `inset 0 -6px 0` con el pastel del concepto | **una vez por placa** |
| Caja irregular (`.caja`) | borde `3px` tinta, radius con 4 valores distintos | contenedores |

## Los pasteles

`#C9DCC4` verde · `#C3D8EA` celeste · `#D5CCE8` lila · `#F5B5AB` coral · `#FAE0A6`
amarillo · `#A8C3B4` línea · `#1B1A18` tinta · `#6E6E6E` firma

## Piezas construidas

La receta declara **cinco plantillas y nada más**: la repetición es lo que lo hace ver
profesional, no la variedad. Antes de agregar una sexta, mirá si alguna de estas sirve.

| `type` | Qué dibuja | Campos |
|---|---|---|
| `cover` | título · subrayado · bajada · escena de iconos | `titulo`, `subWidth`, `bajada`, `escena` = `[{ name, px, pastel }]` o `img` |
| `lista` | título · subrayado · bajada opcional · filas de icono + término resaltado + definición | `lista` = `[{ ico, pastel, k, t }]` |
| `antes` | título · subrayado · dos cajas irregulares con una flecha entre ellas | `a`/`b` = `{ k, t }` |
| `semaforo` | título · subrayado · filas de luz de color + chip de estado + consecuencia | `semaforo` = `[{ pastel, k, t }]` |
| `cta` | título · subrayado · bajada · mancha · frase de cierre · firma grande | `titulo`, `bajada`, `cierre` |

En `semaforo` el color del estado no es decorativo: verde bien, amarillo atención, coral
mal.

## Sobre las ilustraciones

Los iconos de `icons.js` cumplen tres reglas: **contorno negro fino y parejo**, **relleno
plano de un solo pastel**, **cero sombras y cero degradados**. Escala 120–260px en el
lienzo de 1080. El catálogo está en `icons.md`.

Lo que ese set **no** da: escenas con personajes, objetos con perspectiva, texturas de
lápiz, el temblor de trazo humano. Si el carrusel lo necesita, se encarga un set de
10–15 doodles con esas mismas tres reglas y se reutiliza siempre.

**Nunca mezcles estilos de ilustración dentro del mismo carrusel. Un set, todo el
carrusel.**

## Chequeo antes de publicar

- Mismo fondo crema en todas las placas
- Título en el mismo lugar y tamaño en todas
- Un pastel = un concepto, en todo el carrusel
- Nada de texto por debajo de 38px
- Una idea por placa, sin excepciones
- Margen libre: 88px a los lados, 96px arriba y abajo
- Firma en la misma esquina en todas
- Un solo set de ilustraciones
