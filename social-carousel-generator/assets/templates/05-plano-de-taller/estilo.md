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

## Piezas construidas

Lo que el `render()` de `index.html` ya sabe dibujar hoy, con los campos que lee cada
pieza. **Es un punto de partida, no un menú cerrado**: cada carrusel compone sus placas
dentro del estilo, y si le falta una pieza se agrega — la entrada acá + el bloque en
`render()` + sus clases en `styles.css`. Los tres, o la pieza no existe.

| `type` | Qué dibuja | Campos |
|---|---|---|
| `cover` | encabezado · titular condensado 112px · regla de cota con la magnitud · bajada · corte y sección · cartucho | `tab`, `headline`, `ruleWidth`, `ruleLabel`, `lede`, `a`/`b`, `cartucho` |
| `nodos` | cabeza estándar + nodos con figura, rótulo mono azul, nombre condensado y descripción, separados por línea de eje | `nodos` = `[{ fig:{ id, px, trama }, k, name, desc }]`, `img` opcional |
| `bars` | cabeza estándar + barras rayadas, línea de eje, cifra dominante y sellos | `bars` = `[{ lbl, val, w, tone }]`, `factor` = `{ n, t }`, `sellos`, `cartucho` |
| `cta` | titular condensado 116px · regla · bajada · checklist · cartucho | `headline`, `ruleWidth`, `lede`, `checks`, `cartucho` |

`tone`: `azul` · `naranja` · `normal` · `invert` · `densa`. Los `id` de figura y las
tramas están en `figures.md`.

El `ruleLabel` de la portada lleva la magnitud (`FACTOR 25:1`), no una etiqueta
genérica: es una cota, y una cota siempre mide algo. El `factor` es la cifra dominante
de la placa: una sola, porque dos compiten y ninguna se lee.
