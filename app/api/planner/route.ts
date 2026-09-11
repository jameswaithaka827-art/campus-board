import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBlockInput } from "@/lib/schedule-validation";

// GET: this user's full weekly timetable, one row per recurring block.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocks = await prisma.scheduleBlock.findMany({
    where: { userId: session.user.id },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ blocks });
}

// POST: add one recurring block to the week (e.g. "Mon 09:00-10:30, Ward rounds").
export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = parseBlockInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const block = await prisma.scheduleBlock.create({
    data: { userId: session.user.id, ...parsed.value },
  });

  return NextResponse.json({ block });
}
