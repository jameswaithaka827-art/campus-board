// Marketplace photos are stored in the same dedicated PRIVATE Vercel Blob
// store as school ID documents and community photos (access:'private') —
// viewing goes through the authenticated proxy at [id]/image, matching the
// community posts pattern, since GET /api/marketplace itself already
// requires requireActiveVerifiedUser — listings are meant to be visible to
// verified members, not the open internet, and the underlying photos
// should enforce that too, not just the API that lists them.
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { privateBlobToken } from "@/lib/private-storage";
import { requireActiveVerifiedUser } from "@/lib/require-user";
import { assertSameOrigin } from "@/lib/request-security";

const MAX_FILES = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });

  const gate = await requireActiveVerifiedUser();
  if (!gate.ok) return gate.response;

  const form = await req.formData().catch(() => null);
  const files = form?.getAll("files").filter((x): x is File => x instanceof File) || [];
  if (!files.length) return NextResponse.json({ error: "Choose photos to upload." }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} photos per listing.` }, { status: 400 });
  }

  const urls: string[] = [];
  for (const f of files) {
    if (f.type !== "image/jpeg" && f.type !== "image/png" && f.type !== "image/webp") {
      return NextResponse.json({ error: "Photos must be JPG, PNG, or WebP." }, { status: 400 });
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each photo must be 8 MB or smaller." }, { status: 400 });
    }
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`marketplace/${gate.user.id}/${crypto.randomUUID()}.${ext}`, f, {
      access: "private",
      addRandomSuffix: false,
      token: privateBlobToken(),
    });
    urls.push(blob.url);
  }

  return NextResponse.json({ images: urls });
}
