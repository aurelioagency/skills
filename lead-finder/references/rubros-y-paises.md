# Rubros y países disponibles

Lo que aparece en el menú de la skill sale de `scripts/pipeline/rubros.json` y `scripts/pipeline/paises.json`. Cada rubro tiene su archivo en `scripts/pipeline/rubros/<id>.json` y cada país tiene su prefijo de teléfono, sus zonas (ciudades o provincias donde buscar) y sus directorios en `paises.json`. Se puede buscar cualquier combinación de rubros y países.

## Rubros

**Ya probados o configurados**

| Rubro | Estado | Qué busca | Servicio de Aurelio Agency que encaja |
|---|---|---|---|
| Autopartes (`autopartes`) | probado en México y Colombia (octubre 2026) | Vendedores de autopartes y repuestos, sobre todo los que venden en Mercado Libre. | Automatización de catálogo y precios, atención por WhatsApp con IA, contenido para redes. |
| Belleza (`belleza`) | probado en México (campaña de cosméticos, octubre 2026) | Marcas y tiendas de cosmética, skincare, cabello, uñas y perfumería (vendedores de Mercado Libre y tiendas propias). | Automatización de catálogo, precios y atención por WhatsApp con IA; contenido (reels y carruseles) y tienda web. |
| Inmobiliarias (`inmobiliarias`) | configurado, sin probar | Inmobiliarias, corredores y desarrolladoras que venden o alquilan propiedades. | Atención y calificación de consultas por WhatsApp con IA, respuesta automática a portales, contenido de propiedades (reels y carruseles) y sitio web. |
| Clínicas y consultorios (`clinicas-consultorios`) | configurado, sin probar | Clínicas, consultorios y centros de salud privados (médicos, odontología, psicología, kinesiología, nutrición, estética médica). | Turnos y recordatorios por WhatsApp con IA, atención de consultas frecuentes, captación de pacientes con contenido y sitio web. |

**Propuestos** (a quién más se le pueden vender los servicios de Aurelio Agency; configuración lista, sin probar)

| Rubro | Qué busca | Por qué encaja |
|---|---|---|
| Tiendas online y marcas e-commerce (`ecommerce`) | Marcas y tiendas que venden por internet (Tiendanube, Shopify, Instagram). | Automatización de catálogo, precios y stock, atención por WhatsApp con IA, contenido para redes y mejora del sitio. |
| Estudios contables y jurídicos (`estudios-contables-juridicos`) | Estudios de abogados, contadores, escribanías, gestorías y asesorías. | Automatización de documentos y trámites repetitivos, atención de consultas por WhatsApp con IA y captación de clientes. |
| Gimnasios y centros de entrenamiento (`gimnasios`) | Gimnasios, crossfit, pilates, yoga y entrenamiento personalizado. | Altas, cuotas y turnos por WhatsApp con IA, reactivación de socios y contenido para redes. |
| Restaurantes y gastronomía (`gastronomia`) | Restaurantes, cafeterías, pizzerías, panaderías, bares y dark kitchens con delivery. | Pedidos y reservas por WhatsApp con IA, menú digital, contenido (reels) y respuesta automática a reseñas. |
| Concesionarias y venta de autos (`concesionarias`) | Concesionarias, agencias de autos usados y 0 km, venta de camionetas y motos. | Calificación de consultas y financiación por WhatsApp con IA, publicación automática de stock y contenido de unidades. |
| Arquitectura, constructoras e ingeniería (`arquitectura-construccion`) | Estudios de arquitectura, constructoras, desarrolladoras y estudios de ingeniería. | Automatización de presupuestos y seguimiento de obra, captación de clientes con contenido y sitio web (ya hubo prospección de arquitectura). |
| Veterinarias y pet shops (`veterinarias`) | Veterinarias, clínicas veterinarias, pet shops y peluquerías caninas. | Turnos y recordatorios de vacunas por WhatsApp con IA, catálogo del pet shop y contenido. |
| Distribuidores mayoristas y ferreterías (`mayoristas-ferreterias`) | Distribuidoras mayoristas, ferreterías industriales y corralones. | Automatización de catálogo, listas de precios y cotizaciones por WhatsApp con IA (como en autopartes). |

Lo que tienen en común los propuestos: son negocios chicos y medianos que reciben consultas por WhatsApp e Instagram, tienen catálogo, turnos o presupuestos repetitivos, y casi ninguno tiene hoy eso automatizado. Los mejores para empezar son los que ya se parecen a autopartes (mayoristas y ferreterías, e-commerce) y los que tienen mucho volumen de consultas (clínicas, inmobiliarias, gimnasios).

## Países

| Código | País | Prefijo | Mercado Libre | Estado |
|---|---|---|---|---|
| MX | Mexico | +52 | mercadolibre.com.mx | probado |
| AR | Argentina | +54 | mercadolibre.com.ar | probado en campañas anteriores, no con el pipeline nuevo |
| CO | Colombia | +57 | mercadolibre.com.co | probado |
| CL | Chile | +56 | mercadolibre.cl | configurado, sin probar |
| PE | Peru | +51 | mercadolibre.com.pe | configurado, sin probar |
| UY | Uruguay | +598 | mercadolibre.com.uy | configurado, sin probar |
| EC | Ecuador | +593 | mercadolibre.com.ec | configurado, sin probar |
| PY | Paraguay | +595 | no tiene | configurado, sin probar |
| BO | Bolivia | +591 | no tiene | configurado, sin probar |
| PA | Panama | +507 | mercadolibre.com.pa | configurado, sin probar |
| CR | Costa Rica | +506 | mercadolibre.co.cr | configurado, sin probar |

México y Colombia se probaron con autopartes; Argentina se usó en campañas anteriores. Los demás países tienen el prefijo, el largo del número y las zonas cargados, pero nadie los corrió todavía: la primera búsqueda en uno nuevo conviene hacerla con `--prueba` para ver que los teléfonos y las webs salgan bien.

## Cómo sumar un rubro o un país

- **Rubro nuevo:** copiar el archivo de un rubro parecido en `scripts/pipeline/rubros/`, cambiar el `id`, el `nombre`, la `palabra` (la palabra que se usa para buscar, por ejemplo "inmobiliaria"), los `subrubros` (los tipos de negocio que se buscan por separado), `instagram.bio_regex` (palabras que tiene que tener la bio de un negocio del rubro), `instagram.excluir_regex` (palabras de rubros que no hay que traer) y `descartar_nombre_regex`. Después agregarlo a `rubros.json` con la misma estructura. `tiendas_ml.activar` va en `true` solo si el rubro vende en Mercado Libre.
- **País nuevo:** agregarlo a `paises.json` con su `prefijo`, el `largo` del número nacional, `inicio_valido` (con qué dígito empiezan los celulares, si todos empiezan igual), el dominio de Mercado Libre si tiene, los `directorios` y una lista de `zonas`. Si el país usa un prefijo móvil en medio del número (como el 9 de Argentina), se carga en `movil_prefijo`. El sufijo de web del país (`.com.ar`, `.cl`) tiene que estar en `TLD_PAIS` de `leads_common.py`, para poder descartar las webs de otro país.
- **Columna Rubro del Excel:** el desplegable de la columna tiene los rubros ya cargados y acepta otros valores. Al cargar leads, `cargar_excel.py` completa la columna con el rubro de la búsqueda.
