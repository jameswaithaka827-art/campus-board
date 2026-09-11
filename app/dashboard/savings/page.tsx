import Link from "next/link";

export default function SavingsPage() {
  const url = process.env.SAVINGS_APP_URL?.trim();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-brand-300">Money tools</p>
        <h1 className="mt-1 text-3xl font-bold">Save smarter</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Keep your student learning and money tools connected. This space is ready for your savings project to be connected when you provide its source.
        </p>
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Savings service</h2>
            <p className="mt-2 text-sm text-slate-400">Goals, saving progress and transaction tools can live here without creating a second James AI account.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Integration ready</span>
        </div>
        <div className="mt-6">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold">Open savings app</a>
          ) : (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">The savings source has not been connected yet. Keep this page; we can wire the real app here when you send its code.</div>
          )}
        </div>
      </section>
      <Link href="/dashboard/marketplace" className="text-sm text-brand-300 hover:text-brand-200">← Back to Marketplace</Link>
    </div>
  );
}
