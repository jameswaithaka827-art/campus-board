import { NextRequest, NextResponse } from "next/server";

/**
 * Browser-origin guard for state-changing API requests.
 * This is a defense-in-depth layer; it does not replace authentication,
 * authorization, same-site cookies, or server-side input validation.
 */
export function assertSameOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return { ok: true as const };

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return { ok: true as const };

  try {
    const url = new URL(origin);
    if (url.host !== host) {
      return { ok: false as const, reason: "Cross-origin mutation blocked." };
    }
  } catch {
    return { ok: false as const, reason: "Invalid request origin." };
  }
  return { ok: true as const };
}

/**
 * Same check as assertSameOrigin, but returns a ready-to-send response
 * directly: null when the request is fine to proceed, or a 403
 * NextResponse when it should be blocked. Lets callers write
 * `const blocked = enforceSameOrigin(req); if (blocked) return blocked;`
 * instead of unpacking `.ok` themselves.
 */
export function enforceSameOrigin(req: NextRequest): NextResponse | null {
  const result = assertSameOrigin(req);
  if (result.ok) return null;
  return NextResponse.json({ error: result.reason }, { status: 403 });
}
