import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TIMEZONES = new Set([
  "Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg", "Europe/London",
  "Europe/Paris", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney",
]);

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.timeZone !== "string" || !ALLOWED_TIMEZONES.has(body.timeZone)) {
    return NextResponse.json({ error: "Unsupported timezone" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { timeZone: body.timeZone } });
  return NextResponse.json({ saved: true, timeZone: body.timeZone });
}
