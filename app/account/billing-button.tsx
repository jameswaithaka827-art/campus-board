"use client";

import { useState } from "react";

export default function BillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
    >
      {loading ? "Opening..." : "Manage billing"}
    </button>
  );
}
