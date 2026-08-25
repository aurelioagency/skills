# Biblioteca de figuras — `05-plano-de-taller`

24 formas × 6 tramas = 144 combinaciones. Suficiente para que ningún carrusel repita al
anterior. El código está en `figures.js`; se usa con
`FIGURES.figure(id, px, trama, bg)`.

## Las tres reglas

Todas las figuras las cumplen, y por eso cualquier combinación pertenece a la familia:

1. **Contorno negro de grosor único.**
2. **Relleno sólo por trama**, nunca color plano.
3. **Cero sombras, cero degradados.**

## Compensación de trazo

El contorno se dibuja en unidades del viewBox, así que al achicar la figura el trazo se
afina y la viñeta se ve gris y débil al lado del texto. `figure()` lo compensa solo:

```text
stroke-width ≈ 600 ÷ tamaño en px
44px → 13   ·   80px → 7   ·   150px → 4   ·   300px → 2
```

El grosor real queda constante en ~6px. Si alguna vez dibujás una figura a mano fuera de
`figures.js`, aplicá la misma fórmula.

## Los cuatro tamaños

| Escala | px | Grupo | Uso |
|---|---|---|---|
| `vineta` | 44–52 | solo A, y solo las más simples | Al lado de una línea de texto. Cero detalle interno. |
| `item` | 72–90 | A y B | Encabeza un bloque de dos o tres líneas. Un detalle interno se lee bien. |
| `nodo` | 120–180 | A y B | Pieza de un flujo con flechas. Tres por placa, cuatro como máximo. |
| `protagonista` | 260–400 | A y B | Una sola figura sosteniendo la placa entera, con el título arriba y nada más. **Una vez por carrusel.** |

## Las seis tramas

**El relleno dice qué es.** No se elige por gusto estético.

| Trama | id | Significado |
|---|---|---|
| `normal` | `hb` | 45° normal — el caso base |
| `invert` | `hr` | 45° invertida — la otra pieza |
| `densa` | `hd` | densa — más carga, más peso |
| `cruzada` | `hx` | cruzada — bloqueado, no toca |
| `azul` | `hz` | **lo bueno / lo nuevo** |
| `naranja` | `hn` | **el problema** |

## Grupo A · formas base

Un concepto, sin jerarquía interna. Un carrusel entero con grupo A se lee limpio y
rápido.

`A-01` círculo · `A-02` cuadrado · `A-03` triángulo · `A-04` rombo · `A-05` hexágono ·
`A-06` trapecio · `A-07` semicírculo · `A-08` escalón · `A-09` chaflán · `A-10` cruz ·
`A-11` flecha · `A-12` sector

## Grupo B · compuestas

Algo dentro de algo: contiene, atraviesa, divide. Un carrusel con grupo B se lee técnico
y denso.

| id | Nombre | Lee como |
|---|---|---|
| `B-01` | núcleo | algo con un centro |
| `B-02` | inscrito | una pieza dentro de otra |
| `B-03` | ejecuta | algo que corre / procesa |
| `B-04` | encaje | dos piezas que ajustan |
| `B-05` | capas | niveles concéntricos |
| `B-06` | mitad | una parte del total |
| `B-07` | matriz | combinación en dos ejes |
| `B-08` | perforada | con puntos de conexión |
| `B-09` | ranura | con una entrada |
| `B-10` | transmite | algo que pasa a otra cosa |
| `B-11` | anidado | jerarquía de contención |
| `B-12` | pila | capas apiladas |

## Cómo elegir sin repetirse

- **Una forma por concepto, no por placa.** Si "el modelo" es el hexágono en la placa 2,
  sigue siendo el hexágono en la 7. La coherencia la da eso, no el estilo.
- **Cambiá el grupo, no el sistema.** Elegí A o B por carrusel y no los mezcles al azar.
- **La trama es el estado.** Naranja sólo para lo que está mal, azul para lo resuelto,
  negro para lo neutro.
- **Máximo 3 formas distintas por placa.** Más que eso es decoración.

## Los ocho tipos de línea (ISO 128-20)

Esto es lo que más rendimiento da y lo que nadie copia, porque hay que saberlo: en un
plano **el grosor y el patrón de la línea ya son información**, antes de cualquier
texto. Da una jerarquía completa sin agregar un solo color.

| Tipo | Qué es en el plano | En la placa |
|---|---|---|
| A · continua gruesa | aristas y contornos visibles | el borde de lo que estás afirmando |
| B · continua fina | cotas, referencias, rayado | todo lo auxiliar: separadores, fuentes, notas |
| C/D · rotura en zigzag | la pieza sigue, se recortó el dibujo | "hay más y no entra" — cierra una lista larga sin fingir que era completa |
| E/F · de trazos | aristas **ocultas**: existen, las tapa el material | el costo, el paso o el riesgo que está ahí y nadie mira |
| G · trazo y punto fina | ejes de simetría, dónde está el centro | el separador entre bloques (`.eje`) |
| H · trazo y punto con extremos gruesos | plano de corte: por acá se abre la pieza | la transición: "hasta acá lo que se ve; ahora entramos" |
| J · trazo y punto gruesa | superficie con requisito especial | subrayar **una sola** cosa por carrusel |
| K · trazo y doble punto | pieza vecina, o posición extrema de algo móvil | el escenario futuro, lo que todavía no es |

**A 1080px de ancho: gruesa 6px, fina 3px.** La fina es exactamente la mitad de la
gruesa, en todo el dibujo, y no hay una tercera.

## Simbología normalizada

Estas están normalizadas de verdad (ISO 128, 7200, 1101, 2553). Se dividen en dos grupos
según **cómo** se usan.

### Usables — el significado real coincide

| Símbolo | En el plano | En la placa |
|---|---|---|
| Plano de corte A–A | por acá se abre la pieza | placa de transición: "ahora abrimos el proceso por dentro" |
| Línea oculta | arista tapada por el material | el costo o el riesgo que nadie mira |
| Línea de rotura | la pieza sigue, se recortó | "acá hay más y no entra" |
| Cota con directriz · ⌀ | flecha que termina en una medida | señalar un número dentro de un gráfico sin desarmar el layout |
| Tolerancia ± | rango real aceptable | **el recurso más honesto que hay**: si el ahorro varía entre casos, decilo con ± en vez de inventar un número redondo |
| Cartucho · ISO 7200 | quién dibujó, qué, en qué revisión | el pie de placa: dato / fuente / autor |

### Como firma — rol fijo, declarado una vez

Su significado literal es una medida física, así que **no se usan para explicar**. Van
como elementos de marca con función: un rol elegido una vez, que no cambia nunca, y con
un número real adentro. Un marco de estos con un dato inventado es lo único que haría
quedar mal.

| Símbolo | Rol de marca |
|---|---|
| Marco GD&T · ISO 1101 | el contenedor de las métricas. Toda cifra medida va en ese marco de tres celdas. Cuando aparece, el lector ya sabe que viene un número real. |
| Acabado superficial | el sello de verificación. Un tilde con brazo largo: "esto cumple". En la placa de cierre y en los casos implementados, siempre en el mismo lugar. |
| Soldadura · ISO 2553 | integración entre dos sistemas. Una flecha que apunta a la unión de dos piezas y anota cómo se unen. Reservado sólo para eso. |
| Designación de rosca | el código de la publicación. En vez de "post #14", una designación tipo `M12-A` en el cartucho. |

**Criterio único: un símbolo, un rol, para siempre.** No importa que la analogía sea
libre — importa que sea constante y que el dato de adentro sea real.

<!-- PLANTILLA — para agregar una figura:
     la entrada en el grupo que corresponda + la funcion en figures.js.
     Las dos, o la figura no existe. Tiene que cumplir las tres reglas de arriba. -->
