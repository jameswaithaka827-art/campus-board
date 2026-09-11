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
  const existing = await prisma.marketplaceWatch.findUnique({
    where: { userId_listingId: { userId: gate.user.id, listingId } },
  });

  if (existing) {
    await prisma.marketplaceWatch.delete({ where: { id: existing.id } });
    return NextResponse.json({ watching: false });
  }

  await prisma.marketplaceWatch.create({ data: { userId: gate.user.id, listingId } });
  return NextResponse.json({ watching: true });
}
