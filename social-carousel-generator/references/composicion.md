# Que recurso visual va en cada placa

El estilo dice **como se ve** una placa. Este archivo dice **que lleva**, y es lo
unico que decide esa pregunta. La cadena de mando es una sola y no se invierte:

> El objetivo decide el contenido. El contenido decide la estructura y la cantidad de
> placas. La estructura decide que recurso visual pide cada placa. El estilo decide
> solo como se dibuja ese recurso. **El estilo nunca decide cuantas placas hay, ni que
> dice una placa, ni que recurso aparece.**

Se corre **placa por placa**, en el gate de aprobacion de copy, con la copy ya escrita
y antes de tocar un archivo. La salida es una linea por placa:

```text
Placa 4 — recurso: comparacion de dos magnitudes
          por que: la fuente publica los dos numeros y el punto de la placa es la brecha
          dato: 43,6% vs 34,4% (parrafo 7)
```

## El arbol

Evaluá en orden y pará en la primera que se cumpla. El orden es la precedencia cuando
una placa cumple mas de una.

1. **¿La fuente publica el grafico y el grafico es el punto de la placa?**
   → Va **esa imagen**, tal cual. No se redibuja, no se recolorea, no se discute el
   encuadre. Ver *Images the user supplies* en `SKILL.md`.

2. **¿Hay dos o mas magnitudes medidas, publicadas, que se comparan entre si?**
   → **Comparacion cuantitativa** (barras, dos cifras grandes, dos cajas).
   Requisito duro: las cifras existen en la fuente. Sin cifra publicada no hay altura
   de barra ni caja proporcional — ver `references/data-encoding.md`.

3. **¿Hay dos estados o dos opciones que se contrastan pero sin magnitud?**
   → **Comparacion cualitativa**: dos tarjetas, antes/despues, tachado/marcado. Sin
   barras y sin numeros inventados.

4. **¿La placa explica como funciona algo — partes, flujo, causa y efecto?**
   → **Esquema**: diagrama, nodos, capas, un recorrido. Dibuja el mecanismo, no la
   conclusion.

5. **¿Hay una sola cifra y esa cifra es la placa?**
   → **Dato destacado**: la cifra dominante con su unidad y su rotulo. Una sola. Dos
   cifras grandes en la misma placa compiten y no se lee ninguna.

6. **¿Hay pasos con orden obligatorio?**
   → **Secuencia**: numerada, un paso por item, sin saltos.

7. **¿Hay items sin dependencia entre si?**
   → **Lista** o **checklist**. La lista enumera; el checklist se guarda para el
   contenido de referencia, que el usuario declara al confirmar el split.

8. **¿La fuente dice algo mejor de lo que vos lo vas a decir?**
   → **Cita**, textual y atribuida. Nunca parafraseada dentro de comillas.

9. **¿La idea es abstracta y hay una imagen concreta que la sostiene sin decorar?**
   → **Metafora visual** o **asset del banco de marca**. La prueba: si sacas la
   imagen, ¿la placa dice lo mismo? Si si, es decoracion; sacala.

10. **Nada de lo anterior.**
    → **Solo tipografia**, deliberadamente. Es una decision valida y se declara como
    tal en el gate. Lo que no es valido es llegar aca por no haber decidido: una placa
    sin recurso elegido termina con lo que el layout deje por defecto, y un carrusel
    donde eso pasa en la mayoria de las placas se renderiza como una tira de marcos
    casi iguales y medio vacios.

## Las tres condiciones que anulan un recurso

Valen sobre cualquier rama del arbol.

- **Sin dato, no hay forma que lo afirme.** Barra, altura, area, proporcion, escala:
  todo eso afirma una magnitud. Si la fuente no la publica, el recurso baja al escalon
  cualitativo. Nueve celdas iguales se leen como un grafico y no afirman nada.
- **Si tuviste que inventar el contenido de un campo, el recurso no va en esa placa.**
  Mira lo que estas por escribir en cada campo y preguntate si sale del material o si
  lo estas fabricando para llenar el hueco. `SI` y `NO` dentro de dos cajas que estaban
  hechas para comparar dos precios es el caso testigo.
- **Una cifra tiene un solo grafico en todo el carrusel.** Si el numero ya se dibujo en
  otra placa, esta dibuja otra cosa. Sintoma: probas tres formas y las tres terminan
  pareciendose al grafico de otra placa — no es la forma, es que estas dibujando un
  dato que no te toca.

## Variedad: que no se repita por inercia

Se chequea sobre el carrusel entero, no placa por placa, y lo mide
`scripts/audit-serie.mjs`.

- **Ningun recurso ocupa mas del 40% de las placas de contenido.** En un carrusel de 9,
  eso son 3. Pasarse no esta prohibido: hay que declararlo con el motivo, y el motivo
  tiene que salir del contenido (un tutorial es una secuencia de punta a punta, y ahi
  la repeticion **es** la estructura).
- **Dos placas seguidas no llevan el mismo recurso**, salvo en esos casos declarados.
- **Un icono se repite solo si codifica el mismo concepto.** Una forma por concepto, no
  por placa: si el modelo es el hexagono en la 2, sigue siendo el hexagono en la 7. Lo
  que no va es el mismo icono en dos placas que hablan de cosas distintas.
- **El acento rota** segun la regla del estilo activo, no por gusto.
- **La repeticion deliberada es una decision, no un default.** Se anota en
  `carousel-brief.md` con su motivo. Sin esa linea, es inercia.

## Lo que la variedad NO autoriza

Variar el recurso no es variar el estilo. Todo lo que se dibuje sale de:

- **Color**: unicamente variables de `tokens.css`. Un hex escrito a mano en un paquete
  es un error, aunque el color quede bien.
- **Tipografia**: las familias, pesos y cuerpos que el estilo ya define, con sus roles.
  Dos piezas que cumplen el mismo rol llevan el mismo cuerpo.
- **Grilla**: los arranques y margenes de `grid.css`, iguales en las nueve placas.
- **Trazo**: los grosores que declara el estilo. Un tercer grosor donde el estilo
  declara dos es lo que hace que la serie se vea amateur.

**No inventes convenciones.** Un color que significa "antes", una forma que significa
"peor", un nombre para algo que la fuente deja sin nombre: es invencion aunque sea
consistente en las nueve placas y aunque quede bien. Se lee como marca mientras dura y
no sobrevive al carrusel siguiente. Si una placa necesita una convencion que el estilo
no tiene, se dice y decide el usuario.
