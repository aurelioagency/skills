import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

// Copiar a app/api/webhook/route.ts. Requiere STRIPE_SECRET_KEY y
// STRIPE_WEBHOOK_SECRET en .env.local. Configurar esta URL en el dashboard
// de Stripe (Developers > Webhooks) apuntando a /api/webhook.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    // Verificar la firma es lo que hace que este endpoint sea confiable:
    // sin esto, cualquiera podría pegarle a esta URL simulando un pago.
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "firma inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.productId;
    const email = session.customer_email;

    // TODO: acá, y solo acá, registrar la compra en la base de datos
    // (usuario/email, productId, fecha). Recién con este registro el
    // comprador puede ver/generar el link de descarga en "Mis compras".
    // await db.purchases.create({ email, productId, paidAt: new Date() });
  }

  return NextResponse.json({ received: true });
}
