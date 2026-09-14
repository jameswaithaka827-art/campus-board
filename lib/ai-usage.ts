import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const FREE_AI_ACTION_LIMIT = 20;
export const PRO_AI_ACTION_LIMIT = 300;

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Resets the free AI counter when a new UTC calendar month begins, then
 * atomically reserves one AI action. Call refundAiUsage() when the AI call
 * fails so users aren't charged for errors.
 */
export async function consumeAiUsage(userId: string, subscribed: boolean) {
  const limit = subscribed ? PRO_AI_ACTION_LIMIT : FREE_AI_ACTION_LIMIT;
  const period = getCurrentPeriod();
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const current = await tx.user.findUnique({
      where: { id: userId },
      select: { chatMessageCount: true, chatUsageMonth: true },
    });

    if (!current) return { allowed: false, remaining: 0 };

    if (current.chatUsageMonth !== period) {
      await tx.user.update({
        where: { id: userId },
        data: { chatUsageMonth: period, chatMessageCount: 0 },
      });
    }

    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        chatUsageMonth: period,
        chatMessageCount: { lt: limit },
      },
      data: { chatMessageCount: { increment: 1 } },
    });

    if (updated.count !== 1) return { allowed: false, remaining: 0 };

    const after = await tx.user.findUnique({
      where: { id: userId },
      select: { chatMessageCount: true },
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - (after?.chatMessageCount ?? limit)),
    };
  });

  return result;
}

export async function refundAiUsage(userId: string) {
  const period = getCurrentPeriod();
  await prisma.user.updateMany({
    where: {
      id: userId,
      chatUsageMonth: period,
      chatMessageCount: { gt: 0 },
    },
    data: { chatMessageCount: { decrement: 1 } },
  });
}

export function getRemainingActions(count: number, period: string | null | undefined, limit: number) {
  if (period !== getCurrentPeriod()) return limit;
  return Math.max(0, limit - count);
}

export function getFreeRemaining(count: number, period: string | null | undefined) {
  return getRemainingActions(count, period, FREE_AI_ACTION_LIMIT);
}
