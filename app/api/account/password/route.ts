import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStrongPassword, passwordError } from "@/lib/password-policy";
import { rateLimit } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = rateLimit(`password:${session.user.id}`, 5, 15 * 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many password attempts. Try again later." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const currentPassword = typeof (body as any)?.currentPassword === "string" ? (body as any).currentPassword : "";
  const password = typeof (body as any)?.password === "string" ? (body as any).password : "";
  const confirmPassword = typeof (body as any)?.confirmPassword === "string" ? (body as any).confirmPassword : "";

  if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  const error = passwordError(password);
  if (error || !isStrongPassword(password)) return NextResponse.json({ error }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, accountStatus: true, passwordHash: true, sessionVersion: true } });
  if (!user || user.accountStatus !== "active") return NextResponse.json({ error: "Account is not active." }, { status: 403 });

  // Changing an existing password requires re-authentication. Initial setup
  // is allowed because Google verification established the account identity.
  if (user.passwordHash) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordUpdatedAt: new Date(),
      sessionVersion: user.passwordHash ? { increment: 1 } : undefined,
    },
  });
  await recordSecurityEvent({ userId: user.id, type: user.passwordHash ? "password_changed" : "password_created" });
  return NextResponse.json({ saved: true, sessionRevoked: Boolean(user.passwordHash) });
}
