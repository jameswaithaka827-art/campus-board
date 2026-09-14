import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { consumeAiUsage, refundAiUsage } from "@/lib/ai-usage";
import { generateVisionText } from "@/lib/ai-client";
import { getEntitlements } from "@/lib/entitlements";

const MAX_IMAGES = 4;
const MAX_DATA_URL_CHARS = 1_600_000;
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(`vision:${session.user.id}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many image requests. Please wait a moment." }, { status: 429 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const ent = getEntitlements(user.subscriptionStatus);
  const body = await req.json().catch(() => ({}));
  const images = Array.isArray(body.images) ? body.images.filter((x: unknown) => typeof x === "string") as string[] : [];
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "Describe and explain these study images clearly.";
  if (!images.length || images.length > Math.min(MAX_IMAGES, ent.maxChatImages)) return NextResponse.json({ error: `You can attach up to ${Math.min(MAX_IMAGES, ent.maxChatImages)} image${Math.min(MAX_IMAGES, ent.maxChatImages)===1?'':'s'} on your plan.` }, { status: 400 });
  if (images.some(x => x.length > MAX_DATA_URL_CHARS || !IMAGE_RE.test(x))) return NextResponse.json({ error: "One or more images are invalid or too large. Please use JPG, PNG, or WebP images." }, { status: 400 });
  const usage = await consumeAiUsage(user.id, ent.isPro); if (!usage.allowed) return NextResponse.json({ error: "Free plan limit reached", upgradeUrl: "/pricing" }, { status: 402 });
  try { const reply = await generateVisionText({ prompt, images, maxOutputTokens: 1200, instructions: "You are James AI, an education assistant. Analyze the supplied study images accurately. Do not claim to read text that is not visible. When useful, turn diagrams or handwritten notes into clear explanations." }); return NextResponse.json({ reply, remainingFree: ent.isPro ? null : usage.remaining }); }
  catch (error) { await refundAiUsage(user.id); const message = error instanceof Error && error.message === "IMAGE_AI_REQUIRES_OPENAI" ? "Image analysis currently requires the OpenAI provider." : "Image analysis failed."; return NextResponse.json({ error: message }, { status: 500 }); }
}
