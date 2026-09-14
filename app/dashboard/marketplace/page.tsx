import MarketplaceClient from "../marketplace-client";

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Student Marketplace</p>
        <h1 className="font-display mt-1 text-3xl">Buy, sell & discover</h1>
        <p className="mt-2 text-[#8a8578]">Textbooks, electronics, fashion, food, housing, services, jobs, events, and lost & found — all inside James AI.</p>
      </div>
      <MarketplaceClient />
    </div>
  );
}
