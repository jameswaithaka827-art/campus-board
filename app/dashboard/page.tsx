import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, PRO_FEATURES, getEntitlements } from "@/lib/entitlements";

function mondayIndex(date = new Date()) { return (date.getDay() + 6) % 7; }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  const enrolledCourseRows = await prisma.courseEnrollment.findMany({ where: { userId: user.id }, select: { courseId: true } });
  const enrolledCourseIds = enrolledCourseRows.map((x: { courseId: string }) => x.courseId);
  const [upcoming, notes, todayBlocks, recentEntries] = await Promise.all([
    prisma.liveClass.findMany({ where: { courseId: { in: enrolledCourseIds.length ? enrolledCourseIds : ["__none__"] }, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 3, include: { course: { select: { title: true } } } }),
    prisma.note.count({ where: { userId: user.id } }),
    prisma.scheduleBlock.findMany({ where: { userId: user.id, day: mondayIndex() }, orderBy: { startTime: "asc" }, take: 5 }),
    prisma.timeEntry.findMany({ where: { userId: user.id, startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, select: { startedAt: true, endedAt: true } }),
  ]);
  const minutes = recentEntries.reduce((sum: number, e: { endedAt: Date | null; startedAt: Date }) => sum + Math.max(0, Math.round(((e.endedAt ?? new Date()).getTime() - e.startedAt.getTime()) / 60000)), 0);
  const focusHours = Math.round((minutes / 60) * 10) / 10;
  const plan = getPlan(user.subscriptionStatus);
  const entitlements = getEntitlements(user.subscriptionStatus);
  const first = (user.name || user.email || "Student").split(" ")[0];
  const verification = user.schoolIdVerificationStatus === "approved";
  const quick = [
    ["AI Tutor", "Explain, quiz, revise and study from images", "/dashboard/tutor", "✦"],
    ["Learn", "Courses, tuition and live classes", "/dashboard/learn", "▣"],
    ["Community", "Verified notes, rooms and study partners", "/dashboard/community", "◎"],
    ["Marketplace", "Buy or sell student items", "/dashboard/marketplace", "◆"],
    ["Savings", "Plan a saving goal", "/dashboard/savings", "◇"],
    ["Planner", "Build your next study session", "/dashboard/planner", "□"],
  ];

  return <div className="space-y-6">
    <section className="hero-surface relative rounded-[1.5rem] p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Personal command center</p>
            {verification ? <span className="verified-pill">✓ School Verified</span> : <Link href="/dashboard/community/verification" className="rounded-full border border-brand-400/25 bg-brand-400/[0.08] px-2.5 py-1 text-[11px] font-semibold text-brand-300">Verify school identity →</Link>}
          </div>
          <h1 className="font-display mt-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">Good day, {first}.</h1>
          <p className="mt-3 max-w-2xl text-[#b8b3a2]">Your learning, planning, community and campus services — connected in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/tutor" className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-500">Start AI study</Link>
          <Link href="/dashboard/planner" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold hover:bg-white/[0.06]">Plan my day</Link>
        </div>
      </div>
    </section>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["AI plan", plan === "pro" ? "Pro" : "Free", "Your current access"],["Notes", String(notes), "Saved study material"],["Courses", String(enrolledCourseIds.length), "Courses joined"],["Study · 7 days", `${focusHours}h`, "Focused time"]].map(([k,v,s])=><div key={k} className="stat-card"><div className="mini-label">{k}</div><div className="font-display mt-2 text-2xl">{v}</div><div className="mt-1 text-xs text-[#6b6759]">{s}</div></div>)}</div>

    <section>
      <div className="mb-4"><p className="eyebrow">Quick actions</p><h2 className="font-display mt-1 text-xl">What do you want to do?</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{quick.map(([title,desc,href,icon])=><Link key={title} href={href} className="feature-card group"><div className="flex items-start justify-between"><div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-lg text-brand-300">{icon}</div><div><div className="font-semibold">{title}</div><p className="mt-1 text-sm text-[#8a8578]">{desc}</p></div></div><span className="text-[#6b6759] transition group-hover:translate-x-1 group-hover:text-brand-300">→</span></div></Link>)}</div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="glass-panel rounded-[1.25rem] p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Today</p><h2 className="mt-1 text-lg font-semibold">Your study plan</h2></div><Link href="/dashboard/planner" className="text-xs text-brand-300">Open planner →</Link></div>
        <div className="mt-4 space-y-3">{todayBlocks.length ? todayBlocks.map((b:any)=><div key={b.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4"><div className="w-20 shrink-0 text-sm font-semibold text-brand-300">{b.startTime}</div><div><div className="font-medium">{b.title}</div><div className="mt-1 text-xs text-[#8a8578]">{b.endTime}{b.category ? ` · ${b.category}` : ""}</div></div></div>) : <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#8a8578]">Your schedule is open. Add a study block to build your day.</div>}</div>
      </section>
      <section className="hero-surface rounded-[1.25rem] p-5 sm:p-6">
        <p className="eyebrow">Momentum</p><h2 className="mt-1 text-lg font-semibold">Keep the loop moving.</h2>
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm text-[#c9c4b4]">You studied <strong className="text-[#f4efe4]">{focusHours} hours</strong> in the last seven days.</div>
          <div className="mt-2 text-xs leading-5 text-[#8a8578]">Run one focused AI session, then save the key result to Notes.</div>
          <Link href="/dashboard/tutor" className="mt-4 inline-flex rounded-xl bg-[#f4efe4] px-4 py-2.5 text-sm font-semibold text-ink">Study now</Link>
        </div>
      </section>
    </div>

    <section className="glass-panel rounded-[1.25rem] p-5 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="eyebrow">Live learning</p><h2 className="mt-1 text-lg font-semibold">Upcoming classes</h2></div><Link href="/dashboard/learn" className="text-xs text-brand-300">Explore courses →</Link></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">{upcoming.length ? upcoming.map((c: any) => <div key={c.id} className="rounded-xl border border-white/5 bg-black/20 p-4"><div className="font-medium">{c.title}</div><div className="mt-1 text-xs text-[#8a8578]">{c.course.title}</div><div className="mt-3 text-xs text-[#8a8578]">{new Date(c.scheduledAt).toLocaleString()}</div><a href={c.joinUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Join class</a></div>) : <div className="md:col-span-3 rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#8a8578]">No upcoming live classes from your enrolled courses.</div>}</div>
    </section>

    <section className="rounded-[1.25rem] border border-acacia-500/25 bg-acacia-500/[0.06] p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow" style={{color:'#9bcfbc'}}>{plan === "pro" ? "Pro active" : "James AI Pro"}</p>
          <h2 className="font-display mt-1 text-xl">More room for serious study.</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{PRO_FEATURES.slice(0,4).map(x=><div key={x} className="text-sm text-[#c9c4b4]">✓ {x}</div>)}</div>
        </div>
        <Link href="/pricing" className="shrink-0 rounded-xl bg-acacia-500 px-4 py-3 text-sm font-semibold text-[#f4efe4] hover:bg-acacia-600">{plan === "pro" ? "Manage Pro" : `Upgrade · ${entitlements.maxChatImages} images`}</Link>
      </div>
    </section>
  </div>;
}
