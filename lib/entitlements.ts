export type Plan = "free" | "pro";

export const PRO_FEATURES = [
  "300 AI actions per month",
  "Web research mode",
  "Up to 4 photo attachments per AI message",
  "Advanced study analytics (when enabled)",
  "Priority access to new NEXARA AI study tools",
  "Expanded course and lesson storage",
  "Pro badge on the account",
] as const;

// NEXARA AI currently runs fully free: every account gets Pro-level
// entitlements without needing a subscription, so nobody hits a paywall.
// Set FREE_MODE=false in env (and configure Pesapal/Stripe) to re-enable
// paid gating based on actual subscriptionStatus — the payment integration
// itself is untouched and ready to go the moment that's flipped back.
const FREE_MODE = process.env.FREE_MODE !== "false";

// Accounts that always get Pro regardless of billing state — for the site
// owner and any staff accounts, so you don't have to pay yourself to use
// your own platform after FREE_MODE is turned off. Comma-separated list in
// env, e.g. OWNER_EMAILS=you@gmail.com,cofounder@gmail.com
// Compared lowercase and trimmed so spacing/capitalisation can't cause a
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
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

export function getPlan(subscriptionStatus?: string | null, email?: string | null): Plan {
  if (FREE_MODE) return "pro";
  if (isOwnerEmail(email)) return "pro";
  return subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "pro" : "free";
}

export function getEntitlements(subscriptionStatus?: string | null, email?: string | null) {
  const plan = getPlan(subscriptionStatus, email);
  return {
    plan,
    isPro: plan === "pro",
    aiMonthlyLimit: plan === "pro" ? 300 : 20,
    maxChatImages: plan === "pro" ? 4 : 1,
    advancedAnalytics: plan === "pro",
    webSearch: plan === "pro",
  };
}

export function canUsePro(subscriptionStatus?: string | null, email?: string | null) {
  return getPlan(subscriptionStatus, email) === "pro";
}