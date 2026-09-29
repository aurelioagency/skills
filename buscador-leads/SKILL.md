---
name: buscador-leads
description: Buscar clientes potenciales (leads) para Aurelio Agency scrapeando sitios públicos con Scrapling, y completar datos de contacto faltantes (mail, WhatsApp, Instagram) de un listado o Excel ya existente, como el de vendedores de Mercado Libre. Usar cuando el usuario pida buscar clientes/leads de un rubro (inmobiliarias, restaurantes, vendedores de Mercado Libre, pymes, etc.), pida armar un listado de prospectos con contacto, o pida completar/enriquecer los datos de contacto faltantes de una lista o Excel de nombres/empresas que ya tiene. No publica ni envía nada — solo busca y entrega el listado para revisión.
---

# Buscador de leads

Dos modos. Preguntar cuál corresponde si no queda claro por el pedido:

- **Modo A — Búsqueda por rubro**: el usuario no tiene lista todavía, pide "buscame
  clientes de tal rubro".
- **Modo B — Enriquecimiento**: el usuario ya tiene una lista/Excel de nombres o
  empresas y le faltan datos de contacto.

Ninguno de los dos modos envía nada ni publica nada — el resultado siempre se entrega
para que el usuario lo revise antes de usarlo en outreach (ver la campaña ya existente
en memoria: mail/IG de autopartes ML).

## Modo A — Búsqueda por rubro

1. **Pedir rubro + ciudad/zona.** Sin zona el universo es demasiado amplio. Si el
   usuario ya lo dio en el mismo mensaje, no volver a preguntar.
2. **Elegir el sitio.** Mirar `references/sitios-por-rubro.md` primero. Si el rubro no
   está ahí, proponer 1-2 sitios candidatos (directorio del rubro, cámara de comercio,
   Google Maps) y decir cuál se va a usar antes de scrapear.
3. **Inspeccionar la página real antes de escribir el scraper.** Los selectores de
   `references/sitios-por-rubro.md` no están hardcodeados en ningún script porque cada
   sitio cambia su HTML — hay que mirarlo en el momento:
   - `python scripts/fetch.py "<url_listado>" --stealth` (usar `--stealth` salvo que el
     sitio sea claramente simple/sin JS) para ver el texto visible y ubicar el patrón de
     cada resultado (nombre, teléfono, dirección, link).
   - Si con el texto no alcanza para ver la estructura, repetir con `--html` y revisar
     las clases/selectores reales antes de armar el `.css(...)`.
4. **Escribir un script chico ad-hoc** (no reusar uno de otro rubro/sitio sin adaptar
   los selectores) que recorra el listado con `Fetcher`/`StealthyFetcher`, extraiga
   nombre + contacto + link de cada resultado, y respete la paginación. Avisar antes de
   lanzarlo cuántas páginas/resultados va a traer — no scrapear de más sin avisar.
5. Para cada resultado, si el listado no trae ya el contacto completo, correr
   `scripts/extract_contacts.py <url_del_resultado>` sobre la página propia de ese
   negocio para sacar mail/whatsapp/instagram/sitio si los tiene públicos.
6. Entregar la lista en el chat (tabla o JSON) y, si el usuario lo pide, exportarla con
   `scripts/export_csv.py`. No mandar nada a ningún Excel de campaña sin que el usuario
   lo pida explícitamente — el destino final (a qué archivo va) lo decide él.

**Regla dura:** nunca scrapear Instagram/LinkedIn/Facebook como fuente del listado
inicial (bloquean scraping masivo rápido) — solo como enriquecimiento puntual de un lead
ya encontrado en el directorio/sitio principal.

## Modo B — Enriquecimiento de contactos

1. **Confirmar la fuente.** Si el usuario no dio la ruta, preguntar qué archivo/lista
   hay que completar. Para el caso ya conocido de vendedores de Mercado Libre, la fuente
   de verdad es `G:\Unidades compartidas\Aurelio\Leads MercadoLibre Autopartes AR-MX.xlsm`
   (hoja "Leads") — editar ese mismo archivo (Python/openpyxl con `keep_vba=True`), nunca
   crear una copia.
2. **Para vendedores de Mercado Libre**, seguir el flujo exacto de
   `references/contacto-mercadolibre.md` — explica por qué mail/teléfono casi nunca es
   público ahí y de dónde sí puede salir (perfil ML, WhatsApp de alguna publicación,
   búsqueda web del nombre de la tienda).
3. **Para cualquier otra lista** (no ML), el patrón es el mismo: por cada nombre/empresa,
   ubicar su página propia (sitio, ML, red social) y correr
   `scripts/extract_contacts.py <url> --stealth` sobre ella; si falta algo, buscar el
   nombre con `WebSearch` para encontrar su sitio/Instagram propio y sacarlo de ahí.
4. **No completar nunca un campo sin fuente real.** Si después de perfil + búsqueda web
   no aparece mail o teléfono público, esa celda queda vacía con una nota tipo "no
   público" — no rellenar con nada inventado ni aproximado.
5. Mostrar al usuario, antes de guardar en el Excel, qué se encontró y de dónde (para que
   pueda revisar), salvo que ya haya pedido que se guarde directo.

## Reglas duras (ambos modos)

- Nunca enviar mensajes, publicar ni contactar a nadie desde esta skill — solo busca y
  entrega datos. El envío es de la campaña de outreach (memoria
  `outreach-aurelio-mail-ig`), que es un paso posterior y separado.
- Nunca inventar un dato de contacto. Si no está publicado en ningún lado encontrado, se
  reporta como no disponible.
- Revisar términos de servicio del sitio antes de scrapear algo nuevo; evitar patrones
  agresivos (recorrer página por página con pausas, no todo en loop cerrado).
- Si un sitio bloquea con `Fetcher` simple, escalar a `StealthyFetcher` (navegador real)
  antes de descartar la fuente.

## Referencias

- `references/sitios-por-rubro.md` — sitios candidatos por rubro, se va ampliando.
- `references/contacto-mercadolibre.md` — flujo detallado de enriquecimiento para ML.
- `scripts/fetch.py` — bajar una página para inspeccionar antes de armar selectores.
- `scripts/extract_contacts.py` — sacar mail/whatsapp/instagram/sitio de una página.
- `scripts/export_csv.py` — exportar una lista de resultados a CSV.
