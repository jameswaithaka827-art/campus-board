export type Plan = "free" | "pro";

export interface Entitlements {
  plan: Plan;
  isPro: boolean;
  canUseAIFeatures: boolean;
  maxUploadSizeMB: number;
  maxDailyMessages: number;
  aiMonthlyLimit: number;
  maxChatImages: number;
  webSearch: boolean;
}

export const PRO_FEATURES = [
  "Unlimited AI Messages",
  "Advanced Web Search Integration",
  "Higher File Upload Limits (up to 50MB)",
  "Multi-image Vision Analysis",
  "Priority Support",
];

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
    aiMonthlyLimit: isPro ? 10000 : 20,
    maxChatImages: isPro ? 10 : 2,
    webSearch: isPro,
  };
}

export function canUsePro(subscriptionStatus?: string | null, email?: string | null): boolean {
  return getPlan(subscriptionStatus, email) === "pro";
}