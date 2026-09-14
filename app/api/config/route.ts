import { NextResponse } from "next/server";
import { isFreeMode } from "@/lib/entitlements";

// Public, read-only — lets client components (like the pricing page) know
// whether to show real checkout flows or "everything is free" messaging,
// without duplicating the FREE_MODE check in multiple places.
export async function GET() {
  return NextResponse.json({ freeMode: isFreeMode() });
}
