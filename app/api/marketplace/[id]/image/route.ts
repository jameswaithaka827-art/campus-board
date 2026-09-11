import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { streamPrivateBlob } from "@/lib/private-storage";

const parse = (x: string | null) => {
  try {
    const a = JSON.parse(x || "[]");
    return Array.isArray(a) ? a.filter((v): v is string => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
};

const CONTENT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const i = Number(req.nextUrl.searchParams.get("index") || 0);
  if (!Number.isInteger(i) || i < 0 || i > 5) {
    return NextResponse.json({ error: "Invalid image index" }, { status: 400 });
  }
  const listing = await prisma.marketplaceListing.findUnique({ where: { id }, select: { images: true } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  const url = parse(listing.images)[i];
  if (!url) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  const ext = url.split(".").pop()?.toLowerCase().split(/[?#]/)[0] || "jpg";
  return streamPrivateBlob(url, CONTENT_TYPES[ext] || "image/jpeg");
}
