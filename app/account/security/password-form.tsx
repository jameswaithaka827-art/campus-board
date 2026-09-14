"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  const symbols = "!@#$%^&*_-+=?";
  const all = upper + lower + nums + symbols;
  const values = new Uint32Array(24);
  crypto.getRandomValues(values);
  const chars = [
    upper[values[0] % upper.length],
    lower[values[1] % lower.length],
    nums[values[2] % nums.length],
    symbols[values[3] % symbols.length],
  ];
  for (let i = 4; i < 24; i++) chars.push(all[values[i] % all.length]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = values[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function PasswordForm({ hasExistingPassword = false }: { hasExistingPassword?: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const score = useMemo(() => {
    let n = 0;
    if (password.length >= 14) n++;
    if (/[A-Z]/.test(password)) n++;
    if (/[a-z]/.test(password)) n++;
    if (/\d/.test(password)) n++;
    if (/[^A-Za-z0-9]/.test(password)) n++;
    return n;
  }, [password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, password, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not save password.");
      return;
    }
    setSaved(true);
    setTimeout(() => router.push(data.sessionRevoked ? "/login?changed=1" : "/dashboard"), 700);
  }

  function generate() {
    const next = generatePassword();
    setPassword(next);
    setConfirmPassword(next);
    setSaved(false);
    setError("");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{hasExistingPassword ? "Change your James AI password" : "Create your James AI password"}</p>
            <p className="text-sm text-white/50 mt-1">{hasExistingPassword ? "Enter your current password before changing it." : "Google verifies your identity first. This password gives you a second sign-in method."}</p>
          </div>
          <button type="button" onClick={generate} className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5">Generate strong password</button>
        </div>
      </div>

      {hasExistingPassword && (
        <div>
          <label className="block text-sm text-white/70 mb-2">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-brand-500" required />
        </div>
      )}

      <div>
        <label className="block text-sm text-white/70 mb-2">New password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-brand-500" required />
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-brand-500 transition-all" style={{ width: `${(score / 5) * 100}%` }} /></div>
        <p className="text-xs text-white/40 mt-2">Use at least 14 characters with uppercase, lowercase, numbers and symbols.</p>
      </div>

      <div>
        <label className="block text-sm text-white/70 mb-2">Confirm password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-brand-500" required />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-emerald-400">Password saved. Opening your dashboard…</p>}

      <button disabled={score < 5 || password !== confirmPassword} className="w-full rounded-xl bg-brand-600 py-3 font-semibold disabled:opacity-40">Save secure password</button>
    </form>
  );
}
