"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "", label: "General / not sure yet" },
  { value: "student", label: "Student / education" },
  { value: "doctor", label: "Doctor / healthcare" },
  { value: "teacher", label: "Teacher / education" },
  { value: "lecturer", label: "Lecturer / university" },
  { value: "business", label: "Business / workplace" },
  { value: "gym", label: "Gym / personal trainer" },
];

export default function RoleSelector({ currentRole }: { currentRole: string | null }) {
  const [role, setRole] = useState(currentRole ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function save(newRole: string) {
    setRole(newRole);
    setSaving(true);
    setError("");
    const res = await fetch("/api/account/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update role.");
      setRole(currentRole ?? "");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        value={role}
        onChange={(e) => save(e.target.value)}
        disabled={saving}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
