import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

// Copiar a app/api/checkout/route.ts. Requiere STRIPE_SECRET_KEY en .env.local.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { productId, priceInCents, productName, userEmail } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: productName },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: { productId }, // el webhook usa esto para saber qué se compró
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/compra-exitosa?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout-cancelado`,
  });

  return NextResponse.json({ url: session.url });
}

// Nota: success_url es solo para redirigir visualmente al usuario después de
// pagar — NUNCA se usa esta ruta para dar acceso al archivo. El acceso real
// se otorga en el webhook (webhook-route.ts), que verifica el pago del lado
// del servidor con la firma de Stripe.
