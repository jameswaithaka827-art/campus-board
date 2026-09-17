import { requireEnv } from "@/lib/env";
// Import your database client here if using Prisma or Supabase, e.g.:
// import { db } from "@/lib/db";

// --- Types ---
export type PesapalTransactionStatus = {
  payment_status_description?: string; // e.g. "Completed", "Failed", "Invalid", "Reversed"
  status_code?: number;
  amount?: number;
  currency?: string;
  merchant_reference?: string;
  confirmation_code?: string;
  payment_method?: string;
  order_tracking_id?: string;
  redirect_url?: string;
};

// --- Cache for Pesapal Token ---
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
  * Authenticates with Pesapal API and returns a valid Bearer token.
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
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    cache: "no-store",
  });

  const raw = await res.text();
  let data: { token?: string; error?: unknown; message?: string } | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // raw text fallback handled below
  }

  if (!res.ok || !data?.token) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal authentication failed (HTTP ${res.status}): ${detail}`);
  }

  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 4.5 * 60_000, // Cache for 4.5 minutes
  };

  return data.token;
}

/**
  * Helper to determine base URL depending on environment configuration.
  */
function getPesapalBaseUrl(): string {
  // Checks environment variables or defaults to sandbox/live URL
  return process.env.PESAPAL_ENV === "live" 
    ? "https://pay.pesapal.com/v3" 
    : "https://cybqa.pesapal.com/v3";
}

/**
  * Registers Instant Payment Notification (IPN) URL with Pesapal.
  */
export async function registerPesapalIpn(url: string, notificationType: "GET" | "POST" = "GET"): Promise<string> {
  const token = await getPesapalToken();
  const res = await fetch(`${getPesapalBaseUrl()}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url, ipn_notification_type: notificationType }),
    cache: "no-store",
  });

  const raw = await res.text();
  let data: { ipn_id?: string; error?: unknown; message?: string } | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {}

  if (!res.ok || !data?.ipn_id) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal IPN registration failed (HTTP ${res.status}): ${detail}`);
  }

  return data.ipn_id;
}

/**
  * Submits an order request to Pesapal and returns tracking details.
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
  const ipnId = requireEnv("PESAPAL_IPN_ID");

  const res = await fetch(`${getPesapalBaseUrl()}/api/Transactions/SubmitOrderRequest`, {
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
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {}

  if (!res.ok || !data?.redirect_url || !data?.order_tracking_id) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal order submission failed (HTTP ${res.status}): ${detail}`);
  }

  return { orderTrackingId: data.order_tracking_id, redirectUrl: data.redirect_url };
}

/**
  * Fetches the official transaction status directly from Pesapal.
  */
export async function getPesapalTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  const token = await getPesapalToken();
  const res = await fetch(
    `${getPesapalBaseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" }
  );

  const raw = await res.text();
  let data: PesapalTransactionStatus & { error?: unknown; message?: string } | null = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {}

  if (!res.ok || !data) {
    const detail = data ? JSON.stringify(data.error ?? data.message ?? data) : raw.slice(0, 500);
    throw new Error(`Pesapal status check failed (HTTP ${res.status}): ${detail}`);
  }

  return data;
}

/**
  * Checks if the transaction description marks the payment as completed successfully.
  */
export function isPesapalPaymentCompleted(status: PesapalTransactionStatus): boolean {
  return (status.payment_status_description || "").trim().toLowerCase() === "completed";
}

// ==========================================
// NEWLY EXPORTED HELPERS TO RESOLVE BUILD ERRORS
// ==========================================

/**
  * Generates a unique payment reference string for transactions.
  */
export function makePaymentReference(prefix: string = "CM"): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
  * Records or logs the transaction attempt into your database.
  */
export async function recordPayment(paymentData: {
  reference: string;
  orderTrackingId?: string;
  amount: number;
  currency: string;
  email: string;
  status: string;
}) {
  // Implement your database call here (e.g., Prisma / Supabase insert)
  // Example:
  // return await db.payment.create({ data: paymentData });
  
  console.log("Recording payment to database:", paymentData);
  return paymentData;
}

/**
  * Verifies a transaction status with Pesapal and updates records/settles order.
  */
export async function verifyAndSettlePesapalOrder(orderTrackingId: string) {
  const status = await getPesapalTransactionStatus(orderTrackingId);
  const isCompleted = isPesapalPaymentCompleted(status);

  if (isCompleted) {
    // Perform fulfillment or status update in your database using status.merchant_reference
    console.log(`Order ${status.merchant_reference} verified and completed successfully.`);
  }

  return {
    isCompleted,
    status,
  };
}