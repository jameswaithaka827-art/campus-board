import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const TTL_MS = 15 * 60_000;
const RESET_COOLDOWN_MS = 60_000;

function secret() { return process.env.NEXTAUTH_SECRET || "development-only-secret"; }
function hashToken(token: string) { return crypto.createHmac("sha256", secret()).update(token).digest("hex"); }
function randomToken() { return crypto.randomBytes(32).toString("base64url"); }

function transport() {
  const host = process.env.SMTP_HOST, user = process.env.SMTP_USER, pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new Error("Email delivery is not configured.");
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function issuePasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.accountStatus !== "active" || !user.googleId || !user.emailVerifiedAt || !user.emailVerificationCompletedAt) return { ok: true as const };
  const recent = await prisma.passwordResetToken.findFirst({ where: { userId: user.id, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (recent && Date.now() - recent.createdAt.getTime() < RESET_COOLDOWN_MS) return { ok: true as const, cooldown: true as const };

  const token = randomToken();
  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TTL_MS) } });
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${base}/account/reset-password?token=${encodeURIComponent(token)}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport().sendMail({ from, to: user.email, subject: "Reset your James AI password", text: `Reset your James AI password using this link: ${url}. It expires in 15 minutes.`, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Reset your James AI password</h2><p>This link expires in 15 minutes.</p><p><a href="${url}">Reset password</a></p><p>Never share reset links with anyone.</p></div>` });
  return { ok: true as const };
}

export async function consumePasswordReset(token: string, newPasswordHash: string) {
  const record = await prisma.passwordResetToken.findFirst({ where: { tokenHash: hashToken(token), usedAt: null }, include: { user: true } });
  if (!record || record.expiresAt.getTime() < Date.now() || record.user.accountStatus !== "active") return { ok: false as const };
  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newPasswordHash, passwordUpdatedAt: new Date(), sessionVersion: { increment: 1 } } }),
  ]);
  return { ok: true as const, userId: record.userId };
}
