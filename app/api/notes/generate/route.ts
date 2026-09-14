import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleConfig } from "@/lib/roles";
import { rateLimit } from "@/lib/rate-limit";
import { generateText } from "@/lib/ai-client";
import { consumeAiUsage, refundAiUsage } from "@/lib/ai-usage";
import { getEntitlements } from "@/lib/entitlements";

const MAX_ROUGH_NOTES_CHARS = 8_000;

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`notes-generate:${session.user.id}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Slow down a bit — too many requests." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // AI drafting shares the same free-tier budget as regular chat — it's the
  // same underlying API cost, so it shouldn't be a way around the limit.
  // (Was previously checking subscriptionStatus === "active" directly here,
  // which silently disagreed with /api/chat's use of getEntitlements —
  // "trialing" users got pro limits in chat but free limits here.)
  const ent = getEntitlements(user.subscriptionStatus);
  const usage = await consumeAiUsage(user.id, ent.isPro);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Free plan limit reached", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  const { roughNotes } = await req.json();
  if (!roughNotes || typeof roughNotes !== "string") {
    return NextResponse.json({ error: "roughNotes is required" }, { status: 400 });
  }
  if (roughNotes.length > MAX_ROUGH_NOTES_CHARS) {
    return NextResponse.json(
      { error: `roughNotes must be under ${MAX_ROUGH_NOTES_CHARS} characters` },
      { status: 400 }
    );
  }

  const config = getRoleConfig(user.role);

  try {
    const draft = await generateText({
      maxOutputTokens: 1024,
      instructions: config.systemHint,
      input: roughNotes,
    });


    return NextResponse.json({ draft });
  } catch (err) {
    await refundAiUsage(user.id);
    console.error(err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
