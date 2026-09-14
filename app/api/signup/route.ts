import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) return NextResponse.json({ error: origin.reason }, { status: 403 });
  return NextResponse.json(
    {
      error:
        "New James AI accounts must be verified with Google. Use 'Continue with Google' so we can confirm the Google account before creating your account.",
    },
    { status: 403 }
  );
}
