import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

function secret() { return process.env.NEXTAUTH_SECRET || "development-only-secret"; }
function hashCode(code: string) { return crypto.createHmac("sha256", secret()).update("login:" + code).digest("hex"); }
function makeCode() { return crypto.randomInt(100000, 1000000).toString(); }

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

/**
 * Sends a one-time code required to complete a password-based login.
 * Called from the Credentials provider's authorize() after the password
 * itself has already checked out — this is the *second* factor, not a
 * replacement for the password.
 */
export async function issueLoginCode(userId: string, email: string) {
  const recent = await prisma.loginVerificationCode.findFirst({ where: { userId, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) return { sent: false, cooldown: true };

  const code = makeCode();
  await prisma.loginVerificationCode.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.loginVerificationCode.create({ data: { userId, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });

  const transport = getTransport();
  if (!transport) {
    // No SMTP configured (e.g. local dev without real credentials yet) —
    // print the code instead of failing, so login still works end to end.
    console.log(`\n[dev] Login verification code for ${email}: ${code}\n`);
    return { sent: true, cooldown: false };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) throw new Error("SMTP_FROM or SMTP_USER is required.");
  await transport.sendMail({
    from,
    to: email,
    subject: "Your James AI login code",
    text: `Your James AI login code is ${code}. It expires in 10 minutes. If you did not try to log in, change your password immediately.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Confirm it's you</h2><p>Enter this code to finish signing in to James AI:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 0">${code}</div><p>This code expires in 10 minutes. If you didn't just try to log in, change your password immediately.</p></div>`,
  });
  return { sent: true, cooldown: false };
}

export async function verifyLoginCode(userId: string, rawCode: string) {
  const code = rawCode.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "invalid" as const };
  const record = await prisma.loginVerificationCode.findFirst({ where: { userId, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!record || record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" as const };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" as const };
  if (hashCode(code) !== record.codeHash) {
    await prisma.loginVerificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "invalid" as const };
  }
  await prisma.loginVerificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return { ok: true as const };
}
