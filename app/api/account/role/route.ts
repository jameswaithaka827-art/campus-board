import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAllowedLecturerDomain } from "@/lib/google-policy";

const VALID_ROLES = ["student", "doctor", "teacher", "lecturer", "business", "gym"];

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();
  const safeRole = VALID_ROLES.includes(role) ? role : null;

  const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (safeRole === "lecturer" && (!current || !isAllowedLecturerDomain(current.email))) {
    return NextResponse.json({ error: "Lecturer access requires an approved institution Google account." }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { role: safeRole },
  });

  return NextResponse.json({ role: user.role });
}
