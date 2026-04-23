import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeWebhookSecret } from "@/lib/config";
import { handleStripeCheckoutCompleted, handleStripeInvoicePaid } from "@/lib/services/commercial/company-activation";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ message: "Falta la firma del webhook." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Firma de webhook invalida." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleStripeCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "invoice.paid") {
      await handleStripeInvoicePaid(event.data.object as Stripe.Invoice);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "No fue posible procesar el webhook." }, { status: 500 });
  }
}
