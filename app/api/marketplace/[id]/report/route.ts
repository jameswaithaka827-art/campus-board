import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const { id: listingId } = await params;
  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 100) : "";
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 500) : null;
  if (!reason) return NextResponse.json({ error: "A reason is required." }, { status: 400 });

  const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await prisma.marketplaceReport.create({
    data: { listingId, reporterId: gate.user.id, reason, details },
  });

  return NextResponse.json({ reported: true });
}
