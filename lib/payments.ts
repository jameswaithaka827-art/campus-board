import { requireEnv } from "@/lib/env";

export type PesapalTransactionStatus = {
  payment_status_description?: string;
  status_code?: number;
  amount?: number;
  currency?: string;
  merchant_reference?: string;
  confirmation_code?: string;
  payment_method?: string;
  order_tracking_id?: string;
  redirect_url?: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Authenticates with Pesapal v3 API and returns a bearer token.
 * Tokens are cached in memory for up to 4.5 minutes to prevent redundant requests.
 */
export async function getPesapalToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const consumerKey = requireEnv("PESAPAL_CONSUMER_KEY");
  const consumerSecret = requireEnv("PESAPAL_CONSUMER_SECRET");
  const pesapalBaseUrl = getPesapalBaseUrl();

  const res = await fetch(`${pesapalBaseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
    cache: "no-store",
  });

  const raw = await res.text();
  let data: { token?: string; error?: unknown; message?: string } | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Response was not JSON
  }

  if (!res.ok || !data?.token) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal authentication failed (HTTP ${res.status}): ${detail}`);
  }

  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 4.5 * 60_000,
  };

  return data.token;
}

/**
 * Resolves the correct Pesapal base URL depending on the active environment configuration.
 */
function getPesapalBaseUrl(): string {
  const env = process.env.PESAPAL_ENV;
  if (env === "live") {
    return "https://pay.pesapal.com/v3";
  }
  return "https://cybqa.pesapal.com/v3";
}

/**
 * Registers an Instant Payment Notification (IPN) URL with Pesapal.
 */
export async function registerPesapalIpn(
  url: string,
  notificationType: "GET" | "POST" = "GET"
): Promise<string> {
  const token = await getPesapalToken();
  const pesapalBaseUrl = getPesapalBaseUrl();

  const res = await fetch(`${pesapalBaseUrl}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url,
      ipn_notification_type: notificationType,
    }),
    cache: "no-store",
  });

  const raw = await res.text();
  let data: { ipn_id?: string; error?: unknown; message?: string } | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Response was not JSON
  }

  if (!res.ok || !data?.ipn_id) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal IPN registration failed (HTTP ${res.status}): ${detail}`);
  }

  return data.ipn_id;
}

/**
 * Submits an order request to Pesapal and returns the tracking ID along with the payment redirect URL.
 */
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
  const pesapalBaseUrl = getPesapalBaseUrl();
  const ipnId = requireEnv("PESAPAL_IPN_ID");

  const res = await fetch(`${pesapalBaseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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
  let data: {
    order_tracking_id?: string;
    redirect_url?: string;
    error?: unknown;
    message?: string;
  } | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Response was not JSON
  }

  if (!res.ok || !data?.redirect_url || !data?.order_tracking_id) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal order submission failed (HTTP ${res.status}): ${detail}`);
  }

  return {
    orderTrackingId: data.order_tracking_id,
    redirectUrl: data.redirect_url,
  };
}

/**
 * Queries the transaction status from Pesapal using a specific order tracking ID.
 */
export async function getPesapalTransactionStatus(
  orderTrackingId: string
): Promise<PesapalTransactionStatus> {
  const token = await getPesapalToken();
  const pesapalBaseUrl = getPesapalBaseUrl();

  const res = await fetch(
    `${pesapalBaseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
      orderTrackingId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const raw = await res.text();
  let data: (PesapalTransactionStatus & { error?: unknown; message?: string }) | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Response was not JSON
  }

  if (!res.ok || !data) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal status check failed (HTTP ${res.status}): ${detail}`);
  }

  return data;
}

/**
 * Checks whether the payment status description returned by Pesapal denotes completion.
 */
export function isPesapalPaymentCompleted(status: PesapalTransactionStatus): boolean {
  const description = (status.payment_status_description || "").trim().toLowerCase();
  return description === "completed";
}

/**
 * Generates a unique, standardized merchant payment reference string.
 */
export function makePaymentReference(prefix: string = "CM"): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * Records a transaction ledger entry or placeholder record.
 */
export async function recordPayment(paymentData: {
  reference: string;
  orderTrackingId?: string;
  amount: number;
  currency: string;
  email: string;
  status: string;
}) {
  console.log("Recording payment transaction record to database:", paymentData);
  return paymentData;
}

/**
 * Verifies a Pesapal order status and formats the response object to align with callback and webhook handlers.
 */
export async function verifyAndSettlePesapalOrder(orderTrackingId: string) {
  const status = await getPesapalTransactionStatus(orderTrackingId);
  const isCompleted = isPesapalPaymentCompleted(status);
  const statusDesc = (status.payment_status_description || "").trim().toLowerCase();
  const isFailed = statusDesc === "failed" || statusDesc === "invalid" || statusDesc === "reversed";

  if (isCompleted) {
    console.log(`Pesapal order transaction ${status.merchant_reference || orderTrackingId} verified successfully.`);
  }

  return {
    completed: isCompleted,
    settled: isFailed,
    isCompleted,
    status,
  };
}