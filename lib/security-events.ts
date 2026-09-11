import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

function hash(value: string) {
  const secret = process.env.NEXTAUTH_SECRET || "development-only-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function recordSecurityEvent(input: { userId?: string | null; type: string; ip?: string | null; userAgent?: string | null }) {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: input.userId ?? null,
        type: input.type.slice(0, 120),
        ipHash: input.ip ? hash(input.ip) : null,
        userAgent: input.userAgent ? input.userAgent.slice(0, 500) : null,
      },
    });
  } catch (error) {
    console.error("Security event logging failed", error);
  }
}
