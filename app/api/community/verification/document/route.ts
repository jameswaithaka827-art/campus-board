import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { streamPrivateBlob } from "@/lib/private-storage";

// Lets a student view the school ID they submitted — previously only admins
// could see it at all, even the person who uploaded it. Only works while
// their verification is still pending, matching the admin viewer's same
// constraint (schoolIdDocumentPath is cleared once a decision is made).
export async function GET() {
  const g = await requireActiveVerifiedUser();
  if (!g.ok) return g.response;
  const user = await prisma.user.findUnique({
    where: { id: g.user.id },
    select: { schoolIdDocumentPath: true, schoolIdVerificationStatus: true },
  });
  if (!user?.schoolIdDocumentPath || user.schoolIdVerificationStatus !== "pending") {
    return NextResponse.json({ error: "No pending submission to view" }, { status: 404 });
  }
  return streamPrivateBlob(user.schoolIdDocumentPath, "image/jpeg");
}
