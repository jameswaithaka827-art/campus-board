import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing || listing.userId !== gate.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updated = await prisma.marketplaceListing.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing || listing.userId !== gate.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.marketplaceListing.delete({ where: { id } });

  return NextResponse.json({ success: true });
}