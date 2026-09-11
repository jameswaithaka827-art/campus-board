import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { streamPrivateBlob } from "@/lib/private-storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const verification = await prisma.schoolIdVerification.findUnique({ where: { id }, select: { documentPath: true, status: true } });
  if (!verification || verification.status !== "pending") {
    return NextResponse.json({ error: "Verification document unavailable" }, { status: 404 });
  }
  return streamPrivateBlob(verification.documentPath, "image/jpeg");
}
