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

const FREE_MODE = process.env.FREE_MODE !== "false";

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
  if (isOwnerEmail(email)) return "pro";
  if (FREE_MODE) return "pro";
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