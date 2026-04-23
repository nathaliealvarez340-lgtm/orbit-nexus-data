import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/config";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}
