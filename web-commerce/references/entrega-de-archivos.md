# Entrega de archivos pesados tras la compra

## Por qué no se sirve desde Next.js

Una route de Next.js (incluso en Vercel) tiene límites de tamaño de respuesta y de tiempo de ejecución pensados para HTML/JSON/imágenes chicas, no para archivos de varios gigabytes. Además, si el archivo vive en el propio repo o en `public/`, cualquiera puede acceder a él sin pagar con solo adivinar la URL. La solución es que el archivo viva en un storage de objetos aparte (Cloudflare R2 o Backblaze B2, ambos compatibles con la API de S3) y que Next.js solo genere un link temporal hacia ahí.

## Flujo completo

1. **Subida previa**: el curso/archivo se sube una sola vez al bucket (R2/B2), con acceso privado (no público). Esto lo hace el usuario manualmente o con un script aparte — no es parte del flujo de compra.
2. **Compra**: el comprador paga en Stripe Checkout (ver `assets/checkout-route.ts`).
3. **Confirmación**: Stripe manda el evento `checkout.session.completed` al webhook (`assets/webhook-route.ts`). Ahí, y solo ahí, se registra la compra en la base de datos (qué usuario, qué producto, cuándo).
4. **Generación del link**: con el SDK de S3 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, compatible con R2 y B2 configurando el `endpoint` correspondiente), generar una URL firmada (`getSignedUrl`) con expiración corta — por ejemplo 1 hora. Ver `assets/signed-download-route.ts`.
5. **Entrega**: mandar esa URL por email al comprador (ej. con Resend o el proveedor de email que ya use el sitio), y/o mostrarla en una página protegida por login ("Mis compras") que regenera un link nuevo cada vez que el usuario entra, en vez de guardar el link viejo (porque expira).

## Por qué la expiración corta importa

Si la URL firmada no expirara, se podría compartir libremente y cualquiera con el link tendría acceso para siempre sin haber pagado. Regenerar el link en cada visita a "Mis compras" (en vez de mandar siempre el mismo) resuelve esto sin fricción para el comprador real.

## Variables de entorno necesarias

Según el proveedor elegido en el Paso 0 del SKILL.md:

- **Cloudflare R2**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
- **Backblaze B2**: `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT`.

Ninguna de estas se hardcodea ni se pide por chat — van en `.env.local`.
