export type Plan = "free" | "pro";

export const PRO_FEATURES = [
  "300 AI actions per month",
  "Web research mode",
  "Up to 4 photo attachments per AI message",
  "Advanced study analytics (when enabled)",
  "Priority access to new James AI study tools",
  "Expanded course and lesson storage",
  "Pro badge on the account",
] as const;

// James AI currently runs fully free: every account gets Pro-level
// entitlements without needing a subscription, so nobody hits a paywall.
// Set FREE_MODE=false in env (and configure Stripe) to re-enable paid
// gating based on actual subscriptionStatus — the Stripe integration itself
// is untouched and ready to go the moment that's flipped back.
const FREE_MODE = process.env.FREE_MODE !== "false";

export function isFreeMode() {
  return FREE_MODE;
}

export function getPlan(subscriptionStatus?: string | null): Plan {
  if (FREE_MODE) return "pro";
  return subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "pro" : "free";
}

export function getEntitlements(subscriptionStatus?: string | null) {
  const plan = getPlan(subscriptionStatus);
  return {
    plan,
    isPro: plan === "pro",
    aiMonthlyLimit: plan === "pro" ? 300 : 20,
    maxChatImages: plan === "pro" ? 4 : 1,
    advancedAnalytics: plan === "pro",
    webSearch: plan === "pro",
  };
}

export function canUsePro(subscriptionStatus?: string | null) {
  return getPlan(subscriptionStatus) === "pro";
}