"use client";

import { useEffect, useState } from "react";

type TimeEntry = {
  id: string;
  taskName: string;
  startedAt: string;
  endedAt: string | null;
};

function formatDuration(startedAt: string, endedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const totalSeconds = Math.floor((end - start) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function TimeTracker() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [taskName, setTaskName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render to live-update the running timer

  const running = entries.find((e) => !e.endedAt);

  async function loadEntries() {
    const res = await fetch("/api/time");
    const data = await res.json();
    if (Array.isArray(data.entries)) setEntries(data.entries);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  async function startTimer() {
    if (!taskName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskName }),
    });
    setLoading(false);
    if (res.ok) {
      setTaskName("");
      loadEntries();
    }
  }

  async function stopTimer() {
    setLoading(true);
    await fetch("/api/time", { method: "PATCH" });
    setLoading(false);
    loadEntries();
  }

  return (
    <div>
      <div className="border border-white/10 rounded-xl bg-white/5 p-6 mb-6">
        {running ? (
          <div>
            <p className="text-sm text-white/50 mb-1">Currently tracking</p>
            <p className="text-xl font-semibold mb-1">{running.taskName}</p>
            <p className="text-3xl font-mono mb-4">
              {formatDuration(running.startedAt, null)}
            </p>
            <button
              onClick={stopTimer}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Stop
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startTimer()}
              placeholder="What are you working on?"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={startTimer}
              disabled={loading || !taskName.trim()}
              className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Start
            </button>
          </div>
        )}
      </div>

      <h2 className="text-sm font-semibold text-white/60 mb-3">Past entries</h2>
      <div className="space-y-2">
        {entries.filter((e) => e.endedAt).length === 0 && (
          <p className="text-white/40 text-sm">No completed entries yet.</p>
        )}
        {entries
          .filter((e) => e.endedAt)
          .map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border border-white/10 rounded-lg px-4 py-3 bg-white/5"
            >
              <div>
                <p className="text-sm font-medium">{e.taskName}</p>
                <p className="text-xs text-white/40">
                  {new Date(e.startedAt).toLocaleString()}
                </p>
              </div>
              <span className="text-sm font-mono text-white/70">
                {formatDuration(e.startedAt, e.endedAt)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
