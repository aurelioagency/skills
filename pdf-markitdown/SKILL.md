---
name: pdf-markitdown
description: Convertir cualquier PDF a Markdown con markitdown (Microsoft) ANTES de leerlo, para no gastar tokens leyendo las páginas como imágenes. Usar siempre que el usuario adjunte, suba o arrastre un archivo PDF al chat, o pase la ruta de un .pdf — aunque solo diga "leé esto", "resumime esto", "qué dice acá" o no diga nada. También al pedir extraer texto, tablas o contenido de un PDF, convertir PDF a Markdown o a texto, o procesar varios PDFs en lote. Devuelve siempre el informe de tokens ahorrados.
---

# PDF → Markdown con markitdown

Un PDF que entra al chat **no se lee directo**. Se convierte primero con markitdown y se lee el `.md` resultante.

## Por qué existe esta skill

Leer un PDF directo mete cada página como imagen: ~2.300 tokens por página, mire lo que mire. markitdown extrae solo el texto: un catálogo de 12 páginas pasa de 32.000 tokens a 4.400. Mismo contenido útil, 86% menos contexto.

El problema es que sin esta skill el camino barato no se toma nunca, porque leer el PDF directo funciona y no avisa lo que costó. La skill fuerza el paso y muestra el número.

---

## El hook llega primero

Hay un hook `PreToolUse` sobre `Read` en `~/.claude/settings.json` que apunta a `scripts/hook_pdf_read.py`. Ante cualquier intento de leer un PDF —incluido el automático cuando el usuario lo adjunta con `@`— convierte el archivo y **cancela** la lectura directa.

Cuando eso pasa, vas a recibir un error que empieza con `[pdf-markitdown]` y trae la ruta del `.md` y el informe ya calculado. No es una falla: es la skill funcionando. Leé ese `.md` y **pegá el informe en tu respuesta**. No hace falta que corras `pdf2md.py` de nuevo.

Si el hook devolvió el aviso de "sin capa de texto", la lectura directa siguió adelante: avisale al usuario que en ese archivo no hubo ahorro.

El resto del flujo aplica cuando el hook no intervino — por ejemplo si el usuario pide convertir un PDF a `.md` sin leerlo, o si procesás varios en lote.

---

## Flujo

1. **Preflight.** Cierra cuando markitdown responde.
2. **Convertir.** Cierra con el `.md` escrito y el exit code leído.
3. **Informe.** Cierra cuando el usuario vio las tres cifras de tokens.
4. **Leer el `.md`.** Cierra cuando el pedido original está respondido.

---

## 1. Preflight

```bash
python -c "import markitdown; print(markitdown.__version__)"
```

Si falla, instalá — el proyecto es https://github.com/microsoft/markitdown.git:

```bash
python -m pip install "markitdown[all]"
```

`[all]` trae los extras: PDF, Office, imágenes, audio, HTML. Sin eso, PDF no funciona.

## 2. Convertir

```bash
python scripts/pdf2md.py "<ruta del pdf>"
```

El `.md` va a `%TEMP%\markitdown\<nombre>.md` salvo que pases `-o <ruta>`. Si el usuario pidió el archivo para él, usá `-o` y dejalo donde lo quiera.

**Los exit codes mandan:**

| Exit | Qué pasó | Qué hacer |
|---|---|---|
| `0` | Texto extraído, sea por markitdown o por OCR | Seguir al paso 3 |
| `3` | Ni markitdown ni el OCR sacaron texto usable | Decírselo al usuario y leer el PDF directo. No es un error tuyo ni de la skill |
| `1` | Error real | Mostrar el mensaje, no improvisar |

El informe trae una línea `Via:` que dice de dónde salió el texto — `markitdown` o `OCR (Tesseract)` con su confianza. Si vino del OCR, decilo: el texto puede tener errores de reconocimiento y el usuario tiene que saberlo antes de confiar en un número o un nombre propio.

Nunca leas el PDF directo con exit `0`. Ya tenés el texto.

## 3. Informe

El script lo imprime. **Pegalo en la respuesta, siempre**, aunque el usuario no lo haya pedido: es la única forma de que sepa que la skill corrió y cuánto le ahorró.

```
==========================================================
  INFORME DE TOKENS - markitdown
==========================================================
  Archivo : 213.pdf
  Tamano  : 12 paginas, 7.9 MB
----------------------------------------------------------
  Sin la herramienta (paginas como imagen) :    32.177 tokens
  Con markitdown (texto plano)             :     4.362 tokens
----------------------------------------------------------
  AHORRO                                   :    27.815 tokens  (86.4%)
==========================================================
```

Las cifras son una estimación, no una factura. No las presentes como exactas. Salen de:

- **Sin la herramienta** = imágenes de cada página + el texto. Imagen ≈ `(ancho × alto) / 750`, con el lado largo capeado a 1568 px, que es como tokeniza Anthropic. Las medidas reales de cada página salen del PDF.
- **Con markitdown** = `caracteres / 3.8`, el promedio para mezcla español/inglés.

## 4. Leer el `.md`

Recién ahora leés el archivo y respondés lo que el usuario pidió. Si el `.md` es enorme, buscá adentro con grep en vez de leerlo entero — para eso lo convertimos.

---

## Varios PDFs

Un `.md` por PDF, y un total al final. No leas ninguno hasta terminar de convertir todos.

```bash
for f in *.pdf; do python scripts/pdf2md.py "$f"; done
```

En PowerShell:

```powershell
Get-ChildItem *.pdf | ForEach-Object { python scripts/pdf2md.py $_.FullName }
```

---

## La compuerta

```
PDF entra
 │
 ├─ markitdown saca texto ────────────► usar el .md              (ahorro)
 │
 └─ 0 caracteres: es escaneado
      │
      ├─ OCR saca texto ──────────────► usar el .md del OCR      (ahorro)
      │
      └─ OCR tampoco saca nada ───────► lectura directa          (sin ahorro)
```

**No hay umbral de calidad.** Si el OCR saca texto, se usa. El usuario pidió leer el PDF que pasa, no que la skill decida si vale la pena.

La confianza se mide igual y viaja en el informe. Debajo de 70 el detalle dice `LECTURA DUDOSA, avisar al usuario`: cuando veas eso, **decíselo en la respuesta** — algo como "el texto salió de un OCR con confianza 55, puede tener palabras mal leídas". Es un aviso, no una excusa para no responder.

---

## Límites

- **El OCR de manuscrita tiene errores.** Se usa igual, con el aviso. No lo descartes por tu cuenta.
- **El OCR es lento.** ~1,5 s por página. Tope de 50 páginas por archivo.
- **No extrae imágenes.** Si lo que importa del PDF es una foto, un plano o un gráfico, el texto no alcanza y hay que leerlo directo.
- **Las tablas quedan aplanadas.** pdfminer devuelve el texto en orden de lectura, no reconstruye la grilla. Para una tabla crítica, verificá contra el PDF.
- **No detecta títulos.** La salida es texto plano en un `.md`, sin jerarquía de headings.
- **Solo donde hay shell.** En un chat de claude.ai sin terminal no hay markitdown posible.
