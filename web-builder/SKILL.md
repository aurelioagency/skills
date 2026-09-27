---
name: web-builder
description: Construye sitios web completos en código con Next.js + Tailwind + Framer Motion, con diseño de identidad propia (no genérico de IA) y sin agujeros legales/SEO/performance/UX — cubre siempre un checklist fijo de 20 puntos (política de privacidad, términos, sin secrets expuestos, HTTPS forzado, banner de cookies, meta tags, sitemap.xml, robots.txt, alt text, imágenes optimizadas, velocidad de carga, contraste, responsive, 404 propia, sin enlaces rotos, formularios validados, anti-spam, analytics, CTA único), más SEO avanzado (JSON-LD) y accesibilidad (ARIA, teclado, jerarquía de encabezados). Si además el pedido incluye vender algo, cobrar, login de usuarios o entregar un archivo/curso tras el pago, esta misma skill suma el módulo de comercio (login con Auth.js, pagos con Stripe, descarga vía URL firmada para archivos pesados). Usar siempre que el usuario pida crear, armar, diseñar o generar una página/sitio web, landing page, portfolio, o una web con ventas/cursos/membresías — incluso si no menciona ninguno de estos puntos por su nombre, la skill se encarga de que no falten. No hace deploy, no compra dominios ni configura Search Console, ni crea cuentas de Stripe/storage: entrega el proyecto listo para eso.
---

# Web Builder

Construye el código completo de un sitio web nuevo. El objetivo es que cada web que sale de acá tenga identidad propia (no la típica plantilla de IA con gradiente violeta-a-azul e Inter para todo) y que nunca le falte ninguno de los 20 puntos de la checklist, sin que el usuario tenga que acordarse de pedirlos.

Es una sola skill con dos módulos que se activan según lo que el usuario pida construir:

- **Módulo base (siempre)** — el sitio en sí: diseño, checklist de 20 puntos, SEO, accesibilidad. Pasos 1 a 8 de este archivo.
- **Módulo de comercio (solo si aplica)** — login, pagos con Stripe, y entrega de archivos pesados tras la compra. Se activa solo cuando el pedido incluye vender algo, cobrar acceso, o "que compre y después pueda descargar X" — ver el Paso 9. Si el pedido es una landing o un portfolio sin venta, este módulo ni se menciona.

No hace deploy, no compra dominio, no toca DNS, no configura Google Search Console, ni crea cuentas de Stripe o de storage — todo eso queda para que el usuario lo haga a mano.

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

## Paso 8 — Chequeo de seguridad con el plugin claude-security

Antes de entregar, corré una pasada de seguridad extra con el plugin oficial de Anthropic `claude-security` (marketplace `anthropics/claude-plugins-official`), sobre el código del sitio recién generado.

1. **Verificar si ya está instalado** — correr `claude plugin list` (o probar si el comando `/claude-security` existe).
2. **Si no está instalado**, avisale al usuario que se va a instalar un plugin oficial de Anthropic (no es código propio de esta skill) y esperá su OK antes de correr:
   ```bash
   claude plugin marketplace add anthropics/claude-plugins-official
   claude plugin install claude-security@claude-plugins-official
   ```
3. **Una vez instalado** (o si ya lo estaba), corré `/claude-security` apuntando al código del sitio generado. Resolvé lo que el escaneo encuentre; si algo no se puede resolver solo, dejalo anotado para reportarlo en el Paso 9.

Si el usuario pidió explícitamente no instalar nada nuevo, saltear este paso entero y avisar en el reporte final que el chequeo de seguridad extra no se corrió por ese motivo.

## Paso 9 — Reporte final (módulo base)

Mostrale al usuario los 20 puntos con un check de qué quedó resuelto en código, el resultado del chequeo de `claude-security` (o por qué no se corrió), y una lista corta de lo que le queda hacer a mano: deploy, comprar/conectar dominio, dar de alta el sitio en Google Search Console y enviar el sitemap. Si el pedido incluye venta/cursos/membresías, seguí con el Paso 10.

## Paso 10 — Módulo de comercio (solo si el pedido lo necesita)

Se activa cuando el usuario pide vender un curso o producto digital, cobrar por acceso a contenido, o que alguien pague y recién después pueda descargar un archivo. Si el pedido no menciona nada de esto, no lo ofrezcas ni lo actives — es una capa aparte con costos e infraestructura real, no algo para sumar por defecto.

A diferencia del módulo base, esto no se resuelve solo generando código: requiere que el usuario tenga (o cree) una cuenta de Stripe y una cuenta de storage de objetos (Cloudflare R2 o Backblaze B2) con sus propias credenciales. Nunca creás esas cuentas ni pedís las claves por chat — solo integrás el código que las usa desde variables de entorno.

**Antes de escribir nada de este módulo**, confirmá con el usuario:

1. **Ya tiene o va a crear una cuenta de Stripe** (https://dashboard.stripe.com/register si no la tiene).
2. **Ya tiene o va a crear una cuenta de storage.** Recomendar Cloudflare R2 (sin costo de egress) o Backblaze B2 como alternativa — avisar que ambos cobran por GB almacenado más allá de una capa gratis chica.
3. **Las credenciales van en `.env.local`**, nunca hardcodeadas ni pegadas en el chat: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, y las del storage elegido (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` o el equivalente de B2).

No avances con el código de este módulo hasta que el usuario confirme estos tres puntos.

Después:

1. **Login** — `npm i next-auth`, config en `references/auth-setup.md`.
2. **Pagos con Stripe** — `npm i stripe @stripe/stripe-js`. Route de checkout (`assets/checkout-route.ts`) que crea la sesión de pago, y webhook (`assets/webhook-route.ts`) que la confirma. El webhook es la única fuente de verdad sobre si se pagó — nunca dar acceso basándose en el redirect del navegador tras el pago.
3. **Entrega del archivo pesado** — el archivo vive subido de antemano en el bucket (R2/B2), nunca en el repo. Cuando el webhook confirma el pago, se genera una URL firmada de corta duración (`assets/signed-download-route.ts`) apuntando al archivo, que se le manda al comprador o se muestra en una página protegida por login. Ver `references/entrega-de-archivos.md` para el flujo completo y por qué un archivo de varios GB no puede servirse directo desde una route de Next.js.

## Reglas duras

**Módulo base:**
- Nunca hagas deploy, ni compres dominio, ni toques configuración de DNS o hosting — no es parte de esta skill.
- La política de privacidad y los términos y condiciones que generás son **plantillas genéricas de partida**, no asesoría legal real. Decíselo siempre al usuario y sugerí que las revise un abogado antes de publicar, sobre todo si recolecta datos sensibles o vende algo.
- No instales ninguna skill de terceros (Taste, Impeccable, Emil Kowalski, UI/UX Pro Max) sin avisar antes qué vas a correr — son paquetes de otra gente, no código propio.
- Mismo criterio con el plugin `claude-security`: avisar antes de instalarlo (es un plugin, no código propio de esta skill), y no instalarlo si el usuario pidió explícitamente no sumar nada nuevo.

**Módulo de comercio:**
- No lo actives si el usuario no pidió vender/cobrar/login — no es parte por defecto de construir una web.
- Nunca avances con este módulo sin que el usuario haya confirmado el Paso 0 (cuentas de Stripe/storage).
- Nunca pidas ni escribas claves secretas en el chat — solo nombrás la variable de entorno y el usuario la completa en `.env.local`.
- Nunca des acceso a la descarga basándote en el redirect del navegador tras el pago — siempre y solo tras verificar la firma del webhook de Stripe.
- Nunca sirvas el archivo pesado directo desde una route de Next.js — siempre por URL firmada al storage externo.
- Avisá siempre que Stripe cobra comisión por transacción y que el storage cobra por GB — no son costos fijos que la skill pueda evitar.

## Referencias

**Módulo base:**
- `references/checklist-20-puntos.md` — implementación concreta de cada uno de los 20 puntos en Next.js.
- `references/recursos-terceros.md` — qué es cada skill/MCP externo, cómo instalarlo, y qué pasa si falta.
- `references/seo-accesibilidad.md` — JSON-LD, metadata completa, ARIA, navegación por teclado, jerarquía de encabezados.
- `scripts/check-broken-links.mjs` — recorre el sitio corriendo en local y reporta enlaces rotos.
- `scripts/optimize-images.mjs` — comprime imágenes de `public/` con sharp antes de entregar.
- `assets/` — plantillas base: política de privacidad, términos, banner de cookies, página 404, middleware de HTTPS, formulario con validación y anti-spam.
- Plugin `claude-security` (marketplace `anthropics/claude-plugins-official`) — chequeo de seguridad extra sobre el código generado, ver Paso 8. No se instala solo, se avisa antes.

**Módulo de comercio:**
- `references/auth-setup.md` — configuración de Auth.js para App Router.
- `references/entrega-de-archivos.md` — flujo completo de compra → webhook → URL firmada → descarga.
- `assets/checkout-route.ts`, `assets/webhook-route.ts`, `assets/signed-download-route.ts` — código de ejemplo para copiar y adaptar.
