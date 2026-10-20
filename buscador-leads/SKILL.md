---
name: buscador-leads
description: Buscar clientes potenciales (leads) para Aurelio Agency scrapeando sitios públicos con Scrapling, y completar datos de contacto faltantes (mail, WhatsApp, Instagram) de un listado o Excel ya existente. También busca leads NUEVOS de cualquier rubro y país (tiendas de Mercado Libre, Instagram, webs, Google Maps, Facebook, directorios) sin repetir lo que ya está en el Excel de campaña, controla que cada dato corresponda a su empresa y, si el usuario lo pide, los carga al final del Excel. Usar cuando el usuario pida buscar clientes/leads de un rubro (inmobiliarias, restaurantes, vendedores de Mercado Libre, autopartes, pymes, etc.), "buscá más leads", armar un listado de prospectos con contacto, o completar/enriquecer los datos de contacto faltantes de una lista o Excel que ya tiene. No publica ni envía nada: solo busca y entrega el listado para revisión.
---

# Buscador de leads

Tres modos. Preguntar cuál corresponde si no queda claro por el pedido:

- **Modo A — Búsqueda por rubro en un directorio o sitio**: el usuario no tiene lista todavía, pide "buscame
  clientes de tal rubro".
- **Modo B — Enriquecimiento**: el usuario ya tiene una lista/Excel de nombres o
  empresas y le faltan datos de contacto.
- **Modo C — Leads nuevos para una campaña que ya tiene Excel**: "buscá más leads", "seguí buscando", "llegá a 100".
  Se busca **sin repetir** lo que ya está en el Excel, se verifica el rubro, se saca el contacto de fuentes propias, se
  controla cada dato y se entrega un CSV. **El rubro y los países cambian en cada búsqueda**: lo fijo es el método.

Ningún modo envía nada ni publica nada — el resultado siempre se entrega
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
inicial en forma masiva y rápida (bloquean) — solo como enriquecimiento puntual de un lead
ya encontrado, o a través de lo que un buscador (Brave/Yahoo) ya indexó (Modo C).

## Modo B — Enriquecimiento de contactos

1. **Confirmar la fuente.** Si el usuario no dio la ruta, preguntar qué archivo/lista
   hay que completar. Para el caso ya conocido de vendedores de Mercado Libre, la fuente
   de verdad es `G:\Unidades compartidas\Aurelio\Leads MercadoLibre Autopartes AR-MX.xlsm`
   (hoja "Leads"; el archivo tiene solo dos pestañas, Leads y Seguimientos) — editar ese mismo
   archivo (Python/openpyxl con `keep_vba=True`), nunca crear una copia ni pestañas nuevas.
2. **Para vendedores de Mercado Libre**, seguir el flujo exacto de
   `references/contacto-mercadolibre.md` — explica por qué mail/teléfono casi nunca es
   público ahí y de dónde sí puede salir (perfil ML, WhatsApp de alguna publicación,
   búsqueda web del nombre de la tienda).
3. **Para cualquier otra lista** (no ML), el patrón es el mismo: por cada nombre/empresa,
   ubicar su página propia (sitio, ML, red social) y correr
   `scripts/extract_contacts.py <url> --stealth` sobre ella; si falta algo, buscar el
   nombre con `WebSearch` para encontrar su sitio/Instagram propio y sacarlo de ahí.
   Para completar muchos leads de una vez, usar `scripts/pipeline/completar_datos.py` (Modo C, paso 6).
4. **No completar nunca un campo sin fuente real.** Si después de perfil + búsqueda web
   no aparece mail o teléfono público, esa celda queda vacía con una nota tipo "no
   público" — no rellenar con nada inventado ni aproximado.
5. Mostrar al usuario, antes de guardar en el Excel, qué se encontró y de dónde (para que
   pueda revisar), salvo que ya haya pedido que se guarde directo.

## Modo C — Leads nuevos sin repetir (método de `references/metodo-busqueda-leads.md`)

Leer `references/metodo-busqueda-leads.md` antes de empezar: tiene las reglas completas (son las del documento "Método de
búsqueda y enriquecimiento de leads (autopartes ML)", generalizadas para cualquier rubro). Los scripts están en `scripts/pipeline/` y se manejan con un config JSON.

1. **Confirmar rubro, países, Excel y qué descartar.** Copiar `scripts/pipeline/config-autopartes-mx-co.json` y cambiar rubro,
   sub-rubros, zonas, consultas y filtros. El rubro no tiene por qué ser autopartes ni vender en Mercado Libre.
2. **Chequear Scrapling y su navegador** (los scripts lo hacen solos al empezar). Si falta, pedirle OK al usuario y correr
   `python -m patchright install chromium`.
3. **Buscar**: `python scripts/pipeline/buscar_leads.py --config <config> --excel "<Excel>" --salida <csv> --trabajo <carpeta>`.
   Tarda; lanzarlo en segundo plano y avisar por hitos. `--prueba` hace una corrida chica para probar el config.
4. **Completar lo que falta**: `completar_datos.py --config <config> --csv <csv>` (Google Maps, Facebook, directorios, webs).
5. **Verificar**: `verificar_datos.py --config <config> --excel "<Excel>" --csv <csv> --completados <jsonl>`. Saca los datos que no
   corresponden (compartidos entre empresas, ya en el Excel, de otro país, dominio ajeno) y suma lo nuevo. Revisar a mano lo que
   lista como "posible empresa repetida" y mirar una muestra antes de entregar.
6. **Entregar el CSV** (mandarlo con `SendUserFile` si el usuario está desde el celular) con: cantidad por país, cuántos tienen
   Instagram / mail / WhatsApp, cuántos están completos y cuántos solo tienen Instagram, qué se descartó y por qué.
7. **Cargar al Excel solo si el usuario lo pide**: `cargar_excel.py --excel "<Excel>" --csv <csv> --carga "<fecha y búsqueda>"`.
   Trabaja en una copia temporal, comprueba que nada existente cambió y recién ahí reemplaza el original. Si el Excel está
   abierto, pedirle al usuario que lo cierre (nunca cerrarlo vos).

## Reglas duras (todos los modos)

- Nunca enviar mensajes, publicar ni contactar a nadie desde esta skill — solo busca y
  entrega datos. El envío es de la campaña de outreach (memoria
  `outreach-aurelio-mail-ig`), que es un paso posterior y separado.
- Nunca inventar un dato de contacto. Si no está publicado en ningún lado encontrado, se
  reporta como no disponible.
- **Cada dato de contacto sale de una fuente propia de la empresa** (su web, la bio de su Instagram, su linktree, su página de
  Facebook, su ficha de Google Maps con el mismo nombre). El resultado suelto de un buscador no es fuente. El CSV y el Excel dicen
  de dónde salió cada dato.
- **Verificar que cada dato corresponda a su empresa y al país pedido** antes de entregar (`verificar_datos.py`).
- **No sacar números de la columna de teléfono / WhatsApp por suposición** (el usuario lo rechazó): si no se sabe si un teléfono
  tiene WhatsApp, queda como está.
- **El usuario trabaja con un solo archivo.** No crear pestañas, copias, backups ni archivos sueltos en sus carpetas salvo que lo pida;
  los intermedios van en la carpeta de trabajo de la sesión. Los scripts viven en la skill, no en una carpeta temporal.
- Instagram: solo lectura pública. **No forzar el contacto de negocio de Instagram** (bloquea con error 429 y arriesga la cuenta de
  la empresa); probarlo con el Chrome logueado solo avisando antes al usuario y de a pocos perfiles.
- Revisar términos de servicio del sitio antes de scrapear algo nuevo; evitar patrones
  agresivos (recorrer página por página con pausas, no todo en loop cerrado).
- Si un sitio bloquea con `Fetcher` simple, escalar a `StealthyFetcher` (navegador real)
  antes de descartar la fuente. **Scrapling es obligatorio**: si no arranca, se arregla el entorno; no se reemplaza por otra herramienta.
  Buscadores: Brave y Yahoo (Google da captcha y Bing devuelve resultados sin relación).

## Referencias

- `references/metodo-busqueda-leads.md` — el método completo para buscar leads nuevos (cualquier rubro), reglas de calidad, errores y mejoras pendientes.
- `references/sitios-por-rubro.md` — sitios candidatos por rubro, se va ampliando.
- `references/contacto-mercadolibre.md` — flujo detallado de enriquecimiento para ML.
- `scripts/fetch.py` — bajar una página para inspeccionar antes de armar selectores.
- `scripts/extract_contacts.py` — sacar mail/whatsapp/instagram/sitio de una página.
- `scripts/export_csv.py` — exportar una lista de resultados a CSV.
- `scripts/pipeline/` — el proceso del Modo C: `leads_common.py` (funciones compartidas), `buscar_leads.py`, `completar_datos.py`,
  `verificar_datos.py`, `cargar_excel.py` y `config-autopartes-mx-co.json` (ejemplo de config).
