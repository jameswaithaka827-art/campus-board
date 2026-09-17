import { NextRequest, NextResponse } from "next/server";
import { verifyAndSettlePesapalOrder } from "@/lib/payments";

/**
 * Called by Pesapal's own servers, not a browser — same-origin checks don't
 * apply here (Pesapal's server sends no matching Origin header, and
 * blocking on that would just break real notifications). Protected instead
 * by a secret in the registered IPN URL itself: register
 * `${NEXTAUTH_URL}/api/payments/pesapal/ipn?secret=${PESAPAL_IPN_SECRET}`
 * with Pesapal (see .env.example), the same pattern used for the M-Pesa
 * callback before this. Like the browser callback, this request never
 * carries the actual payment result per Pesapal's own docs — only tracking
 * IDs — so status is always re-checked independently, never trusted from
 * the request itself.
 */
async function handle(req: NextRequest) {
  const expected = process.env.PESAPAL_IPN_SECRET;
  if (expected && req.nextUrl.searchParams.get("secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let orderTrackingId = req.nextUrl.searchParams.get("OrderTrackingId");
  let orderMerchantReference = req.nextUrl.searchParams.get("OrderMerchantReference") || "";
  let orderNotificationType = req.nextUrl.searchParams.get("OrderNotificationType") || "IPNCHANGE";

  if (!orderTrackingId && req.method === "POST") {
    const body = await req.json().catch(() => null);
    orderTrackingId = body?.OrderTrackingId || null;
    orderMerchantReference = body?.OrderMerchantReference || orderMerchantReference;
    orderNotificationType = body?.OrderNotificationType || orderNotificationType;
  }

  if (!orderTrackingId) {
    // Pesapal expects this exact ack shape regardless of outcome.
    return NextResponse.json({ orderNotificationType, orderTrackingId: "", orderMerchantReference, status: 500 });
  }

  try {
    await verifyAndSettlePesapalOrder(orderTrackingId);
  } catch (error) {
    console.error("Pesapal IPN verification failed", error);
    return NextResponse.json({ orderNotificationType, orderTrackingId, orderMerchantReference, status: 500 });
  }

  return NextResponse.json({ orderNotificationType, orderTrackingId, orderMerchantReference, status: 200 });
}

export const GET = handle;
export const POST = handle;