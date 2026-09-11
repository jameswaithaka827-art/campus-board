"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function GoogleSignInButton({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => { setLoading(true); void signIn("google", { callbackUrl }); }}
      className="w-full rounded-xl border border-white/15 bg-white text-black py-3 font-semibold hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-3"
    >
      <span className="grid place-items-center h-6 w-6 rounded-full bg-white border border-black/10 text-sm font-bold">G</span>
      {loading ? "Connecting to Google…" : "Continue with Google"}
    </button>
  );
}
