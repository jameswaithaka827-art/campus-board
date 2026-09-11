import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { streamPrivateBlob } from "@/lib/private-storage";

const parse = (x: string | null) => {
  try {
    const a = JSON.parse(x || "[]");
    return Array.isArray(a) ? a.filter((v): v is string => typeof v === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireActiveVerifiedUser();
  if (!g.ok) return g.response;
  const { id } = await params;
  const i = Number(req.nextUrl.searchParams.get("index") || 0);
  if (!Number.isInteger(i) || i < 0 || i > 4) {
    return NextResponse.json({ error: "Invalid image index" }, { status: 400 });
  }
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { imageUrls: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  const url = parse(post.imageUrls)[i];
  if (!url) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  return streamPrivateBlob(url, "image/jpeg");
}
