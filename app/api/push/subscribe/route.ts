import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: register this browser/device to receive push notifications.
// Called after the client gets permission and subscribes via the
// Push API — see lib/push-client.ts on the frontend.
export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint, keys } = await req.json();
  if (
    typeof endpoint !== "string" ||
    !endpoint ||
    typeof keys?.p256dh !== "string" ||
    typeof keys?.auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  // Upsert on endpoint: re-subscribing (e.g. after clearing the browser's
  // permission) shouldn't create duplicate rows for the same device.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ subscribed: true });
}

// DELETE: stop sending push notifications to this browser/device.
export async function DELETE(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ unsubscribed: true });
}
