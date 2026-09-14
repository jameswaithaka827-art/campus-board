import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTeachingUser } from "@/lib/role-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await requireTeachingUser(session.user.id); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const courses = await prisma.course.findMany({ where: { instructorId: session.user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { lessons: true, enrollments: true, liveClasses: true } } } });
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await requireTeachingUser(session.user.id); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 120) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "";
  if (!title || !subject || !description) return NextResponse.json({ error: "Title, subject and description are required." }, { status: 400 });
  const course = await prisma.course.create({ data: { instructorId: session.user.id, title, subject, description } , include: { _count: { select: { lessons: true, enrollments: true, liveClasses: true } } } });
  return NextResponse.json({ course }, { status: 201 });
}
