import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireActiveVerifiedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, role: true, accountStatus: true, emailVerificationCompletedAt: true } });
  if (!user || user.accountStatus !== "active" || !user.emailVerificationCompletedAt) {
    return { ok: false as const, response: NextResponse.json({ error: "Verified account required" }, { status: 403 }) };
  }
  return { ok: true as const, session, user };
}


export async function requireSchoolVerifiedUser() {
  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate;
  const user = await prisma.user.findUnique({ where: { id: gate.user.id }, select: { id: true, email: true, name: true, role: true, accountStatus: true, emailVerificationCompletedAt: true, schoolIdVerificationStatus: true, schoolIdVerifiedAt: true, avatarUrl: true } });
  if (!user || user.schoolIdVerificationStatus !== "approved" || !user.schoolIdVerifiedAt) {
    return { ok: false as const, response: NextResponse.json({ error: "School verification required", code: "SCHOOL_VERIFICATION_REQUIRED" }, { status: 403 }) };
  }
  return { ok: true as const, session: gate.session, user };
}
