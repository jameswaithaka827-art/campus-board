import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { requireEnv } from "@/lib/env";

/**
 * School ID documents and community post photos live in a SEPARATE Vercel
 * Blob store from avatars, created with private access. Vercel Blob fixes
 * a store's access mode (public or private) at creation time — you can't
 * mix both in one store — so this can't share the store/token used for the
 * existing public avatar uploads.
 *
 * Private blobs require authentication for every read, not just an
 * unguessable URL: even if a stored URL ever leaked (server logs, a DB
 * export, a network inspector during upload), it's useless without this
 * token. Set BLOB_PRIVATE_READ_WRITE_TOKEN from a private-access store in
 * your Vercel dashboard's Storage tab — see .env.example.
 */
export function privateBlobToken(): string {
  return requireEnv("BLOB_PRIVATE_READ_WRITE_TOKEN");
}

/**
 * Fetches a private blob server-side and streams it back as the route's
 * response. Used by every route that lets an authorized viewer (the
 * document's owner, or an admin) see a sensitive file — never expose the
 * stored URL to the browser directly for these.
 */
export async function streamPrivateBlob(
  urlOrPathname: string,
  contentType: string
): Promise<NextResponse> {
  try {
    const result = await get(urlOrPathname, { access: "private", token: privateBlobToken() });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return new NextResponse(result.stream, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Private blob read failed", error);
    return NextResponse.json({ error: "File unavailable" }, { status: 502 });
  }
}
