import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, role: true, accountStatus: true, emailVerificationCompletedAt: true } });
  if (!user || user.accountStatus !== "active" || user.role !== "admin" || !user.emailVerificationCompletedAt) {
    return { ok: false as const, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { ok: true as const, session, user };
}
