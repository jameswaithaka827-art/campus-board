import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";
import { del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "DELETE") return NextResponse.json({ error: "Confirmation required." }, { status: 400 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  if (user?.avatarUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    try { await del(user.avatarUrl); } catch (error) { console.error("Avatar cleanup failed", error); }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.course.deleteMany({ where: { instructorId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });
  return NextResponse.json({ ok: true });
}
