"use client";

import { useRef, useState } from "react";

export default function AvatarUpload({ initialUrl, name }: { initialUrl?: string | null; name?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl || "");
  const [status, setStatus] = useState("");

  async function upload(file: File) {
    setStatus("Uploading...");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/account/avatar", { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setStatus(data?.error || "Upload failed"); return; }
    setUrl(data.avatarUrl);
    setStatus("Profile photo updated");
    window.setTimeout(() => setStatus(""), 2000);
  }

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => inputRef.current?.click()} className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/10">
        {url ? (
          <img src={url} alt={`${name || "User"} profile photo`} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-lg font-semibold text-white/70">
            {(name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} className="border border-white/20 hover:border-white/40 px-3 py-2 rounded-lg text-sm font-medium">
          {url ? "Change photo" : "Add profile photo"}
        </button>
        <p className="text-xs text-white/40 mt-2">JPG, PNG or WebP · max 3 MB</p>
        {status && <p className="text-xs text-white/60 mt-1">{status}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); }} />
    </div>
  );
}
