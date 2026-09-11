"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoleConfig } from "@/lib/roles";
import { enablePushNotifications, disablePushNotifications, isPushSupported } from "@/lib/push-client";

type Block = {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  category: string | null;
  notify: boolean;
};

type DraftBlock = Omit<Block, "id"> & { include: boolean };

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlannerPanel({ role }: { role: string | null }) {
  const config = getRoleConfig(role);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadError, setLoadError] = useState("");

  // Manual add-block form
  const [day, setDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [notify, setNotify] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // AI draft assistant
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [draftBlocks, setDraftBlocks] = useState<DraftBlock[] | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Push notifications
  const [pushBusy, setPushBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState("");

  async function loadBlocks() {
    const res = await fetch("/api/planner");
    if (!res.ok) {
      setLoadError("Couldn't load your schedule.");
      return;
    }
    const data = await res.json();
    if (Array.isArray(data.blocks)) setBlocks(data.blocks);
  }

  useEffect(() => {
    loadBlocks();
    if (isPushSupported()) {
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        setPushEnabled(Boolean(sub));
      });
    }
  }, []);

  async function addBlock() {
    setAddError("");
    if (!title.trim()) {
      setAddError("Title is required.");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, startTime, endTime, title, category, notify }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setAddError(data?.error || "Couldn't add that block.");
      return;
    }
    setTitle("");
    setCategory("");
    loadBlocks();
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/planner/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  async function generateDraft() {
    if (!description.trim()) return;
    setGenerating(true);
    setGenerateError("");
    setDraftBlocks(null);
    const res = await fetch("/api/planner/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    setGenerating(false);
    if (res.status === 402) {
      setLimitReached(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setGenerateError(data?.error || "Something went wrong. Please try again.");
      return;
    }
    const data = await res.json();
    if (Array.isArray(data.blocks)) {
      setDraftBlocks(data.blocks.map((b: Omit<Block, "id">) => ({ ...b, include: true })));
    }
  }

  async function saveDraftBlocks() {
    if (!draftBlocks) return;
    setSavingDraft(true);
    const toSave = draftBlocks.filter((b) => b.include);
    const results = await Promise.all(
      toSave.map((b) =>
        fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day: b.day,
            startTime: b.startTime,
            endTime: b.endTime,
            title: b.title,
            category: b.category,
            notify: b.notify,
          }),
        })
      )
    );
    const failed = results.filter((response) => !response.ok).length;
    setSavingDraft(false);
    if (failed > 0) {
      setGenerateError(`${failed} schedule item${failed === 1 ? "" : "s"} could not be added. Your successful items were kept.`);
      await loadBlocks();
      return;
    }
    setDraftBlocks(null);
    setDescription("");
    await loadBlocks();
  }

  async function togglePush() {
    setPushError("");
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await disablePushNotifications();
        setPushEnabled(false);
      } else {
        await enablePushNotifications();
        setPushEnabled(true);
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setPushBusy(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{config.plannerLabel}</h1>
      <p className="text-white/50 text-sm mb-6">
        Set up for {config.label.toLowerCase() === "general" ? "general use" : config.label.toLowerCase() + " workflows"} —{" "}
        <Link href="/account" className="underline">change in Account</Link>
      </p>

      {/* Notifications */}
      <div className="border border-white/10 rounded-xl bg-white/5 p-5 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Reminder notifications</p>
            <p className="text-white/50 text-xs mt-0.5">
              Get a notification on this device when a block marked "remind me" is starting.
            </p>
          </div>
          <button
            onClick={togglePush}
            disabled={pushBusy || !isPushSupported()}
            className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap ${
              pushEnabled
                ? "border border-white/20 hover:border-white/40"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {pushBusy ? "..." : pushEnabled ? "Disable" : "Enable notifications"}
          </button>
        </div>
        {!isPushSupported() && (
          <p className="text-amber-400 text-xs mt-2">Not supported in this browser.</p>
        )}
        {pushError && <p className="text-red-400 text-xs mt-2">{pushError}</p>}
      </div>

      {/* AI draft assistant */}
      <div className="border border-white/10 rounded-xl bg-white/5 p-5 mb-4">
        <label className="block text-sm text-white/60 mb-1">Describe your week, get a draft schedule</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={config.plannerPlaceholder}
          rows={3}
          className="w-full mb-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        />

        {generateError && <p className="text-red-400 text-sm mb-3">{generateError}</p>}

        {limitReached ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm mb-3">
            You've used all your free AI actions this month.{" "}
            <Link href="/pricing" className="text-amber-400 underline">Upgrade to Pro</Link> for unlimited drafting.
          </div>
        ) : (
          <button
            onClick={generateDraft}
            disabled={generating || !description.trim()}
            className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 mb-3"
          >
            {generating ? "Drafting..." : "Draft my week"}
          </button>
        )}

        {draftBlocks && draftBlocks.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-white/60">Review, then add what looks right:</p>
            {draftBlocks.map((b, i) => (
              <label
                key={i}
                className="flex items-center gap-3 border border-white/10 rounded-lg bg-black/20 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={b.include}
                  onChange={(e) =>
                    setDraftBlocks((prev) =>
                      prev ? prev.map((x, idx) => (idx === i ? { ...x, include: e.target.checked } : x)) : prev
                    )
                  }
                />
                <span className="text-white/40 w-20 shrink-0">{DAY_LABELS[b.day].slice(0, 3)}</span>
                <span className="text-white/40 w-28 shrink-0">{b.startTime}–{b.endTime}</span>
                <span className="flex-1">{b.title}</span>
                {b.category && <span className="text-white/30 text-xs">{b.category}</span>}
              </label>
            ))}
            <button
              onClick={saveDraftBlocks}
              disabled={savingDraft || !draftBlocks.some((b) => b.include)}
              className="border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 mt-2"
            >
              {savingDraft ? "Adding..." : "Add to my week"}
            </button>
          </div>
        )}
        {draftBlocks && draftBlocks.length === 0 && (
          <p className="text-white/40 text-sm">Couldn't find any clear schedule items in that — try adding more detail.</p>
        )}
      </div>

      {/* Manual add */}
      <div className="border border-white/10 rounded-xl bg-white/5 p-5 mb-6">
        <p className="text-sm font-medium mb-3">Add a block manually</p>
        {addError && <p className="text-red-400 text-sm mb-3">{addError}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-3">
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="col-span-2 sm:col-span-1 bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm"
          >
            {DAY_LABELS.map((label, i) => (
              <option key={i} value={i}>{label.slice(0, 3)}</option>
            ))}
          </select>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="col-span-2 sm:col-span-2 bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="col-span-2 sm:col-span-1 bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60 mb-3">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Remind me
        </label>
        <button
          onClick={addBlock}
          disabled={adding || !title.trim()}
          className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add block"}
        </button>
      </div>

      {/* Weekly view */}
      {loadError && <p className="text-red-400 text-sm mb-3">{loadError}</p>}
      <div className="space-y-4">
        {DAY_LABELS.map((label, dayIndex) => {
          const dayBlocks = blocks.filter((b) => b.day === dayIndex);
          return (
            <div key={dayIndex}>
              <h2 className="text-sm font-semibold text-white/60 mb-2">{label}</h2>
              {dayBlocks.length === 0 ? (
                <p className="text-white/30 text-sm">Nothing scheduled.</p>
              ) : (
                <div className="space-y-1">
                  {dayBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between border border-white/10 rounded-lg bg-white/5 px-4 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 w-28 shrink-0">{b.startTime}–{b.endTime}</span>
                        <span>{b.title}</span>
                        {b.category && <span className="text-white/30 text-xs">{b.category}</span>}
                        {b.notify && <span className="text-brand-400 text-xs">🔔</span>}
                      </div>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="text-white/30 hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
