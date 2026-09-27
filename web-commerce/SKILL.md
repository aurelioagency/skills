---
name: web-commerce
description: Añade login, pagos con Stripe y entrega segura de archivos digitales pesados (cursos, productos descargables de varios GB) a un sitio Next.js ya construido — por ejemplo con la skill web-builder. Usar cuando el usuario quiera vender cursos o productos digitales, cobrar por acceso a contenido, o necesite que alguien pague y recién después pueda descargar un archivo. A diferencia de web-builder, esto no se resuelve solo generando código: requiere que el usuario tenga (o cree) una cuenta de Stripe y una cuenta de storage de objetos (Cloudflare R2 o Backblaze B2) con sus propias credenciales — la skill nunca crea esas cuentas ni pide las claves por chat, solo integra el código que las usa desde variables de entorno.
---

# Web Commerce

Módulo aparte de `web-builder` porque agrega backend + infraestructura con costo real y credenciales de terceros (Stripe cobra comisión por venta, el storage cobra por GB) — no es solo "generar código y listo".

## Paso 0 — Antes de escribir nada

Confirmá con el usuario:

1. **Ya tiene o va a crear una cuenta de Stripe.** Si no la tiene, decile que la cree en https://dashboard.stripe.com/register antes de seguir — la skill no puede crearla por él.
2. **Ya tiene o va a crear una cuenta de storage para los archivos.** Recomendar Cloudflare R2 (sin costo de egress, más barato para archivos grandes) o Backblaze B2 como alternativa. Explicar que ambos cobran por GB almacenado más allá de una capa gratis chica — el usuario tiene que aceptar ese costo variable antes de avanzar.
3. **Dónde van a vivir las credenciales**: siempre en `.env.local` (que ya está en `.gitignore` por defecto en Next.js), nunca hardcodeadas en el código ni pegadas en el chat. Las variables típicas: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, y las del proveedor de storage elegido (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` o el equivalente de B2).

No avances a los pasos siguientes hasta que el usuario confirme estos tres puntos.

## Paso 1 — Login

Instalar Auth.js (ex NextAuth):

```bash
npm i next-auth
```

Configurar el proveedor que el usuario prefiera — email/password (con verificación de email) o login social (Google) según lo que pida. Ver `references/auth-setup.md` para la config exacta de App Router.

## Paso 2 — Pagos con Stripe

Instalar el SDK:

```bash
npm i stripe @stripe/stripe-js
```

Dos piezas de código, ver `assets/checkout-route.ts` y `assets/webhook-route.ts`:

1. **Route handler de checkout** (`app/api/checkout/route.ts`) — crea una sesión de Stripe Checkout para el producto/curso elegido y redirige al usuario a pagar.
2. **Webhook de Stripe** (`app/api/webhook/route.ts`) — Stripe le pega a esta URL cuando el pago se confirma. Acá, y solo acá, se marca la compra como pagada en la base de datos. Nunca confiar en la redirección del navegador después del pago (`success_url`) para dar acceso — un usuario puede llegar a esa URL sin haber pagado realmente; el webhook con su firma verificada es la única fuente de verdad.

## Paso 3 — Entrega del archivo (los "varios GB")

Un archivo de varios gigabytes no se sirve desde una route de Next.js — hay que servirlo directo desde el storage (R2/B2) con una URL firmada de corta duración, generada recién cuando el webhook confirmó el pago. Ver `references/entrega-de-archivos.md` para el flujo completo y `assets/signed-download-route.ts` para el código de ejemplo.

Flujo resumido:

1. El archivo del curso vive subido de antemano en el bucket de R2/B2, nunca en el repo del sitio.
2. Cuando el webhook de Stripe confirma el pago, el servidor genera una URL firmada (expira en minutos/horas, no es un link permanente) apuntando a ese archivo.
3. Esa URL se le manda al comprador por email, o se muestra en una página protegida por login como "Mis compras" donde solo ve los links de lo que efectivamente pagó.

## Reglas duras

- Nunca avances con el código de Stripe/storage sin que el usuario haya confirmado el Paso 0.
- Nunca pidas ni escribas claves secretas en el chat — solo nombrás la variable de entorno que hace falta y el usuario la completa en `.env.local`.
- Nunca des acceso a la descarga basándote en el redirect del navegador tras el pago — siempre y solo tras verificar la firma del webhook de Stripe.
- Nunca sirvas el archivo pesado directo desde una route de Next.js — siempre por URL firmada al storage externo.
- Avisale siempre al usuario, antes de avanzar, que Stripe cobra comisión por transacción y que el storage cobra por GB — no son costos fijos que la skill pueda evitar.

## Referencias

- `references/auth-setup.md` — configuración de Auth.js para App Router.
- `references/entrega-de-archivos.md` — flujo completo de compra → webhook → URL firmada → descarga.
- `assets/checkout-route.ts`, `assets/webhook-route.ts`, `assets/signed-download-route.ts` — código de ejemplo para copiar y adaptar.
