import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireEnv } from "@/lib/env";

export type PaymentProvider = "stripe" | "pesapal" | "google_play" | "apple" | "other";

export function makePaymentReference(prefix = "JAI") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}

export function normalizeKenyanPhone(input: string): string | null {
  const raw = input.replace(/\s+/g, "").replace(/-/g, "");
  if (/^07\d{8}$/.test(raw)) return `254${raw.slice(1)}`;
  if (/^01\d{8}$/.test(raw)) return `254${raw.slice(1)}`;
  if (/^2547\d{8}$/.test(raw)) return raw;
  if (/^2541\d{8}$/.test(raw)) return raw;
  return null;
}

export async function recordPayment(input: {
  userId: string; provider: PaymentProvider; type: string; reference: string; amountKsh: number; status: string; product?: string; metadata?: unknown;
}) {
  return prisma.paymentTransaction.upsert({
    where: { reference: input.reference },
    create: { ...input, metadata: input.metadata ? JSON.stringify(input.metadata) : null },
    update: { status: input.status, metadata: input.metadata ? JSON.stringify(input.metadata) : undefined },
  });
}

// ---------------------------------------------------------------------------
// Pesapal API v3 (https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json)
// Every request/response shape here was checked directly against Pesapal's
// own published docs (Authentication, RegisterIPNURL, SubmitOrderRequest,
// GetTransactionStatus pages) — not assumed from a third-party SDK.
// ---------------------------------------------------------------------------

export function pesapalBaseUrl() {
  return (process.env.PESAPAL_ENV || "sandbox").toLowerCase() === "production"
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";
}

// Tokens are valid for a maximum of 5 minutes per Pesapal's own docs, and
// they explicitly note you shouldn't re-authenticate on every call — cache
// in memory and only refresh once it's actually close to expiring. Same
// single-process caveat as this codebase's other in-memory state (rate
// limiter, etc.): fine for one instance, won't share across serverless
// instances.
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPesapalAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 15_000) {
    return cachedToken.token;
  }
  const consumer_key = requireEnv("PESAPAL_CONSUMER_KEY");
  const consumer_secret = requireEnv("PESAPAL_CONSUMER_SECRET");
  const response = await fetch(`${pesapalBaseUrl()}/Auth/RequestToken`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_key, consumer_secret }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as { token?: string; expiryDate?: string; message?: string } | null;
  if (!response.ok || !data?.token) {
    throw new Error(`Pesapal auth failed: ${data?.message || response.status}`);
  }
  // expiryDate is an ISO timestamp from Pesapal; fall back to "4 minutes from
  // now" (a minute of margin under their stated 5-minute ceiling) if it's
  // ever missing or unparseable, rather than trusting an unbounded cache.
  const parsedExpiry = data.expiryDate ? Date.parse(data.expiryDate) : NaN;
  const expiresAt = Number.isFinite(parsedExpiry) ? parsedExpiry : Date.now() + 4 * 60_000;
  cachedToken = { token: data.token, expiresAt };
  return data.token;
}

export type PesapalSubmitOrderInput = {
  reference: string; // your merchant reference — must be unique, alphanumeric + - _ . : only, max 50 chars
  amountKsh: number;
  description: string; // max 100 chars per Pesapal's limit
  callbackUrl: string;
  email?: string;
  phone?: string;
};

/**
 * Creates a payment order and returns the URL to send the user's browser to
 * (or load in an iframe) so they can choose M-Pesa/card/Airtel Money/etc.
 * and pay through Pesapal's own hosted page.
 */
export async function submitPesapalOrder(input: PesapalSubmitOrderInput): Promise<{
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
}> {
  const token = await getPesapalAccessToken();
  const notification_id = requireEnv("PESAPAL_IPN_ID");
  const response = await fetch(`${pesapalBaseUrl()}/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.reference,
      currency: "KES",
      amount: input.amountKsh,
      description: input.description.slice(0, 100),
      callback_url: input.callbackUrl,
      notification_id,
      billing_address: {
        email_address: input.email || undefined,
        phone_number: input.phone || undefined,
        country_code: "KE",
      },
    }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as {
    order_tracking_id?: string; merchant_reference?: string; redirect_url?: string; message?: string; error?: unknown;
  } | null;
  if (!response.ok || !data?.redirect_url || !data.order_tracking_id) {
    throw new Error(`Pesapal order submission failed: ${data?.message || response.status}`);
  }
  return {
    orderTrackingId: data.order_tracking_id,
    merchantReference: data.merchant_reference || input.reference,
    redirectUrl: data.redirect_url,
  };
}

export type PesapalTransactionStatus = {
  statusCode: 0 | 1 | 2 | 3; // 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED
  statusDescription: string;
  amount: number;
  merchantReference: string;
  confirmationCode: string | null;
  paymentMethod: string | null;
};

/**
 * Pesapal's callback and IPN calls deliberately never include the payment
 * status in the request itself ("for security reasons" — their own docs)
 * — the only trustworthy way to know what happened is to ask Pesapal
 * directly, using this, with credentials only this server has.
 */
export async function getPesapalTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus | null> {
  const token = await getPesapalAccessToken();
  const response = await fetch(
    `${pesapalBaseUrl()}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" }
  );
  const data = (await response.json().catch(() => null)) as {
    status_code?: number; payment_status_description?: string; amount?: number;
    merchant_reference?: string; confirmation_code?: string; payment_method?: string;
  } | null;
  if (!response.ok || data?.status_code === undefined || data.status_code === null) return null;
  const code = Number(data.status_code);
  if (![0, 1, 2, 3].includes(code)) return null;
  return {
    statusCode: code as 0 | 1 | 2 | 3,
    statusDescription: data.payment_status_description || "",
    amount: Number(data.amount) || 0,
    merchantReference: data.merchant_reference || "",
    confirmationCode: data.confirmation_code || null,
    paymentMethod: data.payment_method || null,
  };
}

/**
 * Shared by both the callback (browser redirect) and IPN (server-to-server)
 * routes: independently confirms the real status with Pesapal — never
 * trusting either request's own query params for that — and activates the
 * subscription if, and only if, Pesapal itself confirms COMPLETED (status
 * code 1). Idempotent: safe to call twice for the same order (e.g. both the
 * callback and IPN firing for one payment), since it just re-checks status
 * and re-applies the same update rather than incrementing anything.
 */
export async function verifyAndSettlePesapalOrder(orderTrackingId: string): Promise<{ settled: boolean; completed: boolean }> {
  const status = await getPesapalTransactionStatus(orderTrackingId);
  if (!status) return { settled: false, completed: false };

  const txn = await prisma.paymentTransaction.findFirst({
    where: { provider: "pesapal", metadata: { contains: orderTrackingId } },
  });
  if (!txn) return { settled: false, completed: false };

  const completed = status.statusCode === 1;
  const newStatus = completed ? "paid" : status.statusCode === 2 ? "failed" : status.statusCode === 3 ? "reversed" : "pending";

  await prisma.paymentTransaction.update({
    where: { id: txn.id },
    data: {
      status: newStatus,
      metadata: JSON.stringify({ orderTrackingId, confirmationCode: status.confirmationCode, paymentMethod: status.paymentMethod, previous: txn.metadata }),
    },
  });

  if (completed && txn.type === "subscription") {
    await prisma.user.update({ where: { id: txn.userId }, data: { subscriptionStatus: "active", subscriptionProvider: "pesapal" } });
  }

  return { settled: true, completed };
}
