import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { privateBlobToken } from "@/lib/private-storage";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";

// PATCH: seller marks their own listing sold/active, or edits title/description/price.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== gate.user.id) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { status?: string; title?: string; description?: string; priceKsh?: number | null } = {};

  if (body?.status === "sold" || body?.status === "active") data.status = body.status;
  if (typeof body?.title === "string") data.title = body.title.trim().slice(0, 100);
  if (typeof body?.description === "string") data.description = body.description.trim().slice(0, 700);
  if (body?.priceKsh !== undefined) {
    data.priceKsh = body.priceKsh == null ? null : Math.max(0, Math.min(5_000_000, Math.floor(Number(body.priceKsh) || 0)));
  }

  const updated = await prisma.marketplaceListing.update({ where: { id }, data });
  return NextResponse.json({ listing: { ...updated, images: JSON.parse(updated.images || "[]") } });
}

// DELETE: seller removes their own listing.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  // deleteMany (not delete) so this can't be used to probe whether an id
  // belonging to someone else exists — a mismatched id/user just deletes nothing.
  const listing = await prisma.marketplaceListing.findFirst({ where: { id, sellerId: gate.user.id }, select: { images: true } });
  const result = await prisma.marketplaceListing.deleteMany({ where: { id, sellerId: gate.user.id } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Best-effort cleanup — an orphaned blob costs storage silently forever if
  // this is skipped, but a failure here shouldn't undo the deletion the
  // user actually asked for.
  try {
    const images: unknown = JSON.parse(listing?.images || "[]");
    if (Array.isArray(images) && images.length) {
      await del(images.filter((u): u is string => typeof u === "string"), { token: privateBlobToken() });
    }
  } catch (error) {
    console.error("Failed to clean up listing images", error);
  }
  return NextResponse.json({ deleted: true });
}
