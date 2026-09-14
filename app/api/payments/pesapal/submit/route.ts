import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";
import { rateLimit } from "@/lib/rate-limit";
import { makePaymentReference, recordPayment, submitPesapalOrder } from "@/lib/payments";
import { requireEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = rateLimit(`pesapal-submit:${session.user.id}`, 5, 10 * 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many attempts — try again shortly." }, { status: 429 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const amountKsh = Number(body?.amountKsh);
  if (!Number.isFinite(amountKsh) || amountKsh <= 0 || amountKsh > 100_000) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const reference = makePaymentReference("JAIPRO");
  const appUrl = requireEnv("NEXTAUTH_URL").replace(/\/$/, "");

  try {
    const order = await submitPesapalOrder({
      reference,
      amountKsh,
      description: "James AI Pro subscription",
      callbackUrl: `${appUrl}/api/payments/pesapal/callback`,
      email: user.email,
    });

    await recordPayment({
      userId: session.user.id,
      provider: "pesapal",
      type: "subscription",
      reference,
      amountKsh,
      status: "pending",
      product: "pro",
      metadata: { orderTrackingId: order.orderTrackingId },
    });

    return NextResponse.json({ redirectUrl: order.redirectUrl });
  } catch (error) {
    console.error("Pesapal order submission failed", error);
    return NextResponse.json({ error: "Could not start Pesapal checkout. Try again shortly." }, { status: 502 });
  }
}
