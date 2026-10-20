# Enriquecer contactos de vendedores de Mercado Libre

Mercado Libre oculta mail y teléfono del vendedor a propósito: quiere que las consultas
pasen por su sistema de mensajería interno, no por fuera. No hay selector ni truco de
scraping que lo destrabe — es una decisión de producto de ML, no un dato escondido en el
HTML. Antes de prometer un dato, confirmar que salió de una fuente real.

## Qué sí se puede conseguir, y de dónde

1. **Perfil/tienda del vendedor en ML** (`perfil.mercadolibre.com.ar/<usuario>` o la página
   de la tienda oficial si la tiene). Bajarla con `scripts/extract_contacts.py <url> --stealth`
   (ML tiene protección anti-bot, siempre usar `--stealth`). De ahí puede salir:
   - Instagram o sitio web si el vendedor lo puso en la descripción de la tienda.
   - Botón "Consultar por WhatsApp" en alguna publicación del vendedor (no siempre está,
     depende de la categoría) — el script lo detecta como link `wa.me`/`api.whatsapp.com`.
2. **Búsqueda web por nombre de la tienda** (`WebSearch`, o el browser): `"<nombre tienda>"
   instagram`, `"<nombre tienda>" contacto`, `"<nombre tienda>" whatsapp`. Si el vendedor
   tiene una web o Instagram propios, ahí sí suele haber mail y/o teléfono en la bio o en
   una sección "Contacto"/"Nosotros" — sacarlo de ahí, nunca inventado.
3. Si el vendedor no publicó nada de esto en ningún lado público, el dato no existe para
   scrapear. En ese caso la fila queda con esos campos vacíos y una nota
   "no público — contactar por mensajería interna de ML", no se completa con nada.

## Flujo para una fila del Excel de leads

Para cada vendedor sin datos de contacto:

1. Si la fila ya tiene el link al perfil de ML, usarlo. Si no, buscar el perfil por el
   nombre de la tienda dentro de ML.
2. Correr `extract_contacts.py <url_perfil> --stealth` → mail/whatsapp/instagram/sitio si
   estaban linkeados ahí.
3. Si faltó algo (sobre todo mail o teléfono directo), buscar el nombre de la tienda con
   `WebSearch` y revisar si su sitio/Instagram propio lo publica. Si el resultado es un
   Instagram, se puede abrir con el browser y leer la bio (`get_page_text`).
4. Completar en el Excel solo lo confirmado, con la fuente (ML, sitio propio, Instagram)
   al lado si el usuario quiere quedarse con el rastro. Lo no encontrado queda vacío +
   nota, nunca relleno.
