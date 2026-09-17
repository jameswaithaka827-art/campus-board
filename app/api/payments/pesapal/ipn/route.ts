import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderTrackingId = searchParams.get("OrderTrackingId");
    const orderMerchantReference = searchParams.get("OrderMerchantReference");

    if (!orderTrackingId) {
      return NextResponse.json(
        { status: 400, message: "Missing OrderTrackingId" },
        { status: 400 }
      );
    }

    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    const isLive = process.env.PESAPAL_ENV === "live";
    const baseUrl = isLive
      ? "https://pay.pesapal.com/v3"
      : "https://cybqa.pesapal.com/pesapalv3";

    // 1. Authenticate with Pesapal API
    const authRes = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    const authData = await authRes.json();
    if (!authData.token) {
      return NextResponse.json(
        { status: 500, message: "Failed to authenticate with Pesapal" },
        { status: 500 }
      );
    }

    // 2. Query transaction status from Pesapal
    const statusRes = await fetch(
      `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authData.token}`,
          Accept: "application/json",
        },
      }
    );

    const statusData = await statusRes.json();

    // 3. Log transaction outcome
    if (statusData.status_code === 1) {
      console.log(`[PESAPAL IPN] Success: Ref=${orderMerchantReference}, TrackingId=${orderTrackingId}`);
    } else {
      console.log(`[PESAPAL IPN] Status Code ${statusData.status_code}: Ref=${orderMerchantReference}`);
    }

    // Pesapal expects a JSON response acknowledging receipt
    return NextResponse.json({
      status: statusData.status_code || 200,
      message: "IPN processed successfully",
      orderTrackingId,
      orderMerchantReference,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[PESAPAL IPN ERROR]:", errorMessage);
    return NextResponse.json(
      { status: 500, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}