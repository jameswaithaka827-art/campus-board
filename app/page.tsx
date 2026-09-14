import Link from "next/link";

const features = [
  ["AI Tutor", "Turn difficult topics into explanations, quizzes, revision notes and image-based help."],
  ["Learn", "Follow courses, tuition, lessons, exams and live classes in one learning path."],
  ["Community", "Share verified academic work, find study partners and learn with your peers."],
  ["Teaching Studio", "Give lecturers the tools to publish lessons, assignments, live classes and feedback."],
  ["Campus Services", "Move from learning to marketplace and savings without leaving the student workspace."],
  ["Admin Center", "Control verification, users, safety, roles, subscriptions and platform health."],
];

const mockNav = ["Home", "AI Tutor", "Learn", "Community", "Marketplace"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-acacia-500 text-sm font-black text-ink">JA</div>
          <div><div className="font-display text-lg leading-tight">James AI</div><div className="text-xs text-[#8a8578]">Student ecosystem</div></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4"><Link href="/demo" className="hidden text-sm text-white/65 hover:text-white sm:inline">Presentation</Link><Link href="/pricing" className="hidden text-sm text-white/65 hover:text-white sm:inline">Pricing</Link><Link href="/login" className="text-sm text-white/65 hover:text-white">Log in</Link><Link href="/signup" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500">Start free</Link></div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pt-5 sm:px-8 lg:pt-8">
        <div className="hero-surface relative overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2"><span className="eyebrow">Student-first platform</span><span className="verified-pill">✓ Built around learning</span></div>
              <h1 className="font-display mt-5 text-4xl leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.5rem]">One place to learn,<br />connect and <span className="relative inline-block">grow<span className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-brand-500/70" /></span>.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#b8b3a2] sm:text-lg">James AI brings AI study support, courses, verified academic community, lecturer teaching tools and campus services into one secure workspace.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="rounded-xl bg-brand-600 px-5 py-3.5 text-center font-semibold text-ink hover:bg-brand-500">Create your workspace</Link><Link href="/demo" className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-center font-semibold hover:bg-white/[0.07]">See the product demo</Link></div>
              <div className="mt-7 flex flex-wrap gap-5 text-xs text-[#8a8578]"><span>🔐 Google + verified email</span><span>🟢 School verification</span><span>📱 Mobile ready</span><span>⚡ AI + human teaching</span></div>
            </div>

            <div className="relative hidden min-h-[420px] lg:block">
              <div className="absolute right-2 top-3 h-[365px] w-[500px] -rotate-2 rounded-[1.5rem] border border-white/10 bg-ink/90 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-lg bg-brand-600/25"/><span className="text-sm font-semibold">James AI</span></div><span className="verified-pill">✓ Verified</span></div>
                <div className="grid grid-cols-[140px_1fr] gap-4 pt-4"><div className="space-y-2">{mockNav.map((x,i)=><div key={x} className={`rounded-lg px-3 py-2 text-xs ${i===0?'bg-brand-600/20 text-brand-300':'text-[#6b6759]'}`}>{x}</div>)}</div><div className="space-y-3"><div className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><div className="mini-label">Today</div><div className="mt-2 text-lg font-semibold">Good morning 👋</div><div className="mt-1 text-xs text-[#8a8578]">2 classes · 1 exam · 3 tasks</div></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="mini-label">Study</div><div className="mt-2 text-2xl font-bold">8.4h</div><div className="text-[11px] text-acacia-300">+18% this week</div></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="mini-label">Progress</div><div className="mt-2 text-2xl font-bold">74%</div><div className="text-[11px] text-brand-300">On track</div></div></div><div className="rounded-xl border border-brand-400/15 bg-brand-400/[0.05] p-4"><div className="text-sm font-semibold">AI Tutor</div><div className="mt-1 text-xs text-[#8a8578]">“Explain the OSI model with an example.”</div><div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-3/4 rounded-full bg-brand-500"/></div></div></div></div>
              </div>
              <div className="absolute -bottom-2 left-3 w-64 rounded-2xl border border-acacia-500/25 bg-acacia-500/[0.08] p-4 shadow-xl backdrop-blur-xl"><div className="text-xs font-semibold text-acacia-300">Live study room</div><div className="mt-2 text-2xl font-bold">42 online</div><div className="mt-1 text-xs text-[#8a8578]">Computer Networks · 8 new messages</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-2xl"><p className="eyebrow">The James AI loop</p><h2 className="font-display mt-3 text-3xl tracking-tight sm:text-4xl">Your student day, connected end to end.</h2><p className="mt-3 text-[#8a8578]">Open your workspace, understand what matters next, learn with your course, collaborate with peers, and keep your progress visible.</p></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{features.map(([title,desc],i)=><article key={title} className="feature-card"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-bold text-brand-300">0{i+1}</div><h3 className="mt-2 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#8a8578]">{desc}</p></div><span className="text-xl text-brand-300">✦</span></div></article>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:pb-20"><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="soft-grid rounded-[1.5rem] border border-white/10 p-6 sm:p-8"><p className="eyebrow">For students</p><h2 className="font-display mt-3 text-2xl">More than a chatbot.</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{['Ask the AI Tutor','Continue your course','Review today’s plan','Join a study room','Share a verified note','Track your progress'].map(x=><div key={x} className="glass-panel rounded-xl p-4 text-sm text-[#c9c4b4]">✓ {x}</div>)}</div></div><div className="hero-surface rounded-[1.5rem] p-6 sm:p-8"><p className="eyebrow">For leadership</p><h2 className="font-display mt-3 text-2xl">A platform story your VC, lecturer and students can understand quickly.</h2><p className="mt-3 text-sm leading-6 text-[#8a8578]">One secure identity connects learning, community, teaching, campus services and administration.</p><Link href="/demo" className="mt-6 inline-flex rounded-xl bg-[#f4efe4] px-4 py-3 text-sm font-semibold text-ink">Open leadership demo</Link></div></div></section>

      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm text-[#6b6759]">© {new Date().getFullYear()} James AI · <Link href="/privacy" className="hover:text-[#c9c4b4]">Privacy</Link> · <Link href="/terms" className="hover:text-[#c9c4b4]">Terms</Link> · <Link href="/account/delete" className="hover:text-[#c9c4b4]">Delete account</Link></footer>
    </main>
  );
}
