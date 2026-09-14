import { NextRequest, NextResponse } from "next/server";
import { verifyAndSettlePesapalOrder } from "@/lib/payments";
import { requireEnv } from "@/lib/env";

// Pesapal redirects the user's own browser here after they finish (or
// abandon) paying. Per Pesapal's own docs, this request never carries the
// actual payment result — only OrderTrackingId — so the real status is
// always re-checked independently before showing the user anything.
export async function GET(req: NextRequest) {
  const orderTrackingId = req.nextUrl.searchParams.get("OrderTrackingId");
  const appUrl = requireEnv("NEXTAUTH_URL").replace(/\/$/, "");

  if (!orderTrackingId) {
    return NextResponse.redirect(`${appUrl}/account?payment=error`);
  }

  try {
    const result = await verifyAndSettlePesapalOrder(orderTrackingId);
    const outcome = result.completed ? "success" : result.settled ? "failed" : "pending";
    return NextResponse.redirect(`${appUrl}/account?payment=${outcome}`);
  } catch (error) {
    console.error("Pesapal callback verification failed", error);
    return NextResponse.redirect(`${appUrl}/account?payment=error`);
  }
}
