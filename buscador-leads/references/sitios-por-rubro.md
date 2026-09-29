# Sitios de referencia por rubro

Punto de partida para elegir dónde buscar. No es una lista cerrada: si el usuario pide
un rubro que no está acá, hay que proponer sitios candidatos igual (directorios locales,
cámaras del rubro, portales verticales) y agregarlos a este archivo una vez validados.

Antes de scrapear cualquiera de estos, revisar sus términos de servicio / robots.txt.
Preferir siempre el sitio con listados públicos más completo y menos agresivo con
anti-bot; si todos tienen protección fuerte, usar `StealthyFetcher` (navegador real).

## Inmobiliarias / propiedades
- zonaprop.com.ar (AR)
- argenprop.com (AR)
- remax.com.ar (AR, red de franquicias — buscar oficinas por zona)
- inmuebles24.com (MX)

## Restaurantes / gastronomía
- Google Maps (búsqueda "restaurantes en <zona>") — vía browser, no vía Scrapling directo
- guiaoleo.com.ar
- TripAdvisor (rubro restaurantes por ciudad)

## Vendedores de Mercado Libre
- listado.mercadolibre.com.ar/<categoria> o .com.mx — listados de productos, de ahí se
  llega al perfil de cada vendedor (`/perfil/<usuario>` o link "Ver más productos del vendedor")
- El perfil del vendedor en ML no tiene mail/teléfono público — ver `contacto-mercadolibre.md`

## Clínicas / consultorios
- doctoralia.com.ar
- páginas amarillas / guías locales por ciudad

## Comercios en general / pymes
- páginas amarillas locales (paginasamarillas.com.ar, etc.)
- Cámaras de comercio por ciudad/rubro (suelen tener directorio de socios público)
- Google Maps por rubro + zona

## Reglas generales
- Siempre pedirle al usuario **rubro + ciudad/zona** antes de elegir sitio — sin zona
  el listado es demasiado amplio para ser útil.
- Un directorio con paginación: recorrer página por página, nunca todo de una, y avisar
  cuántos resultados se van a traer antes de lanzar el scraping completo.
- Nunca scrapear masivamente redes sociales (Instagram, LinkedIn, Facebook) como fuente
  primaria de listado — sus términos lo prohíben y banean rápido. Se pueden usar para
  enriquecer un lead puntual ya identificado (ver `contacto-mercadolibre.md` como ejemplo
  de ese patrón), no para generar el listado inicial.
