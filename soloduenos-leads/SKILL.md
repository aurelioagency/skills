---
name: soloduenos-leads
description: Buscar dueños que publican inmuebles en soloduenos.com con Scrapling y volcarlos a un Excel (fuente de verdad) con contacto, link directo y un detalle breve del inmueble, para después mandarles mensajes personalizados y convencerlos de vender con el usuario. Usar cuando pida leads de dueños, "dueños directos", scrapear soloduenos, actualizar el Excel de dueños, o sumar barrios/operaciones a esa búsqueda. Foco: Capital Federal, sobre todo Villa del Parque y alrededores, ventas y alquileres. No contacta ni envía nada.
---

# soloduenos-leads

Cada aviso de soloduenos.com es un dueño que vende o alquila sin inmobiliaria: un cliente potencial. Esta skill baja los avisos con Scrapling y los guarda en un Excel que es la única fuente de verdad. No envía mensajes: el usuario redacta y contacta.

## Cómo es el sitio (verificado 2026-10-07)
- Es una app React: el HTML inicial viene vacío, hay que renderizar (por eso `DynamicSession` + `wait_selector`).
- Listado: `/buscar?operation_type=venta|alquiler|alquiler_temporario&page=N` (48 avisos por página). Aviso: `/propiedades/<slug>-<uuid>`.
- La ubicación (`Barrio, Ciudad Autónoma de Buenos Aires`) sale de la página del aviso; en el listado los nombres de zona son inconsistentes, por eso el filtro de zona se hace sobre el aviso.
- **El teléfono/WhatsApp del dueño solo se ve con una cuenta gratis iniciada.** Sin sesión, el botón "Contactar por WhatsApp" muestra "Ingresá o creá tu cuenta". El nombre del dueño no figura en el aviso.
- `user_data_dir` de Scrapling rompe el renderizado: la sesión se restaura con cookies + localStorage (ver `login`).

## Columnas del Excel (hoja `Leads`, una fila por aviso)
ID · Fuente (`soloduenos.com`) · Link publicación · Fecha de captura · Nombre del dueño · Teléfono / WhatsApp · Email · Otro contacto · Tipo · Operación · Zona · Precio y moneda · Características · Detalle breve · Días publicado · Estado de contacto · Fecha de contacto · Notas

Las tres últimas son del usuario: el script nunca las pisa. La hoja `Corridas` registra fecha, operaciones, zona, avisos vistos, nuevos y con teléfono.

## Uso
Requiere `scrapling` y `openpyxl` (`pip install scrapling openpyxl`, y `scrapling install` si falta el navegador).

1. **Sesión (una sola vez):** `python scripts/scrape.py login`. Se abre un navegador; el usuario inicia sesión él mismo y cierra la ventana. Claude no crea la cuenta ni escribe contraseñas.
2. **Corrida:** `python scripts/scrape.py run --excel <ruta.xlsx> --max-pages 3 --ops venta alquiler --zona "capital federal"`
   - Primero una prueba chica (`--max-pages 1`) y mostrar el Excel antes de bajar todo.
   - `--sin-contacto` baja solo datos públicos. `--headless` para correr sin ventana.
3. Cada corrida agrega solo lo nuevo (clave: link). Un aviso ya cargado con teléfono se saltea; si le faltaba el teléfono, se completa.
4. Reportar: avisos vistos, en zona, nuevos y con teléfono. Si dice "ningún teléfono", la sesión no está iniciada o venció: repetir `login`.

## Zona
Por defecto toda Capital Federal. El usuario prioriza Villa del Parque y alrededores (Villa Devoto, Villa Santa Rita, Monte Castro, Floresta, Villa Luro, Agronomía, Paternal, Villa Pueyrredón, Villa Ortúzar, Villa General Mitre), pero puede ampliar: se filtra en Excel por la columna Zona. Para otra zona, `--zona "<texto>"` filtra por ese texto en la ubicación del aviso.

## Detalle breve (para el mensaje personalizado)
Tipo + característica principal + barrio + primera frase de la descripción del dueño. Es un insumo: el mensaje final lo redacta el usuario, con voseo y palabras simples.

## Pendiente de validar
La lectura del teléfono con sesión iniciada (el script junta enlaces `wa.me`/`tel:` o la URL de la pestaña que abre el botón) no se pudo probar sin cuenta. En la primera corrida con sesión, verificar con 3–5 avisos que el número sea correcto y ajustar `accion_detalle` si el sitio lo muestra de otra forma.
