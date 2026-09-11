import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTeachingUser } from "@/lib/role-access";
import { assertSameOrigin } from "@/lib/request-security";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await requireTeachingUser(session.user.id); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const body = await req.json().catch(() => ({}));
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const published = body.published === true;
  const course = await prisma.course.findUnique({ where: { id, instructorId: session.user.id }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const result = await prisma.lesson.updateMany({ where: { id: lessonId, courseId: id }, data: { published } });
  if (!result.count) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  return NextResponse.json({ published });
}
