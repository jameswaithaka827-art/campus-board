import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 3 MB or smaller." }, { status: 400 });
  }

  const oldUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  const safeExt = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`avatars/${session.user.id}.${safeExt}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: blob.url },
  });

  if (oldUser?.avatarUrl && oldUser.avatarUrl !== blob.url) {
    try { await del(oldUser.avatarUrl); } catch { /* old avatar cleanup is best-effort */ }
  }

  return NextResponse.json({ avatarUrl: blob.url });
}
