# Checklist de 20 puntos — implementación en Next.js

Cada punto se resuelve con código real generado en el proyecto, no como nota o recordatorio. Marcá cada uno como hecho en el reporte final solo si el archivo/componente correspondiente existe en el proyecto.

## Legal

1. **Política de privacidad** — página `app/politica-de-privacidad/page.tsx`, contenido a partir de `assets/privacy-policy-template.md` completado con los datos reales del negocio (nombre, email de contacto, qué datos recolecta el sitio: formularios, cookies, analytics). Avisar siempre que es plantilla genérica, no asesoría legal.
2. **Términos y condiciones** — página `app/terminos/page.tsx`, mismo criterio, a partir de `assets/terms-template.md`.

## Seguridad

3. **Sin secrets ni API keys en el frontend** — antes de entregar, grepear el código de `app/` y `components/` (nunca `.env*`) buscando patrones típicos de claves (`sk_`, `AIza`, `-----BEGIN`, strings largas asignadas a variables con nombre "key"/"secret"/"token"). Cualquier valor sensible va en variables de entorno del lado del servidor (`process.env.X` sin prefijo `NEXT_PUBLIC_`), nunca hardcodeado ni con `NEXT_PUBLIC_` si es secreto.
4. **Forzar HTTPS** — `assets/middleware-https.ts` copiado a `middleware.ts` en la raíz: redirige cualquier request `http` a `https` en producción (en local no aplica, Next dev server no sirve HTTPS).

## Cookies y consentimiento

5. **Banner de consentimiento de cookies** — componente `assets/cookie-banner.tsx` copiado a `components/CookieBanner.tsx`, montado en `app/layout.tsx`. Guarda la elección en `localStorage` para no volver a preguntar, y solo carga analytics si el usuario aceptó.

## SEO básico

6. **Meta títulos y descripciones** — usar el `metadata` export de Next.js (App Router) en cada `page.tsx`: `export const metadata: Metadata = { title, description }`. Nunca dejar el título/descripción por defecto de `create-next-app`.
7. **Imagen de previsualización (Open Graph)** — sumar `openGraph: { images: [...] }` al mismo `metadata`, con una imagen de 1200x630 por página (o una genérica del sitio si no hay una específica).
8. **Favicon** — `app/icon.png` (o `.ico`), Next.js lo sirve automático sin configuración extra. Generar uno acorde a la identidad visual definida en el Paso 3 del SKILL.md, no dejar el ícono por defecto.
9. **Sitemap.xml y robots.txt** — usar `app/sitemap.ts` y `app/robots.ts` (soporte nativo de Next.js App Router, genera los archivos en build). Listar ahí todas las rutas reales del sitio.

## Imágenes y performance

10. **Alt text en imágenes** — todo `<Image>` de `next/image` con `alt` descriptivo (no vacío, no "imagen"). Revisar antes de entregar que ninguna imagen quedó sin alt.
11. **Compresión de imágenes** — correr `scripts/optimize-images.mjs` sobre todo lo que se sube a `public/` antes de entregar. Además, usar siempre `next/image` (nunca `<img>` plano) para que Next optimice y sirva el tamaño correcto por dispositivo.
12. **Velocidad de carga** — `next/image` con `priority` solo en la imagen above-the-fold, lazy load por defecto en el resto; `next/font` para las tipografías (evita layout shift y requests extra a Google Fonts); dynamic import (`next/dynamic`) para componentes pesados que no se ven al cargar (modales, carruseles below the fold).

## Diseño y accesibilidad

13. **Contraste de colores correcto** — validar que texto sobre fondo cumpla al menos WCAG AA (4.5:1 texto normal, 3:1 texto grande). Si hay Playwright MCP disponible, chequear visualmente contra la paleta real definida en el Paso 3.
14. **Responsive / mobile-first** — Tailwind con clases mobile-first (`sm:` `md:` `lg:` como incrementales, base sin prefijo pensada para mobile). Probar el layout en viewport angosto antes de entregar.
15. **Página 404 personalizada** — `assets/404-page.tsx` copiado a `app/not-found.tsx`, con la identidad visual del sitio, no la página en blanco por defecto.
16. **Sin enlaces rotos** — correr `scripts/check-broken-links.mjs` contra el sitio corriendo en local antes de entregar.

## Formularios

17. **Formularios con validación correcta** — `react-hook-form` + `zod` para validar en cliente y servidor con el mismo schema (evita duplicar reglas). `npm i react-hook-form zod @hookform/resolvers`.
18. **Protección contra spam** — honeypot field (un input oculto vía CSS que un bot completa y un humano no ve; si llega lleno, descartar el envío silenciosamente) en vez de contratar un servicio de captcha pago. Sumar también un rate-limit simple por IP en el route handler si el formulario pega a una API propia.

## Medición y conversión

19. **Analytics configurado** — Vercel Analytics (`npm i @vercel/analytics`, gratis en el plan free de Vercel) o el tag de Google Analytics si el usuario prefiere eso — cualquiera de los dos sin costo. Cargarlo solo después de que el usuario acepte cookies (punto 5).
20. **CTA único y claro** — revisar que cada página tenga una sola acción principal visualmente destacada (un botón, un color, una posición), no dos o tres botones compitiendo por atención. Esto es una revisión de diseño, no código — chequearlo en el Paso 3/7.
