---
name: web-builder
description: Construye sitios web completos en código con Next.js + Tailwind + Framer Motion, con diseño de identidad propia (no genérico de IA) y sin agujeros legales/SEO/performance/UX — cubre siempre un checklist fijo de 20 puntos (política de privacidad, términos, sin secrets expuestos, HTTPS forzado, banner de cookies, meta tags, sitemap.xml, robots.txt, alt text, imágenes optimizadas, velocidad de carga, contraste, responsive, 404 propia, sin enlaces rotos, formularios validados, anti-spam, analytics, CTA único), más SEO avanzado (JSON-LD) y accesibilidad (ARIA, teclado, jerarquía de encabezados). Usar siempre que el usuario pida crear, armar, diseñar o generar una página/sitio web, landing page o portfolio — incluso si no menciona ninguno de estos puntos por su nombre, la skill se encarga de que no falten. No hace deploy, no compra dominios ni configura Search Console: entrega el proyecto listo para eso. Para login, pagos o descarga de archivos pagos (cursos, productos digitales), usar la skill separada web-commerce sobre el sitio ya construido.
---

# Web Builder

Construye el código completo de un sitio web nuevo. El objetivo es que cada web que sale de acá tenga identidad propia (no la típica plantilla de IA con gradiente violeta-a-azul e Inter para todo) y que nunca le falte ninguno de los 20 puntos de la checklist, sin que el usuario tenga que acordarse de pedirlos.

No hace deploy, no compra dominio, no toca DNS, no configura Google Search Console — todo eso queda para que el usuario lo haga a mano al final. Tampoco resuelve login, pagos ni descargas de archivos: eso es la skill `web-commerce`, aparte, porque necesita cuentas y credenciales reales (Stripe, storage) que la skill no puede crear por sí sola.

## Paso 1 — Entrevista

Antes de escribir código, conseguí:
- Nombre del negocio/proyecto y rubro.
- Qué secciones necesita (home, servicios, contacto, blog, etc.).
- Si tiene una web de referencia cuyo estilo le gusta (para pasarle a Taste) o si hay que proponer un estilo desde cero (UI/UX Pro Max).
- Idioma del contenido y datos de contacto reales para la política de privacidad/términos (razón social si la tiene, email, y si corresponde jurisdicción).

No hace falta que el usuario sepa términos técnicos — traducí "quiero landing con formulario de contacto" a la lista de arriba vos mismo.

## Paso 2 — Scaffolding

Creá el proyecto base:

```bash
npx create-next-app@latest <nombre> --typescript --tailwind --app --eslint
cd <nombre>
npm i framer-motion
```

## Paso 3 — Diseño con identidad propia

Esto es lo que evita que la web se vea genérica. Antes de escribir un solo componente visual, invocá en este orden (avisale al usuario qué vas a instalar antes de correr cada comando — son skills de terceros, no las escribimos nosotros):

1. **Si el usuario dio una web de referencia** → [Taste](https://github.com/Leonxlnx/taste-skill) (`npx skills add Leonxlnx/taste-skill`, después `/taste <url>`) extrae tokens de diseño reales de esa web (colores, tipografía, densidad, variación).
2. **Si no dio referencia** → [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) elige paleta, tipografía y guías según el rubro del negocio.
3. **Animaciones con criterio, no motion porque sí** → skills de [Emil Kowalski](https://github.com/emilkowalski/skills) (`npx skills add emilkowalski/skills`) para decidir qué anima, con qué curva y duración.
4. **Pulido final** → [Impeccable](https://github.com/pbakaus/impeccable) (`npx impeccable install`) corre al final, sobre el diseño ya armado, para corregir tipografía, contraste, estructura y espaciado con sus 23 comandos.

Ver `references/recursos-terceros.md` para el detalle de cada uno y qué hacer si alguna skill no está instalada.

## Paso 4 — Componentes reales

Si el MCP de [21st.dev / Magic](https://21st.dev/mcp) está conectado, usalo para buscar e insertar componentes React/Tailwind ya armados (hero, pricing, testimonios, etc.) en vez de inventar la UI de cero. Si no está conectado, seguí sin él y avisale al usuario que podría sumarlo para variar más el resultado.

## Paso 5 — Checklist de 20 puntos (esto es lo que nunca puede faltar)

Generá el código real de cada punto, no un recordatorio. El detalle de cómo implementar cada uno en Next.js está en `references/checklist-20-puntos.md`. Usá las plantillas de `assets/` como base y completalas con los datos reales del negocio en vez de dejar placeholders genéricos.

## Paso 6 — SEO avanzado y accesibilidad

Sumá datos estructurados (JSON-LD) y accesibilidad más allá del checklist básico — ver `references/seo-accesibilidad.md`.

## Paso 7 — Revisión automática (si hay Playwright MCP)

Si el MCP oficial de Microsoft [Playwright](https://github.com/microsoft/playwright-mcp) está conectado, levantá el sitio en local (`npm run dev`), abrilo con Playwright, y revisá: contraste real en pantalla, que se vea bien en mobile (viewport angosto), y que no haya enlaces rotos (recorré los `<a href>` y verificá que respondan). Corregí lo que encuentres antes de entregar. Si no está conectado, corré igual `scripts/check-broken-links.mjs` contra el servidor local para al menos cubrir los enlaces rotos.

## Paso 8 — Reporte final

Mostrale al usuario los 20 puntos con un check de qué quedó resuelto en código, y una lista corta de lo que le queda hacer a mano: deploy, comprar/conectar dominio, dar de alta el sitio en Google Search Console y enviar el sitemap. Si en algún momento pidió vender algo o necesita login, avisale que eso es la skill `web-commerce` aparte.

## Reglas duras

- Nunca hagas deploy, ni compres dominio, ni toques configuración de DNS o hosting — no es parte de esta skill.
- La política de privacidad y los términos y condiciones que generás son **plantillas genéricas de partida**, no asesoría legal real. Decíselo siempre al usuario y sugerí que las revise un abogado antes de publicar, sobre todo si recolecta datos sensibles o vende algo.
- No instales ninguna skill de terceros (Taste, Impeccable, Emil Kowalski, UI/UX Pro Max) sin avisar antes qué vas a correr — son paquetes de otra gente, no código propio.
- Si el usuario pide login, pagos, o "que se pueda comprar y descargar un curso", no lo resuelvas acá: derivalo a `web-commerce`.

## Referencias

- `references/checklist-20-puntos.md` — implementación concreta de cada uno de los 20 puntos en Next.js.
- `references/recursos-terceros.md` — qué es cada skill/MCP externo, cómo instalarlo, y qué pasa si falta.
- `references/seo-accesibilidad.md` — JSON-LD, metadata completa, ARIA, navegación por teclado, jerarquía de encabezados.
- `scripts/check-broken-links.mjs` — recorre el sitio corriendo en local y reporta enlaces rotos.
- `scripts/optimize-images.mjs` — comprime imágenes de `public/` con sharp antes de entregar.
- `assets/` — plantillas base: política de privacidad, términos, banner de cookies, página 404, middleware de HTTPS, formulario con validación y anti-spam.
