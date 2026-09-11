import Stripe from "stripe";

// Billing is optional — James AI runs fully free without any Stripe keys
// configured (see FREE_MODE in lib/entitlements.ts). `stripe` is null when
// STRIPE_SECRET_KEY isn't set; every route that uses it must check for that
// and return a clear response instead of letting a Stripe call throw.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;
