"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const mainItems = [
  ["/dashboard", "Home", "⌂"],
  ["/dashboard/tutor", "AI Tutor", "✦"],
  ["/dashboard/learn", "Learn", "▣"],
  ["/dashboard/community", "Community", "◎"],
];
const workItems = [
  ["/dashboard/notes", "Notes", "✎"],
  ["/dashboard/planner", "Planner", "□"],
  ["/dashboard/time", "Study time", "◷"],
];
const campusItems = [
  ["/dashboard/marketplace", "Marketplace", "◆"],
  ["/dashboard/savings", "Savings", "◇"],
];

function Item({ href, label, icon, pathname }: { href: string; label: string; icon: string; pathname: string }) {
  const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return <Link href={href} className={`sidebar-item ${active ? "active" : ""}`}><span className="w-5 text-center text-sm">{icon}</span><span>{label}</span></Link>;
}

function NavGroup({ title, items, pathname }: { title: string; items: string[][]; pathname: string }) {
  return <div className="mb-5"><div className="px-3 pb-2 text-[11px] font-semibold tracking-[0.06em] text-[#6b6759]">{title}</div><div className="space-y-1">{items.map(([href,label,icon]) => <Item key={href} href={href} label={label} icon={icon} pathname={pathname} />)}</div></div>;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  return <div className="min-h-screen text-[#f4efe4]">
    <div className="mx-auto flex min-h-screen max-w-[1680px]">
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-white/10 bg-ink/80 px-4 py-5 sticky top-0 h-screen backdrop-blur-2xl">
        <div className="mb-7 flex items-center gap-3 px-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-acacia-500 text-xs font-black text-ink">JA</div><div><div className="font-display text-base leading-tight">James AI</div><div className="text-xs text-[#8a8578]">Learning ecosystem</div></div></div>
        <NavGroup title="Workspace" items={mainItems} pathname={pathname} />
        <NavGroup title="Study" items={workItems} pathname={pathname} />
        <NavGroup title="Campus" items={campusItems} pathname={pathname} />
        {(role === "lecturer" || role === "teacher" || role === "admin") && <div className="mb-5"><div className="px-3 pb-2 text-[11px] font-semibold tracking-[0.06em] text-[#6b6759]">Educator</div><Link href="/dashboard/teaching" className={`sidebar-item ${pathname.startsWith('/dashboard/teaching') ? 'active' : ''}`}><span className="w-5 text-center text-sm">▤</span><span>Teaching Studio</span></Link></div>}
        {role === "admin" && <Link href="/admin" className="sidebar-item"><span className="w-5 text-center text-sm">🛡</span><span>Admin Center</span></Link>}
        <div className="mt-auto space-y-3"><div className="rounded-xl border border-brand-500/20 bg-brand-500/[0.07] p-4"><div className="mini-label text-brand-300">Your workspace</div><div className="mt-2 text-sm font-semibold">Keep your study loop moving.</div><Link href="/dashboard/tutor" className="mt-3 inline-flex rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-ink">Open AI Tutor</Link></div><div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><div className="truncate text-sm font-medium">{session?.user?.name || session?.user?.email}</div><div className="mt-1 text-xs capitalize text-[#8a8578]">{role || "member"}</div><button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-[#c9c4b4] hover:bg-white/5">Sign out</button></div></div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8"><div className="flex items-center justify-between gap-4"><div className="min-w-0"><div className="text-sm font-semibold">{pathname.startsWith('/dashboard/teaching') ? 'Teaching Studio' : pathname.startsWith('/dashboard/community') ? 'Community' : pathname.startsWith('/dashboard/tutor') ? 'AI Tutor' : 'Student workspace'}</div><div className="hidden truncate text-xs text-[#8a8578] sm:block">Learn smarter. Organize better. Connect with purpose.</div></div><div className="flex items-center gap-2"><Link href="/pricing" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#c9c4b4] hover:bg-white/5">View Pro</Link><Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-brand-300">{(session?.user?.name || session?.user?.email || 'J').slice(0,1).toUpperCase()}</Link></div></div></header>
        <main className="px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </section>
    </div>
    <nav className="mobile-dock fixed bottom-0 left-0 right-0 z-40 flex lg:hidden overflow-x-auto border-t border-white/10 bg-ink/95 backdrop-blur-2xl px-1.5 py-1.5">{[...mainItems,...campusItems].map(([href,label,icon]) => <Link key={href} href={href} className={`min-w-[72px] flex-1 rounded-xl py-2 text-center text-[10px] ${pathname === href || pathname.startsWith(href + '/') ? 'bg-brand-600/15 text-brand-300' : 'text-[#6b6759]'}`}><div className="text-sm">{icon}</div><div className="mt-0.5">{label}</div></Link>)}</nav>
  </div>;
}
