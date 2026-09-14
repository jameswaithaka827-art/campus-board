"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRoleConfig } from "@/lib/roles";

type Note = { id: string; title: string; content: string; createdAt: string };

export default function NotesPanel({ role }: { role: string | null }) {
  const config = getRoleConfig(role);
  const [notes, setNotes] = useState<Note[]>([]);
  const [roughNotes, setRoughNotes] = useState("");
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [search, setSearch] = useState("");

  async function loadNotes() {
    const res = await fetch("/api/notes");
    const data = await res.json();
    if (Array.isArray(data.notes)) setNotes(data.notes);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function generateDraft() {
    if (!roughNotes.trim()) return;
    setGenerating(true);
    setGenerateError("");
    const res = await fetch("/api/notes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roughNotes }),
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
    if (data.draft) setDraft(data.draft);
  }

  async function saveNote() {
    if (!draft.trim()) return;
    setSaving(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: draft }),
    });
    setSaving(false);
    setTitle("");
    setRoughNotes("");
    setDraft("");
    loadNotes();
  }

  const visibleNotes = search.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{config.noteLabel}</h1>
      <p className="text-white/50 text-sm mb-6">
        Set up for {config.label.toLowerCase() === "general" ? "general use" : config.label.toLowerCase() + " workflows"} —{" "}
        <Link href="/account" className="underline">change in Account</Link>
      </p>

      <div className="border border-white/10 rounded-xl bg-white/5 p-5 mb-4">
        <label className="block text-sm text-white/60 mb-1">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        />

        <label className="block text-sm text-white/60 mb-1">Rough notes</label>
        <textarea
          value={roughNotes}
          onChange={(e) => setRoughNotes(e.target.value)}
          placeholder={config.placeholder}
          rows={4}
          className="w-full mb-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        />

        {generateError && (
          <p className="text-red-400 text-sm mb-3">{generateError}</p>
        )}

        {limitReached ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm mb-3">
            You've used all your free AI actions this month.{" "}
            <Link href="/pricing" className="text-amber-400 underline">Upgrade to Pro</Link> for unlimited drafting.
          </div>
        ) : (
          <button
            onClick={generateDraft}
            disabled={generating || !roughNotes.trim()}
            className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 mb-3"
          >
            {generating ? "Drafting..." : "Draft with AI"}
          </button>
        )}

        {draft && (
          <div className="mt-2">
            <label className="block text-sm text-white/60 mb-1">Draft (edit freely before saving)</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              className="w-full mb-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={saveNote}
              disabled={saving}
              className="border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save note"}
            </button>
          </div>
        )}
      </div>

      <h2 className="text-sm font-semibold text-white/60 mb-2">Past {config.noteLabel.toLowerCase()}</h2>
      {notes.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${config.noteLabel.toLowerCase()}...`}
          className="w-full mb-3 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        />
      )}
      <div className="space-y-2">
        {visibleNotes.length === 0 && (
          <p className="text-white/40 text-sm">Nothing saved yet.</p>
        )}
        {visibleNotes.map((n) => (
          <details key={n.id} className="border border-white/10 rounded-lg bg-white/5 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium flex justify-between">
              <span>{n.title}</span>
              <span className="text-white/30 text-xs">{new Date(n.createdAt).toLocaleDateString()}</span>
            </summary>
            <p className="text-sm text-white/70 mt-2 whitespace-pre-wrap">{n.content}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
