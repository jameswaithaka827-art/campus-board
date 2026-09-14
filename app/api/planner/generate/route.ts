import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { consumeAiUsage, refundAiUsage } from "@/lib/ai-usage";
import { parseBlockInput, ValidBlockInput } from "@/lib/schedule-validation";
import { generateJson } from "@/lib/ai-client";

const MAX_DESCRIPTION_CHARS = 4_000;
const MAX_BLOCKS = 40; // a generous cap — a full week rarely needs more than this

const SYSTEM_PROMPT = `You turn a rough, free-text description of someone's week into a structured
weekly timetable. Return only the requested structured data. Put the timetable in a
"blocks" array. Only include activities the person actually implies — do not invent
extra activities to fill the week. If a time isn't stated, make a reasonable estimate
rather than omitting the block entirely. Keep titles short and concrete. Set notify=true
only when the person explicitly asks for a reminder; otherwise use false.`;

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`planner-generate:${session.user.id}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Slow down a bit — too many requests." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Shares the same free-tier budget as chat/notes — same underlying API cost.
  const isSubscribed = user.subscriptionStatus === "active";
  const usage = await consumeAiUsage(user.id, isSubscribed);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Free plan limit reached", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  const { description } = await req.json();
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return NextResponse.json(
      { error: `description must be under ${MAX_DESCRIPTION_CHARS} characters` },
      { status: 400 }
    );
  }

  try {
    const raw = await generateJson({
      instructions: SYSTEM_PROMPT,
      input: description,
      maxOutputTokens: 2048,
      schema: {
        name: "weekly_schedule",
        schema: {
          type: "object",
          properties: {
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "integer", minimum: 0, maximum: 6 },
                  startTime: { type: "string" },
                  endTime: { type: "string" },
                  title: { type: "string", maxLength: 200 },
                  category: { type: "string", maxLength: 50 },
                  notify: { type: "boolean" },
                },
                required: ["day", "startTime", "endTime", "title", "category", "notify"],
                additionalProperties: false,
              },
            },
          },
          required: ["blocks"],
          additionalProperties: false,
        },
      },
    });

    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      await refundAiUsage(user.id);
      return NextResponse.json(
        { error: "Couldn't parse a schedule from that description — try rephrasing." },
        { status: 502 }
      );
    }

    if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as { blocks?: unknown }).blocks)) {
      await refundAiUsage(user.id);
      return NextResponse.json(
        { error: "Couldn't parse a schedule from that description — try rephrasing." },
        { status: 502 }
      );
    }

    const generatedBlocks = (parsed as { blocks: unknown[] }).blocks;

    // Re-validate every item the model produced with the exact same rules a
    // manually-submitted block has to pass — never trust model output as
    // pre-sanitized just because we asked nicely for JSON. Silently drop
    // anything malformed rather than fail the whole batch on one bad item.
    const blocks: ValidBlockInput[] = [];
    for (const item of generatedBlocks.slice(0, MAX_BLOCKS)) {
      const result = parseBlockInput(item);
      if (result.ok) blocks.push(result.value);
    }


    return NextResponse.json({ blocks });
  } catch (err) {
    await refundAiUsage(user.id);
    console.error(err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
