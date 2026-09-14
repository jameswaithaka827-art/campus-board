"use client";

import { useState } from "react";

const TIMEZONES = [
  ["Africa/Nairobi", "East Africa (Nairobi)"],
  ["Africa/Lagos", "West Africa (Lagos)"],
  ["Africa/Johannesburg", "South Africa (Johannesburg)"],
  ["Europe/London", "United Kingdom (London)"],
  ["Europe/Paris", "Central Europe (Paris)"],
  ["America/New_York", "US Eastern"],
  ["America/Chicago", "US Central"],
  ["America/Denver", "US Mountain"],
  ["America/Los_Angeles", "US Pacific"],
  ["Asia/Kolkata", "India (Kolkata)"],
  ["Asia/Singapore", "Singapore"],
  ["Australia/Sydney", "Australia (Sydney)"],
] as const;

export default function TimezoneSelector({ current }: { current: string }) {
  const [timeZone, setTimeZone] = useState(current || "Africa/Nairobi");
  const [status, setStatus] = useState("");

  async function save(value: string) {
    setTimeZone(value);
    setStatus("Saving...");
    const res = await fetch("/api/account/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone: value }),
    });
    setStatus(res.ok ? "Saved" : "Could not save");
    window.setTimeout(() => setStatus(""), 1800);
  }

  return (
    <div>
      <label className="block text-sm mb-1 text-white/70">Reminder timezone</label>
      <select
        value={timeZone}
        onChange={(e) => save(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:border-brand-500"
      >
        {TIMEZONES.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <p className="text-xs text-white/40 mt-2">
        Planner reminders use this timezone, so they follow the user's local clock.
      </p>
      {status && <p className="text-xs text-white/50 mt-2">{status}</p>}
    </div>
  );
}
