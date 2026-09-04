# Fidelidad

**Control 2 de 4.** Todo dato, ejemplo, comparacion o grafico sale de la fuente. Si no
hay numeros, no hay grafico de barras. Si no alcanza el material, no se rellena y no se
inventa: se dice y decide el usuario.

Se verifica con dos campos obligatorios en `slide-data.js`, uno por placa:

| Campo | Que lleva | Sin el |
|---|---|---|
| `srcFrase` | La oracion textual **de la fuente** de la que se extrajo la linea. | La linea es tuya: o es un titular, o es una reformulacion declarada, o se reescribe extrayendo. |
| `srcDato` | La cita textual de la fuente para cada cifra que se muestra o se dibuja. | No se dibuja barra, altura, area, proporcion ni escala. |

No son documentacion: son la condicion para que la placa exista. Una celda vacia es el
unico chequeo que agarra la invencion sin que nadie tenga que juzgar si la linea esta
buena, y por eso vive en los datos y no en una tabla de `carousel-brief.md` que nadie
relee. El brief los repite para que el usuario los vea en el gate.

Como se vuelcan los datos en un grafico esta en `data-encoding.md`.

## Source Intake

### La fuente que te pasan es la única fuente

**El carrusel sale de ahí y de ningún otro lado.** No se busca en internet, no se traen papers,
no se agregan estudios, cifras ni ejemplos que el agente encontró por su cuenta. Si el material
no da para una placa, esa placa no existe. Si falta algo, se dice y decide el usuario — nunca se
mete primero y se avisa después.

**Investigar para contestarle al usuario no es investigar para el carrusel.** Es el mismo
error, y se ve así: el usuario pregunta si un artículo de 2024 sigue
vigente, se buscaron papers posteriores para contestarle esa pregunta, y después esos papers
entraron al carrusel como si fueran parte de la fuente. Dos placas de nueve no tenían nada que
ver con lo que el usuario había pasado. Los datos eran correctos y verificados; eso no los hace
parte de la fuente.

Cuando la investigación previa y el carrusel conviven en una misma conversación, **la
investigación queda en el chat**. Para pasar al carrusel tiene que haber un pedido explícito
del usuario, y en `carousel-brief.md` va anotada como fuente externa con esa autorización.

Si el usuario pide *"el carrusel de este artículo, con lo que hoy sigue siendo cierto"*, eso es
un **filtro sobre el artículo**: se sacan las partes que envejecieron, no se agregan las que
faltan.

### Qué se acepta

Accept PDFs, URLs, pasted text, screenshots, image references, and YouTube video links.

Screenshots of third-party social posts or carousels are valid sources of information: use their topic and facts, but always write new original copy. Never reuse their exact wording. Verbatim reuse is reserved for the user's own carousels in Adaptation Mode.

**Si la captura cita un estudio, se le pregunta al usuario si quiere que lo busque.** No se sale
a buscarlo solo.

For URLs:

1. Try browser capture or extraction first.
2. If extraction fails or the URL is blocked, ask for pasted text, screenshots, PDF export, or browser-captured images.
3. Never invent missing source content.

For YouTube video links:

1. Open the video page in the browser and extract the transcript (open the description, expand "Show transcript" / "Mostrar transcripción", and read it), plus title and description.
2. Treat the transcript as the source text. Capture key claims, numbers, and examples with enough context to quote them accurately.
3. If the video has no transcript and no captions, ask the user for an alternative: key screenshots with on-screen text, their own notes, or a summary. Never reconstruct video content from memory or general knowledge of the topic or channel.

**An image the user passes in — pasted into the chat or given as a path — is a slide asset, not just reference material.** Take it at face value: save it into the package's `assets/` and put it on a slide. A chart, a screenshot, a diagram, a photo, a logo, whatever it is. If it arrived in the chat and is not on disk, look for it (the downloads folder is the usual place) or ask for the path — never substitute something else for it. How it gets framed is in *Images the user supplies* under Visual Rules.

For source material, extract one to three shareable angles. Do not summarize the whole document unless the user asks. The carousel should feel useful, not like a dictionary entry.

## Copy Accuracy

- Proper nouns are copied verbatim from the source: product names, company names, feature names, people. Never assemble a name by combining a company with a topic (`Anthropic` + `Cowork` is not the product's name; the source says `Claude Cowork`). When a kicker names a product, use the product's real name.
- Every slide must stand alone. When a slide compresses a quote or a long passage, read the result cold: if it no longer states a complete, understandable idea, rewrite it. Compression that loses the logical connector is a defect, not a style choice.
- Numbers, percentages, dates, and limits are transcribed exactly. If a figure needs rounding for the layout, say so on the slide.
- **Never turn a descriptor into a name.** The source's *"the ultra capability setting in ChatGPT"* is not a product called "modo ultra". Translating a description into a proper noun invents a product.
- **A third-party name earns its place only if the slide can say who it is without spending a line.** "The audience" is **this brand's** audience, the one written in its preset — never a general public. Measuring against a general public strips names the actual reader places instantly, and those names buy credibility for free — cutting a name this brand's reader places instantly costs as much as cutting `OpenAI` would. A company that reader cannot place — sitting in the kicker or the verdict, the most visible line — costs attention and returns nothing. Keep the fact, drop the name, and record it in `carousel-brief.md` with its quote. Apply it to every such name in the carousel or to none: one named startup among three anonymous ones reads as an oversight.
- **A description the reader cannot resolve is worse than a proper noun.** "El modelo grande" names nothing; `GPT-5.5` does. When a model, tool or product needs its size or role understood, attach it to the name in the same sentence, or in the graphic's label.
- **Every fact on a slide comes from the same passage.** An example borrowed from another section, dropped onto a slide about a specific company, reads as that company's example. That is misattribution even when both facts are true.
- **Name the action the source describes.** *"After enabling retained reasoning"* is enabling, not implementing: a checklist item that says "guardá lo que el modelo pensó" invents manual work that does not exist.
- **Body copy is sentences, not notes.** Two fragments without a subject ("Encontrar datos difíciles en la web. La misma prueba, tres meses después.") read as an outline. If a line has no verb and no subject, it is not finished.
