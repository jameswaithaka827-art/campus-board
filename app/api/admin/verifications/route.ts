import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { privateBlobToken } from "@/lib/private-storage";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { enforceSameOrigin } from "@/lib/request-security";

export async function GET() {
  const gate = await requireAdmin(); if (!gate.ok) return gate.response;
  const verifications = await prisma.schoolIdVerification.findMany({ where: { status: "pending" }, orderBy: { submittedAt: "asc" }, take: 100, include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } } });
  return NextResponse.json({ verifications });
}
export async function PATCH(req: NextRequest) {
  const origin = enforceSameOrigin(req); if (origin) return origin;
  const gate = await requireAdmin(); if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
  if (!id || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "Invalid verification action" }, { status: 400 });
  const verification = await prisma.schoolIdVerification.findUnique({ where: { id } });
  if (!verification || verification.status !== "pending") return NextResponse.json({ error: "Pending verification not found" }, { status: 404 });
  if (action === "reject" && !reason) return NextResponse.json({ error: "Add a rejection reason." }, { status: 400 });
  const now = new Date();
  if (action === "approve") {
    await prisma.$transaction([
      prisma.schoolIdVerification.update({ where: { id }, data: { status: "approved", reviewedAt: now, reviewedById: gate.user.id, rejectionReason: null } }),
      prisma.user.update({ where: { id: verification.userId }, data: { schoolIdVerificationStatus: "approved", schoolIdReviewedAt: now, schoolIdRejectionReason: null, schoolIdVerifiedAt: now, schoolIdDocumentPath: null } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.schoolIdVerification.update({ where: { id }, data: { status: "rejected", reviewedAt: now, reviewedById: gate.user.id, rejectionReason: reason } }),
      prisma.user.update({ where: { id: verification.userId }, data: { schoolIdVerificationStatus: "rejected", schoolIdReviewedAt: now, schoolIdRejectionReason: reason, schoolIdVerifiedAt: null, schoolIdDocumentPath: null } }),
    ]);
  }
  try { await del(verification.documentPath, { token: privateBlobToken() }); } catch {}
  await prisma.adminAuditLog.create({ data: { adminUserId: gate.user.id, action: `school_verification:${action}`, targetUserId: verification.userId, metadata: JSON.stringify({ verificationId: id, reason: reason || null }) } });
  return NextResponse.json({ ok: true });
}
