"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string };

export default function ChatPanel({ isPro = false, maxImages = 1 }: { isPro?: boolean; maxImages?: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const [remainingFree, setRemainingFree] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [webEnabled, setWebEnabled] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);

  // Load past conversation on mount so it isn't lost between visits.
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.messages)) setMessages(data.messages);
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  function searchGoogle() {
    const query = input.trim();
    const url = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : "https://www.google.com";
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onImages(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, Math.max(1, maxImages));
    setImageBusy(true);
    try {
      const urls = await Promise.all(incoming.map(file => new Promise<string>((resolve, reject) => {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Use JPG, PNG, or WebP images."));
        if (file.size > 700_000) return reject(new Error("Each image must be 700 KB or smaller."));
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read image.")); reader.readAsDataURL(file);
      })));
      setImages(prev => [...prev, ...urls].slice(0, Math.max(1, maxImages)));
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: e instanceof Error ? e.message : "Could not add image." }]);
    } finally { setImageBusy(false); }
  }

  async function sendMessage() {
    if (!input.trim() && images.length === 0 || loading || limitReached) return;
    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The server rebuilds conversation context from what's stored in the
        // database for this user — it only needs the new message here.
        body: JSON.stringify({ message: input, webSearch: webEnabled, images }),
      });

      if (res.status === 402) {
        setLimitReached(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // Includes 429 (rate limited) and any other error. The user's
        // message was never persisted server-side in this case (the limit
        // check runs before the DB write), so don't leave it looking sent —
        // show it as failed and let them retry.
        const data = await res.json().catch(() => null);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data?.error || "Something went wrong. Please try again.",
          },
        ]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      setImages([]);
      if (typeof data.remainingFree === "number") setRemainingFree(data.remainingFree);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong. Check your API key in .env.local." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const visibleMessages = search.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()))
    : messages;

  return (
    <div>
      {remainingFree !== null && remainingFree <= 5 && !limitReached && (
        <p className="text-amber-400 text-xs mb-2">
          {remainingFree} free AI action{remainingFree === 1 ? "" : "s"} left this month —{" "}
          <Link href="/pricing" className="underline">upgrade to Pro</Link> for more AI capacity.
        </p>
      )}

      {messages.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your past messages..."
          className="w-full mb-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        />
      )}

      <div className="border border-white/10 rounded-xl bg-white/5 flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {historyLoading && <p className="text-white/40 text-sm">Loading your past conversation...</p>}
          {!historyLoading && messages.length === 0 && (
            <p className="text-white/40 text-sm">Ask your AI assistant anything to get started.</p>
          )}
          {!historyLoading && search.trim() && visibleMessages.length === 0 && (
            <p className="text-white/40 text-sm">No past messages match "{search}".</p>
          )}
          {visibleMessages.map((m, i) => (
            <div key={i}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                  m.role === "user" ? "bg-brand-600 ml-auto" : "bg-white/10"
                }`}
              >
                {m.content}
              </div>
              {m.createdAt && (
                <div className={`text-[11px] text-white/30 mt-1 ${m.role === "user" ? "text-right" : ""}`}>
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-white/40 text-sm">Thinking...</div>}
          {limitReached && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
              You've used all your free messages.{" "}
              <Link href="/pricing" className="text-amber-400 underline">Upgrade to Pro</Link>{" "}
              for more AI capacity.
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => isPro && setWebEnabled((v) => !v)} className={`text-xs rounded-full px-3 py-1.5 border ${webEnabled ? "border-brand-500 bg-brand-500/10 text-brand-200" : "border-white/10 text-white/50"}`}>
                {webEnabled ? "Web search ON" : isPro ? "Search web" : "Web search (Pro)"}
              </button>
              <button type="button" onClick={searchGoogle} className="text-xs rounded-full px-3 py-1.5 border border-white/10 text-white/50 hover:border-white/30">Google</button>
            </div>
            <span className="text-[11px] text-white/30">{isPro ? `${maxImages} photo${maxImages === 1 ? "" : "s"} + web research` : "Upgrade to Pro for web research + multi-photo study help"}</span>
          </div>
          {images.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto">
              {images.map((src, i) => <div key={i} className="relative shrink-0"><img src={src} alt={`Attachment ${i + 1}`} className="h-14 w-14 rounded-lg object-cover border border-white/10" /><button type="button" onClick={() => setImages(prev => prev.filter((_, n) => n !== i))} className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-[10px]">×</button></div>)}
            </div>
          )}
          <div className="flex gap-2 items-center">
          <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:border-white/30">📷 Photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => void onImages(e.target.files)} disabled={!isPro && images.length >= 1 || imageBusy || images.length >= maxImages} /></label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={limitReached ? "Upgrade to keep chatting" : "Type a message..."}
            disabled={limitReached}
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || limitReached || imageBusy || (!input.trim() && images.length === 0)}
            className="bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Send
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
