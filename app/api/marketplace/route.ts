import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/request-security";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { MARKETPLACE_CATEGORIES as CATEGORIES } from "@/lib/marketplace";

const CONDITIONS = ["new", "like_new", "good", "fair", "refurbished"];
const SERVICE_TYPES = ["salon", "barber", "laundry", "tutoring", "repair", "photography", "cleaning", "other"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks", "drinks", "baked"];
const MAX_IMAGES = 6;

export async function GET(req: NextRequest) {
  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const category = req.nextUrl.searchParams.get("category");
  const where: { status: string; category?: string } = { status: "active" };
  if (category && CATEGORIES.includes(category)) where.category = category;

  // Boosted listings surface first (by tier, then recency), then everything else by recency.
  const listings = await prisma.marketplaceListing.findMany({
    where,
    orderBy: [{ boostTier: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { seller: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const now = new Date();
  const shaped = listings.map((l: typeof listings[number]) => ({
    ...l,
    images: JSON.parse(l.images || "[]"),
    isBoosted: !!(l.boostTier && l.boostExpiresAt && l.boostExpiresAt > now),
  }));

  return NextResponse.json({ listings: shaped, categories: CATEGORIES });
}

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 100) : "";
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 700) : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  if (!title || !description || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Title, description, and a valid category are required." }, { status: 400 });
  }

  const priceKsh = body?.priceKsh == null ? null : Math.max(0, Math.min(5_000_000, Math.floor(Number(body.priceKsh) || 0)));
  const condition = CONDITIONS.includes(body?.condition) ? body.condition : null;
  const serviceType = category === "services" && SERVICE_TYPES.includes(body?.serviceType) ? body.serviceType : null;
  const mealType = category === "food" && MEAL_TYPES.includes(body?.mealType) ? body.mealType : null;

  const images = Array.isArray(body?.images)
    ? body.images.filter((u: unknown): u is string => typeof u === "string").slice(0, MAX_IMAGES)
    : [];
  // Without this, the client could submit any URL as a "listing photo" —
  // bypassing the upload route's own file-type/size checks entirely, and
  // potentially embedding third-party content (or a tracking pixel) dressed
  // up as a product photo. Only accept URLs that actually point to this
  // app's own blob storage.
  if (images.some((u: string) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com");
    } catch {
      return true;
    }
  })) {
    return NextResponse.json({ error: "Invalid image reference." }, { status: 400 });
  }

  const listing = await prisma.marketplaceListing.create({
    data: {
      sellerId: gate.user.id,
      title,
      description,
      category,
      priceKsh,
      condition,
      serviceType,
      mealType,
      images: JSON.stringify(images),
    },
  });

  return NextResponse.json({ listing: { ...listing, images } }, { status: 201 });
}
