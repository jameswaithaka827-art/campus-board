export type Plan = "free" | "pro";

export interface Entitlements {
  plan: Plan;
  isPro: boolean;
  canUseAIFeatures: boolean;
  maxUploadSizeMB: number;
  maxDailyMessages: number;
}

// NEXARA AI currently runs fully free: every account gets Pro-level
// entitlements without needing a subscription, so nobody hits a paywall.
// Set FREE_MODE=false in env (and configure Pesapal/Stripe) to re-enable
// paid gating based on actual subscriptionStatus — the payment integration
// itself is untouched and ready to go the moment that's flipped back.
const FREE_MODE = process.env.FREE_MODE !== "false";

// Accounts that always get Pro regardless of billing state - for the staff/
// owner and any staff accounts, so you don't have to pay yourself to use
// your own platform after FREE_MODE is turned off. Comma-separated list in
// env, e.g. OWNER_EMAILS=you@gmail.com,cofounder@gmail.com
// Compared lowercase and trimmed so spacing/capitalisation can't cause
// silent mismatch.
const OWNER_EMAILS = (process.env.OWNER_EMAILS || "jameswaithaka827@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isFreeMode() {
  return FREE_MODE;
}

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === "jameswaithaka827@gmail.com" ||
    OWNER_EMAILS.includes(normalized)
  );
}

export function getPlan(subscriptionStatus?: string | null, email?: string | null): Plan {
  if (FREE_MODE) return "pro";
  if (isOwnerEmail(email)) return "pro";
  
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return "pro";
  }

  return "free";
}

export function getEntitlements(subscriptionStatus?: string | null, email?: string | null): Entitlements {
  const plan = getPlan(subscriptionStatus, email);
  const isPro = plan === "pro";

  return {
    plan,
    isPro,
    canUseAIFeatures: true,
    maxUploadSizeMB: isPro ? 50 : 10,
    maxDailyMessages: isPro ? 1200 : 70,
  };
}

export function canUsePro(subscriptionStatus?: string | null, email?: string | null): boolean {
  return getPlan(subscriptionStatus, email) === "pro";
}