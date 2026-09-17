import { requireEnv } from "@/lib/env";

function pesapalBaseUrl() {
  return (process.env.PESAPAL_ENV || "sandbox").toLowerCase() === "live"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";
}

// Tokens are valid ~5 minutes. Cached in memory per server process and
// refreshed a little early — cheap insurance against a request landing
// right as the token expires. Fine to lose this cache on redeploy/restart;
// it just means the next call re-authenticates once.
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPesapalToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 15_000) return cachedToken.token;

  const consumer_key = requireEnv("PESAPAL_CONSUMER_KEY");
  const consumer_secret = requireEnv("PESAPAL_CONSUMER_SECRET");
  const res = await fetch(`${pesapalBaseUrl()}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key, consumer_secret }),
    cache: "no-store",
  });
  // Read as text first, not .json() directly — a non-2xx or malformed
  // response (HTML error page, empty body) would otherwise make the
  // failure a confusing "Unexpected token <" instead of a clear message,
  // and .json().catch(() => null) was swallowing the real response body
  // entirely, which is why past failures only logged the status code with
  // no way to tell an auth failure from a network/config problem.
  const raw = await res.text();
  let data: { token?: string; error?: unknown; message?: string } | null = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* raw stays available below */ }

  if (!res.ok || !data?.token) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`PesaPal authentication failed (HTTP ${res.status}): ${detail}`);
  }
  cachedToken = { token: data.token, expiresAt: Date.now() + 4.5 * 60_000 };
  return data.token;
}

/**
 * One-time (or on-demand) setup: registers the URL PesaPal should call when
 * a transaction's status changes. Returns an ipn_id that must be saved as
 * PESAPAL_IPN_ID — every order submission requires it.
 */
export async function registerPesapalIpn(url: string, notificationType: "GET" | "POST" = "GET") {
  const token = await getPesapalToken();
  const res = await fetch(`${pesapalBaseUrl()}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url, ipn_notification_type: notificationType }),
    cache: "no-store",
  });
  const raw = await res.text();
  let data: { ipn_id?: string; error?: unknown; message?: string } | null = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* raw stays available below */ }
  if (!res.ok || !data?.ipn_id) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`PesaPal IPN registration failed (HTTP ${res.status}): ${detail}`);
  }
  return data.ipn_id;
}

export async function submitPesapalOrder(input: {
  reference: string;
  amount: number;
  currency?: string;
  description: string;
  callbackUrl: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  const token = await getPesapalToken();
  const ipnId = requireEnv("PESAPAL_IPN_ID");
  const res = await fetch(`${pesapalBaseUrl()}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      id: input.reference,
      currency: input.currency || "KES",
      amount: input.amount,
      description: input.description,
      callback_url: input.callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: input.email,
        phone_number: input.phone || "",
        first_name: input.firstName || "",
        last_name: input.lastName || "",
      },
    }),
    cache: "no-store",
  });
  const raw = await res.text();
  let data: { order_tracking_id?: string; redirect_url?: string; error?: unknown; message?: string } | null = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* raw stays available below */ }
  if (!res.ok || !data?.redirect_url || !data?.order_tracking_id) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`PesaPal order submission failed (HTTP ${res.status}): ${detail}`);
  }
  return { orderTrackingId: data.order_tracking_id, redirectUrl: data.redirect_url };
}

export type PesapalTransactionStatus = {
  payment_status_description?: string; // e.g. "Completed", "Failed", "Invalid", "Reversed"
  status_code?: number;
  amount?: number;
  currency?: string;
  merchant_reference?: string;
  confirmation_code?: string;
  payment_method?: string;
};

/**
 * PesaPal's callback redirect and IPN call deliberately do NOT include the
 * payment status, for security — anyone could otherwise forge a "paid"
 * redirect. Both must be treated only as "go check now," never as proof of
 * payment. This independently asks PesaPal what the real status is, using
 * credentials only this server has. Same principle the M-Pesa Daraja
 * integration this replaces already followed — never trust a client-facing
 * redirect or webhook body's claimed result.
 */
export async function getPesapalTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  const token = await getPesapalToken();
  const res = await fetch(
    `${pesapalBaseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" }
  );
  const raw = await res.text();
  let data: (PesapalTransactionStatus & { error?: unknown; message?: string }) | null = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* raw stays available below */ }
  if (!res.ok || !data) {
    const detail = data ? JSON.stringify((data as { error?: unknown }).error ?? (data as { message?: string }).message ?? data) : raw.slice(0, 500);
    throw new Error(`PesaPal status check failed (HTTP ${res.status}): ${detail}`);
  }
  return data;
}

export function isPesapalPaymentCompleted(status: PesapalTransactionStatus): boolean {
  // Match the human-readable description conservatively — only an explicit
  // "completed" counts as paid. Anything else (Failed, Invalid, Reversed,
  // or a status we don't recognize) is treated as not-yet-paid rather than
  // guessed at, since crediting on an ambiguous read is the wrong direction
  // to be wrong in for a payment.
  return (status.payment_status_description || "").trim().toLowerCase() === "completed";
}