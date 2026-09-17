import { NextResponse } from "next/server";
import { submitPesapalOrder, makePaymentReference, recordPayment } from "@/lib/payments";
import { requireEnv } from "@/lib/env";

/**
 * API Route Handler for initiating Pesapal payment transactions.
 * Handles request validation, reference generation, order submission to Pesapal v3 API,
 * database transaction logging, and structured error responses.
 */
export async function POST(req: Request) {
  try {
    // Parse incoming request body safely with a fallback empty object
    const body = await req.json().catch(() => ({}));
    
    // Extract and parse the amount in KES from the request body
    const amountKsh = Number(body?.amountKsh);
    
    // Validate the transaction amount range and finite number structure
    if (!Number.isFinite(amountKsh) || amountKsh <= 0 || amountKsh > 100_000) {
      return NextResponse.json(
        { error: "Invalid payment amount specified. Amount must be between 1 and 100,000 KES." },
        { status: 400 }
      );
    }

    // Generate a unique merchant reference ID for tracking the payment order
    const reference = makePaymentReference("JAIPRO");
    
    // Resolve the application base URL from environment variables safely
    const appUrl = requireEnv("NEXTAUTH_URL").replace(/\/$/, "");

    // Retrieve user billing details from the request payload or provide safe defaults
    const user = {
      email: body?.email || "user@example.com",
      phone: body?.phone || "",
      firstName: body?.firstName || "",
      lastName: body?.lastName || "",
    }; 

    try {
      // Submit the payment order request to the Pesapal v3 gateway API
      const order = await submitPesapalOrder({
        reference,
        amount: amountKsh, // <-- Correctly mapped from amountKsh to satisfy the submitPesapalOrder interface
        currency: "KES",
        description: body?.description || "James AI Pro subscription package",
        callbackUrl: `${appUrl}/api/payments/pesapal/callback`,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // Record the pending transaction state into your system ledger/database
      await recordPayment({
        reference,
        orderTrackingId: order.orderTrackingId,
        amount: amountKsh,
        currency: "KES",
        email: user.email,
        status: "PENDING",
      });

      // Return successful response with tracking ID and redirect URL back to the frontend client
      return NextResponse.json({
        success: true,
        redirectUrl: order.redirectUrl,
        orderTrackingId: order.orderTrackingId,
        reference,
      }, { status: 200 });

    } catch (pesapalError: any) {
      // Capture and log specific failures returned from the Pesapal API gateway layer
      console.error("Pesapal API gateway transaction submission error occurred:", pesapalError);
      return NextResponse.json(
        { error: pesapalError?.message || "Failed to submit order request to Pesapal payment gateway." },
        { status: 500 }
      );
    }

  } catch (error: any) {
    // Capture and log general unhandled server-side exceptions during route execution
    console.error("Critical payment route initialization exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error encountered while processing payment request." },
      { status: 500 }
    );
  }
}