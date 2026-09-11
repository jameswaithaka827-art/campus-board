import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const WINDOW_MINUTES = 5;

function localClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return {
    day: weekdayMap[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function localDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

function blockOffsetMinutes(currentDay: number, currentMinutes: number, blockDay: number, blockMinutes: number) {
  const dayDelta = (blockDay - currentDay + 7) % 7;
  return dayDelta * 24 * 60 + blockMinutes - currentMinutes;
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocks = await prisma.scheduleBlock.findMany({
    where: { notify: true },
    include: { user: { select: { timeZone: true } } },
  });

  const now = new Date();
  let checked = 0;
  let sent = 0;

  for (const block of blocks) {
    checked += 1;
    const timeZone = block.user.timeZone || "Africa/Nairobi";
    const clock = localClock(now, timeZone);
    const [hours, minutes] = block.startTime.split(":").map(Number);
    const blockMinutes = hours * 60 + minutes;
    const dueIn = blockOffsetMinutes(clock.day, clock.minutes, block.day, blockMinutes);
    if (dueIn < 0 || dueIn >= WINDOW_MINUTES) continue;

    const today = localDateKey(now, timeZone);
    const alreadyNotifiedToday = block.lastNotifiedAt && localDateKey(block.lastNotifiedAt, timeZone) === today;
    if (alreadyNotifiedToday) continue;

    const result = await sendPushToUser(block.userId, {
      title: block.title,
      body: `Starting at ${block.startTime}${block.category ? ` · ${block.category}` : ""}`,
      url: "/dashboard/planner",
    });

    if (result.sent > 0) {
      await prisma.scheduleBlock.update({ where: { id: block.id }, data: { lastNotifiedAt: now } });
      sent += 1;
    }
  }

  return NextResponse.json({ checked, sent });
}
