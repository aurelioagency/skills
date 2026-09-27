# SEO avanzado y accesibilidad

Esto va además del checklist de 20 puntos — son los puntos que separan "el sitio se indexa" de "el sitio se ve bien en el resultado de búsqueda y lo puede usar cualquiera".

## Datos estructurados (schema.org / JSON-LD)

Sin esto, Google indexa la página pero no puede mostrar rich snippets (estrellas, precio, FAQ desplegable, breadcrumbs) en el resultado de búsqueda. Sumar un `<script type="application/ld+json">` en cada página relevante con el tipo de schema que corresponda:

- Home / página de negocio → `Organization` o `LocalBusiness` (si tiene ubicación física).
- Página de un producto/servicio puntual → `Product` o `Service`.
- Blog/artículo → `Article`.
- Página con preguntas frecuentes → `FAQPage`.

En Next.js App Router, esto se inyecta como un componente que renderiza el `<script>` con `dangerouslySetInnerHTML` (JSON.stringify del objeto schema) dentro del `page.tsx` correspondiente. No hace falta ninguna librería externa para esto, es JSON plano.

## Metadata completa

El export `metadata` de cada página no es solo `title`/`description` (eso ya está en el checklist, punto 6). Sumar:

- `alternates: { canonical: '<url completa de esta página>' }` — evita problemas de contenido duplicado si la misma página es alcanzable por más de una URL.
- `twitter: { card: 'summary_large_image', title, description, images }` — para que se vea bien al compartir en X/Twitter, separado de Open Graph.
- `metadataBase` en `app/layout.tsx` con la URL de producción del sitio, para que las URLs relativas de OG/Twitter se resuelvan bien.

## Accesibilidad

- **ARIA labels** — solo donde el elemento no es autoexplicativo por su rol HTML nativo. Un `<button>` con texto visible no necesita `aria-label`; un botón que es solo un ícono (cerrar, hamburguesa, buscar) sí. No sobrecargar de ARIA lo que ya es semántico.
- **Navegación por teclado** — todo elemento interactivo (botones, links, inputs, elementos del banner de cookies) tiene que ser alcanzable con Tab y activable con Enter/Space sin usar el mouse. Evitar `<div onClick>` para acciones — usar `<button>` o `<a>` reales, que ya traen esto gratis.
- **Jerarquía semántica de encabezados** — un solo `<h1>` por página (el título principal), y el resto en orden descendente sin saltar niveles (no pasar de `h2` a `h4` sin `h3` en el medio). Esto ayuda tanto a lectores de pantalla como al SEO.
