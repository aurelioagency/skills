# Cómo se vuelcan los datos en un gráfico

Un gráfico mal codificado no se ve mal: se ve bien y dice otra cosa. Pasa la QA
automática y el contact sheet. Todo lo de acá salió de gráficos que casi se publican.

## Una métrica por gráfico

Una barra y un número en la misma fila se leen como la misma medición. Si la barra es el
costo y el número de al lado es el acierto, el lector ve barras opuestas junto a
porcentajes casi iguales y concluye que el gráfico está roto.

La salida no es aclarar el rótulo: es sacar la segunda métrica del gráfico y ponerla en
texto, donde dos números casi iguales se leen como "el mismo".

## Una serie, un color

El largo ya codifica el valor; pintar cada barra distinto lo codifica dos veces, y dos
colores le dicen al lector que hay dos categorías donde hay una sola serie.

El color entra solo cuando carga algo que el largo no puede. Dos cosas más:

- **Valencia:** en un gráfico de costo, la barra grande y brillante se lee como "la buena".
- **Contraste contra el campo:** un gris de panel sobre fondo casi negro se lee como hueco,
  no como barra.

## Los rótulos nombran lo que varía

El título dice qué mide la altura y qué se mantiene igual. Los rótulos dicen lo único que
cambia entre una barra y otra. Dos barras distintas con el mismo rótulo debajo rotulan la
constante y no explican nada.

El título dice **qué** se mide, no cuándo: `COSTO DE LA PRUEBA`, no
`COSTO · TRES MESES DE DIFERENCIA`.

## Sin cifra publicada no hay barra

Si la fuente dice cuál ganó pero no publica los puntajes, una barra con altura inventa un
dato. Usá tarjetas, una marca de "ganó", cualquier forma que muestre el orden sin fingir
magnitud.

Al revés también: si un gráfico sugiere escala sin números, esa escala sale de la cifra
real (`104/300 = 0,347`, la misma proporción que `13,3/38,3`).

## Cada cifra tiene un solo slide

Si el número ya tiene su gráfico en otro slide, este dibuja otra cosa.

El síntoma: **si probás tres formas distintas y todas terminan pareciéndose al gráfico de
otro slide, no es la forma, es que estás dibujando un dato que no te toca.** Dibujá el
mecanismo o la estructura; la cifra medida es del slide que la explica.

## Línea de base compartida

Las barras de un par apoyan en la misma línea, o el gráfico miente sobre la proporción.

Se rompe de forma indirecta: barra y rótulo juntos en una columna, columnas alineadas por
abajo, y un rótulo de dos renglones levanta su barra. Poné las barras en una fila y los
rótulos en otra. El ancho de columna lo pide el rótulo, no la barra.

## Los estados binarios no son un par comparable

Un interruptor apagado contra uno encendido sí lleva colores distintos: ahí el relleno es
la información, no una cantidad. "Una serie, un color" aplica a magnitudes comparables.
Si conviven en un mismo gráfico, cada una sigue su regla.
