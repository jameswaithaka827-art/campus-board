import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireEnv } from "@/lib/env";

// This key is not secret — it's meant to be public (it's how a browser
// verifies push messages came from your server) — but we still require
// login so an unauthenticated visitor can't probe whether push is set up.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ publicKey: requireEnv("VAPID_PUBLIC_KEY") });
}
