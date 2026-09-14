import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: list this user's time entries, most recent first.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ entries });
}

// POST: start a new timer for a task. Fails if one is already running,
// since tracking two tasks "at once" isn't meaningful for a simple tracker.
export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskName } = await req.json();
  if (!taskName || typeof taskName !== "string") {
    return NextResponse.json({ error: "taskName is required" }, { status: 400 });
  }
  if (taskName.length > 200) {
    return NextResponse.json({ error: "taskName must be under 200 characters" }, { status: 400 });
  }

  const running = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, endedAt: null },
  });
  if (running) {
    return NextResponse.json(
      { error: "A timer is already running. Stop it before starting a new one." },
      { status: 409 }
    );
  }

  const entry = await prisma.timeEntry.create({
    data: { userId: session.user.id, taskName },
  });

  return NextResponse.json({ entry });
}

// PATCH: stop the currently running timer.
export async function PATCH(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const running = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, endedAt: null },
  });
  if (!running) {
    return NextResponse.json({ error: "No timer is running." }, { status: 404 });
  }

  const entry = await prisma.timeEntry.update({
    where: { id: running.id },
    data: { endedAt: new Date() },
  });

  return NextResponse.json({ entry });
}
