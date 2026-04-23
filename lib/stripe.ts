import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/config";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-03-31.basil"
    });
  }

  return stripeClient;
}
