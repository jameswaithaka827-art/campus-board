"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const roles = ["Student", "Lecturer", "Admin"] as const;
type Role = (typeof roles)[number];

const posts = [
  { name: "Wanjiru Kamau", course: "Computer Networks", time: "18 min ago", avatar: "WK", text: "I turned OSI layers into a one-page revision map. Sharing it here for anyone taking the CAT next week.", stats: "128 views · 31 likes · 8 comments · 6 shares", images: ["OSI", "TCP/IP"] },
  { name: "Brian Otieno", course: "Software Engineering", time: "1 hr ago", avatar: "BO", text: "Our team project checklist: requirements → UML → API contract → tests → deployment. What are you using for your group project?", stats: "94 views · 22 likes · 5 comments · 3 shares", images: [] },
];

function Verified() { return <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-slate-950">✓</span>; }

export default function DemoPage() {
  const [role, setRole] = useState<Role>("Student");
  const [liked, setLiked] = useState<number | null>(null);
  const [course, setCourse] = useState("All");

  const visiblePosts = useMemo(() => course === "All" ? posts : posts.filter((p) => p.course === course), [course]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white font-bold">J</span><div><div className="font-black tracking-tight">James AI</div><div className="text-[11px] text-slate-500">Education + AI + Community</div></div></Link>
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            {roles.map((r) => <button key={r} onClick={() => setRole(r)} className={`rounded-full px-4 py-2 text-xs font-semibold ${role === r ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900"}`}>{r} view</button>)}
          </div>
          <div className="flex gap-2"><Link href="/login" className="hidden sm:block rounded-xl border border-slate-200 px-3 py-2 text-sm">Log in</Link><Link href="/signup" className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Start free</Link></div>
        </div>
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto">{roles.map((r) => <button key={r} onClick={() => setRole(r)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${role === r ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"}`}>{r}</button>)}</div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_.85fr] lg:items-end">
            <div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Built for verified learning communities</div><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">One professional home for <span className="text-indigo-300">learning, teaching and student life.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">AI tutoring, courses, live classes, notes, study partners, verified academic sharing, a student marketplace and an administrator control center.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950">Create account</Link><a href="#student-feed" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold">Explore demo</a></div></div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"><div className="text-xs uppercase tracking-[.2em] text-slate-400">Live product map</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{["AI Tutor · Chat + images","Learn · Courses + tuition","Community · Verified feed","Teaching Studio · Lessons + classes","Marketplace · Student listings","Admin Center · Safety + analytics"].map((x) => <div key={x} className="rounded-2xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">{x}</div>)}</div></div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[['78%', 'Study progress', '▲ 12% this month'],['3', 'Exams upcoming', 'Next: Computer Networks'],['14h 20m', 'Study time', 'This week'],['Pro', 'AI plan', '247 actions remaining']].map(([a,b,c]) => <div key={b} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-medium text-slate-500">{b}</div><div className="mt-2 text-3xl font-black tracking-tight">{a}</div><div className="mt-1 text-xs text-slate-500">{c}</div></div>)}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <div id="student-feed" className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-600">Community</div><h2 className="mt-1 text-2xl font-black">Study Feed</h2><p className="mt-1 text-sm text-slate-500">School-verified students share notes, projects and useful resources.</p></div><select value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option>All</option><option>Computer Networks</option><option>Software Engineering</option></select></div></div>
            {visiblePosts.map((p, i) => <article key={p.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="p-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 font-bold text-indigo-700">{p.avatar}</div><div className="min-w-0 flex-1"><div className="font-bold">{p.name}<Verified/></div><div className="text-xs text-slate-500">{p.course} · {p.time}</div></div><button className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">•••</button></div><p className="mt-4 leading-7 text-slate-700">{p.text}</p>{p.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{p.images.map((img) => <div key={img} className="flex aspect-[4/3] items-end rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-4"><div><div className="text-xs font-semibold text-indigo-600">JPG preview</div><div className="mt-1 text-lg font-bold">{img} notes</div></div></div>)}</div>}<div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{p.stats}</div></div><div className="grid grid-cols-3 border-t border-slate-100"><button onClick={() => setLiked(liked === i ? null : i)} className={`py-3 text-sm font-semibold ${liked === i ? "text-indigo-600" : "text-slate-600"}`}>👍 {liked === i ? "Liked" : "Like"}</button><button className="py-3 text-sm font-semibold text-slate-600">💬 Comment</button><button className="py-3 text-sm font-semibold text-slate-600">↗ Share</button></div></article>)}
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">Verified identity</div><h3 className="mt-2 text-xl font-black">Green tick, earned.</h3><p className="mt-2 text-sm leading-6 text-slate-500">A student submits a school ID privately. An authorized admin reviews it. Approved students receive the James AI School Verified badge.</p><div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><b>✓ School verified</b><div className="mt-1 text-xs text-emerald-700">Community actions unlocked</div></div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-600">Live now</div><h3 className="mt-2 text-xl font-black">Computer Networks study room</h3><div className="mt-4 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"/><span className="text-sm font-medium">24 students online</span></div><div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-200"><div className="font-semibold">Room chat</div><p className="mt-2 text-slate-400">“Can someone explain subnet masks?”</p><p className="mt-1 text-slate-400">“I’ll share the diagram in the feed.”</p></div><button className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Join study room</button></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[.18em] text-amber-600">Match</div><h3 className="mt-2 text-xl font-black">Study partner suggestions</h3><div className="mt-4 space-y-3">{[['AM','Amina','Computer Networks · Year 2'],['DK','David','Software Engineering · Year 2'],['LK','Lydia','Computer Networks · Year 2']].map(([a,n,d]) => <div key={n} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-white border border-slate-200 text-xs font-bold">{a}</div><div className="flex-1 min-w-0"><div className="font-semibold text-sm">{n}</div><div className="text-xs text-slate-500 truncate">{d}</div></div><span className="text-xs font-bold text-emerald-600">92%</span></div>)}</div></section>
          </aside>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          {[["🎓", "Lecturer Studio", "Create courses, publish lessons, upload teaching notes and schedule live classes."], ["🛡️", "Admin Center", "Manage users, verify school IDs, moderate reports, inspect security events and monitor system health."], ["✨", "Pro Workspace", "More AI capacity, web research, multi-image analysis and future premium learning analytics."]].map(([icon,title,desc]) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-2xl">{icon}</div><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p></div>)}
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.2em] text-slate-400">Presentation mode</div><h2 className="mt-2 text-3xl font-black tracking-tight">Show the vision before giving access.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">This demo uses mock data. It is safe for presentations because it does not expose real student accounts, school IDs, AI keys or private documents.</p></div><Link href="/signup" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Start the real workspace →</Link></div></section>

        <footer className="py-10 text-center text-xs text-slate-400">James AI · Student-first platform · Demo data only</footer>
      </div>
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xs text-brand-300">CONNECTED SERVICES</div><h2 className="mt-1 text-lg font-semibold">CampusMarket + Savings</h2><p className="mt-2 text-sm text-slate-400">Marketplace buying/selling is connected now; savings is integration-ready for the separate project source.</p></div></main>
  );
}
