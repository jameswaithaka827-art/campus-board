import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

function secret() { return process.env.NEXTAUTH_SECRET || "development-only-secret"; }
function hashCode(code: string) { return crypto.createHmac("sha256", secret()).update(code).digest("hex"); }
function makeCode() { return crypto.randomInt(100000, 1000000).toString(); }

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function issueEmailVerificationCode(userId: string, email: string) {
  const recent = await prisma.emailVerificationCode.findFirst({ where: { userId, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) return { sent: false, cooldown: true };

  const code = makeCode();
  await prisma.emailVerificationCode.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.emailVerificationCode.create({ data: { userId, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });

  const transport = getTransport();
  if (!transport) {
    // No SMTP configured (e.g. local dev without real credentials yet) —
    // print the code instead of failing, so sign-up still works end to end.
    console.log(`\n[dev] Email verification code for ${email}: ${code}\n`);
    return { sent: true, cooldown: false };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) throw new Error("SMTP_FROM or SMTP_USER is required.");
  await transport.sendMail({
    from,
    to: email,
    subject: "Your James AI verification code",
    text: `Your James AI verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Verify your James AI account</h2><p>Use this code to finish setting up your account:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 0">${code}</div><p>This code expires in 10 minutes. Never share it with anyone.</p></div>`,
  });
  return { sent: true, cooldown: false };
}

export async function verifyEmailCode(userId: string, rawCode: string) {
  const code = rawCode.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "invalid" as const };
  const record = await prisma.emailVerificationCode.findFirst({ where: { userId, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!record || record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" as const };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" as const };
  if (hashCode(code) !== record.codeHash) {
    await prisma.emailVerificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "invalid" as const };
  }
  await prisma.$transaction([
    prisma.emailVerificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { emailVerificationCompletedAt: new Date(), accountStatus: "active" } }),
  ]);
  return { ok: true as const };
}
