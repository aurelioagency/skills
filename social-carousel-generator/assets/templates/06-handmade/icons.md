# Set de iconos — `06-handmade`

Diez iconos de línea. El código está en `icons.js`; se usan con
`ICONS.icon(name, px, pastel, bg)`.

## Las tres reglas

1. **Contorno negro de grosor parejo.**
2. **Relleno plano de un solo pastel**, nunca degradado.
3. **Cero sombras.**

Esto es **geometría, no ilustración**. Escalan sin perder nada.

## Compensación de trazo

Igual que en `05-plano-de-taller`: el contorno se dibuja en unidades del viewBox, así
que al achicar el icono el trazo se afina. `icon()` lo compensa solo con
`stroke-width ≈ 520 ÷ px`, con piso en 4.

## Escala

**120–260px** sobre el lienzo de 1080, según la receta. En la lista etiquetada van más
chicos (~96px) porque acompañan una línea de texto.

## Los iconos

| Nombre | Qué muestra | Uso típico |
|---|---|---|
| `buscar` | lupa | pedir información · GET · consultar |
| `documento` | hoja con renglones | un registro, un archivo, una request |
| `crear` | hoja con un `+` | crear algo nuevo · POST |
| `editar` | lápiz | actualizar lo que existe · PUT |
| `borrar` | papelera | eliminar · DELETE |
| `sobre` | sobre cerrado | la respuesta que vuelve · response |
| `ok` | círculo con tilde | salió bien · 200 |
| `alerta` | triángulo con signo | algo falló · 404 · advertencia |
| `escudo` | escudo con tilde | seguridad, protección |
| `objetivo` | diana | el destino, el endpoint |

## Los pasteles

`verde` · `celeste` · `lila` · `coral` · `amarillo`

**Un pastel = un concepto, en todo el carrusel.** Si "Tabla" es verde en la placa 2,
sigue siendo verde en la 7 — y su icono también.

## Lo que este set NO da

Escenas con personajes, objetos con perspectiva, texturas de lápiz, ese temblor de trazo
humano. Eso pide ilustración de verdad.

Si el formato lo necesita, dos salidas honestas:

- Encargar un set de 10–15 doodles con esas mismas tres reglas y reutilizarlo siempre.
- Quedarse en formas geométricas simples — círculo, check, flecha, cuadrado — que con
  contorno negro leen igual de bien.

**Nunca mezcles estilos de ilustración dentro del mismo carrusel. Un set, todo el
carrusel.**

<!-- PLANTILLA — para agregar un icono:
     la entrada en la tabla + la funcion en icons.js.
     Las dos, o el icono no existe. Tiene que cumplir las tres reglas de arriba. -->
