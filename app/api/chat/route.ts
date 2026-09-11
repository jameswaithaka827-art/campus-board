import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { consumeAiUsage, refundAiUsage, FREE_AI_ACTION_LIMIT } from "@/lib/ai-usage";
import { generateText, generateVisionText } from "@/lib/ai-client";
import { getEntitlements } from "@/lib/entitlements";

const MAX_MESSAGE_CHARS = 8_000;
const MAX_HISTORY_TURNS = 40;
const MAX_IMAGES = 4;
const MAX_IMAGE_CHARS = 1_600_000;
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = rateLimit(`chat:${session.user.id}`, 20, 60_000);
  if (!allowed) return NextResponse.json({ error: "Slow down a bit — too many requests." }, { status: 429 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const ent = getEntitlements(user.subscriptionStatus);

  const body = await req.json().catch(() => ({}));
  const newMessageContent = typeof body?.message === "string" ? body.message.trim() : "";
  const requestedWebSearch = body?.webSearch === true;
  const webSearch = requestedWebSearch && ent.webSearch;
  const images = Array.isArray(body?.images) ? body.images.filter((x: unknown) => typeof x === "string") as string[] : [];

  if (!newMessageContent && images.length === 0) return NextResponse.json({ error: "Message or image is required." }, { status: 400 });
  if (newMessageContent.length > MAX_MESSAGE_CHARS) return NextResponse.json({ error: `message must be under ${MAX_MESSAGE_CHARS} characters` }, { status: 400 });
  if (images.length > Math.min(MAX_IMAGES, ent.maxChatImages)) return NextResponse.json({ error: `Your plan allows up to ${Math.min(MAX_IMAGES, ent.maxChatImages)} image${Math.min(MAX_IMAGES, ent.maxChatImages) === 1 ? "" : "s"} per message.` }, { status: 400 });
  if (images.some(x => x.length > MAX_IMAGE_CHARS || !IMAGE_RE.test(x))) return NextResponse.json({ error: "One or more images are invalid or too large." }, { status: 400 });

  const usage = await consumeAiUsage(user.id, ent.isPro);
  if (!usage.allowed) return NextResponse.json({ error: "Free plan limit reached", upgradeUrl: "/pricing" }, { status: 402 });

  const priorHistory = await prisma.chatMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: MAX_HISTORY_TURNS });
  priorHistory.reverse();

  const displayMessage = newMessageContent || `[${images.length} image attachment${images.length === 1 ? "" : "s"}]`;
  await prisma.chatMessage.create({ data: { userId: user.id, role: "user", content: displayMessage } });

  try {
    let reply: string;
    if (images.length) {
      const history = priorHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");
      reply = await generateVisionText({
        maxOutputTokens: 1200,
        instructions: "You are James AI, an education assistant. Analyze study images accurately. Do not invent details that are not visible. Explain diagrams, screenshots, handwritten notes or textbook pages in a clear study-friendly way.",
        prompt: `${history}\nuser: ${newMessageContent || "Please analyze these images and help me understand them."}`,
        images,
      });
    } else {
      reply = await generateText({
        maxOutputTokens: 1024,
        instructions: "You are a friendly AI assistant for a student/community education app. Help with learning, planning, writing and organization. Be accurate and honest about uncertainty. " + (webSearch ? "Use web search for current or time-sensitive facts." : "Do not claim to have checked the live web."),
        webSearch,
        input: [
          ...priorHistory.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: newMessageContent },
        ],
      });
    }

    await prisma.chatMessage.create({ data: { userId: user.id, role: "assistant", content: reply } });
    return NextResponse.json({ reply, remainingFree: ent.isPro ? null : usage.remaining, freeLimit: ent.isPro ? null : FREE_AI_ACTION_LIMIT });
  } catch (err) {
    await refundAiUsage(user.id);
    console.error(err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const history = await prisma.chatMessage.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  history.reverse();
  return NextResponse.json({ messages: history.map((m: { role: string; content: string; createdAt: Date }) => ({ role: m.role, content: m.content, createdAt: m.createdAt })) });
}
