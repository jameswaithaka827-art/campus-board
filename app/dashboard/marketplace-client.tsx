"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

const CATEGORIES = [
  { id: "books", label: "Books & Notes", icon: "📚" },
  { id: "electronics", label: "Electronics", icon: "💻" },
  { id: "fashion", label: "Fashion", icon: "👟" },
  { id: "food", label: "Food & Drinks", icon: "🍔" },
  { id: "housing", label: "Housing", icon: "🏠" },
  { id: "services", label: "Services", icon: "🛠️" },
  { id: "jobs", label: "Jobs", icon: "💼" },
  { id: "events", label: "Events", icon: "🎉" },
  { id: "lostfound", label: "Lost & Found", icon: "🔍" },
];
const CONDITIONS = [
  { id: "new", label: "🆕 Brand New" },
  { id: "like_new", label: "✨ Like New" },
  { id: "good", label: "👍 Used - Good" },
  { id: "fair", label: "🔧 Used - Fair" },
  { id: "refurbished", label: "♻️ Refurbished" },
];
const SERVICE_TYPES = [
  { id: "salon", label: "💇 Salon / Hair" },
  { id: "barber", label: "✂️ Barber" },
  { id: "laundry", label: "🧺 Laundry" },
  { id: "tutoring", label: "📖 Tutoring" },
  { id: "repair", label: "🔧 Repair / Tech" },
  { id: "photography", label: "📸 Photography" },
  { id: "cleaning", label: "🧹 Cleaning" },
  { id: "other", label: "✨ Other" },
];
const MEAL_TYPES = [
  { id: "breakfast", label: "🍳 Breakfast" },
  { id: "lunch", label: "🍛 Lunch" },
  { id: "dinner", label: "🍽️ Dinner" },
  { id: "snacks", label: "🍟 Snacks" },
  { id: "drinks", label: "🥤 Drinks" },
  { id: "baked", label: "🧁 Baked Goods" },
];

type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceKsh: number | null;
  images: string[];
  condition: string | null;
  serviceType: string | null;
  mealType: string | null;
  status: string;
  isBoosted: boolean;
  seller: { id: string; name: string | null; avatarUrl: string | null };
};

function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}
function categoryIcon(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.icon || "🏷️";
}
function conditionLabel(id: string | null) {
  return CONDITIONS.find((c) => c.id === id)?.label || null;
}

export default function MarketplaceClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  async function load(category?: string) {
    setLoading(true);
    const url = category ? `/api/marketplace?category=${category}` : "/api/marketplace";
    const res = await fetch(url);
    const data = await res.json();
    setLoading(false);
    if (res.ok) setListings(data.listings || []);
    else setNotice(data.error || "Could not load marketplace.");
  }

  useEffect(() => {
    void load(activeCategory || undefined);
  }, [activeCategory]);

  const filtered = q.trim()
    ? listings.filter((l) => (l.title + " " + l.description).toLowerCase().includes(q.toLowerCase()))
    : listings;

  async function toggleWatch(id: string) {
    await fetch(`/api/marketplace/${id}/watch`, { method: "POST" });
  }

  async function reportListing(id: string) {
    const reason = window.prompt("Why are you reporting this listing?");
    if (!reason) return;
    await fetch(`/api/marketplace/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setNotice("Report submitted — our team will review it.");
  }

  async function markSold(id: string) {
    await fetch(`/api/marketplace/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sold" }),
    });
    void load(activeCategory || undefined);
  }

  return (
    <div className="space-y-5">
      {notice && (
        <Card className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="text-[#6b6759]">✕</button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory("")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            activeCategory === "" ? "border-brand-500/40 bg-brand-500/10 text-brand-300" : "border-white/10 text-[#8a8578] hover:bg-white/5"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              activeCategory === c.id ? "border-brand-500/40 bg-brand-500/10 text-brand-300" : "border-white/10 text-[#8a8578] hover:bg-white/5"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search listings..."
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
        />
        <Button variant="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Post listing"}
        </Button>
      </div>

      {showForm && (
        <PostForm
          onPosted={() => {
            setShowForm(false);
            void load(activeCategory || undefined);
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-[#6b6759]">Loading listings...</p>
      ) : filtered.length === 0 ? (
        <EmptyState title="No listings yet — be the first to post something in this category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} onWatch={() => toggleWatch(l.id)} onReport={() => reportListing(l.id)} onMarkSold={() => markSold(l.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  onWatch,
  onReport,
  onMarkSold,
}: {
  listing: Listing;
  onWatch: () => void;
  onReport: () => void;
  onMarkSold: () => void;
}) {
  const cover = listing.images[0] ? `/api/marketplace/${listing.id}/image?index=0` : null;
  return (
    <Card className="flex flex-col gap-3 p-0 overflow-hidden">
      <div className="aspect-video w-full bg-white/[0.03] flex items-center justify-center text-3xl">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          categoryIcon(listing.category)
        )}
      </div>
      <div className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="brand">{categoryLabel(listing.category)}</Badge>
          {listing.isBoosted && <Badge tone="warning">🚀 Boosted</Badge>}
          {listing.status === "sold" && <Badge tone="neutral">Sold</Badge>}
        </div>
        <h3 className="font-semibold">{listing.title}</h3>
        <p className="text-sm text-[#8a8578] line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-brand-300">
            {listing.priceKsh == null ? "Ask seller" : `KSh ${listing.priceKsh.toLocaleString()}`}
          </span>
          <span className="text-xs text-[#6b6759]">{conditionLabel(listing.condition) || "—"}</span>
        </div>
        <div className="text-xs text-[#6b6759]">Seller: {listing.seller.name || "Student"}</div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onWatch} className="flex-1 text-xs py-2">
            ☆ Save
          </Button>
          <Button variant="ghost" onClick={onReport} className="text-xs py-2">
            Report
          </Button>
          {listing.status !== "sold" && (
            <Button variant="success" onClick={onMarkSold} className="text-xs py-2">
              Mark sold
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function PostForm({ onPosted }: { onPosted: () => void }) {
  const [category, setCategory] = useState("books");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceKsh, setPriceKsh] = useState("");
  const [condition, setCondition] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [mealType, setMealType] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError("");
    // The upload endpoint now returns private-storage URLs the browser can't
    // fetch directly — preview thumbnails come from the local files
    // themselves instead, not a round-trip to a URL nothing can render yet.
    setPreviews((prev) => [...prev, ...Array.from(files).map((f) => URL.createObjectURL(f))].slice(0, 6));
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    const res = await fetch("/api/marketplace/images", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    setImages((prev) => [...prev, ...(data.images || [])].slice(0, 6));
  }

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setPosting(true);
    setError("");
    const res = await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        priceKsh: priceKsh ? Number(priceKsh) : null,
        condition: condition || undefined,
        serviceType: serviceType || undefined,
        mealType: mealType || undefined,
        images,
      }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setError(data.error || "Could not post listing.");
      return;
    }
    onPosted();
  }

  return (
    <Card>
      <h2 className="font-semibold mb-3">Post a listing</h2>
      <div className="space-y-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" maxLength={700} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm" />
        <input value={priceKsh} onChange={(e) => setPriceKsh(e.target.value)} placeholder="Price in KSh (leave blank for 'Ask seller')" inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm" />

        {(category === "books" || category === "electronics" || category === "fashion") && (
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
            <option value="">Condition (optional)</option>
            {CONDITIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        )}
        {category === "services" && (
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
            <option value="">Service type (optional)</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        )}
        {category === "food" && (
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
            <option value="">Meal type (optional)</option>
            {MEAL_TYPES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        )}

        <div>
          <label className="text-xs text-[#8a8578] mb-1 block">Photos (up to 6)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handleFiles(e.target.files)} className="text-sm" />
          {uploading && <p className="text-xs text-[#6b6759] mt-1">Uploading...</p>}
          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {previews.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-rust-400">{error}</p>}
        <Button variant="primary" onClick={submit} disabled={posting} className="w-full">
          {posting ? "Posting..." : "Post listing"}
        </Button>
      </div>
    </Card>
  );
}
