import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const [paidAgg, pendingAgg, failedAgg, activePro, recent] = await Promise.all([
    prisma.paymentTransaction.aggregate({ _sum: { amountKsh: true }, where: { status: "paid" } }),
    prisma.paymentTransaction.aggregate({ _sum: { amountKsh: true }, where: { status: "pending" } }),
    prisma.paymentTransaction.aggregate({ _sum: { amountKsh: true }, where: { status: "failed" } }),
    prisma.user.count({ where: { subscriptionStatus: { in: ["active", "trialing"] } } }),
    prisma.paymentTransaction.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true, name: true } } } }),
  ]);
  return NextResponse.json({ grossPaidKsh: paidAgg._sum.amountKsh || 0, pendingKsh: pendingAgg._sum.amountKsh || 0, failedKsh: failedAgg._sum.amountKsh || 0, activePro, recent });
}
