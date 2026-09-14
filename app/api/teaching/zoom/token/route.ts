import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const liveClassId = typeof body.liveClassId === "string" ? body.liveClassId : "";
  if (!liveClassId) return NextResponse.json({ error: "liveClassId is required" }, { status: 400 });
  if (!process.env.ZOOM_VIDEO_SDK_KEY || !process.env.ZOOM_VIDEO_SDK_SECRET) return NextResponse.json({ error: "Zoom Video SDK is not configured yet." }, { status: 503 });

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!liveClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const isHost = liveClass.course.instructorId === session.user.id && ["lecturer", "teacher", "admin"].includes(session.user.role || "");
  const enrollment = !isHost
    ? await prisma.courseEnrollment.findUnique({ where: { courseId_userId: { courseId: liveClass.courseId, userId: session.user.id } } })
    : null;
  if (!isHost && !enrollment) return NextResponse.json({ error: "Enroll in the course before joining this class." }, { status: 403 });

  const sessionName = liveClass.zoomSessionName || `jamesai_${liveClass.id}`;
  const role = isHost ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { app_key: process.env.ZOOM_VIDEO_SDK_KEY, tpc: sessionName, role, iat: now, exp: now + 60 * 60 },
    process.env.ZOOM_VIDEO_SDK_SECRET,
    { algorithm: "HS256" }
  );
  return NextResponse.json({ token, sessionName, role, expiresIn: 3600 });
}
