import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PlannerPanel from "./planner-panel";

export default async function PlannerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <Link href="/dashboard" className="font-bold">James AI</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">Chat</Link>
          <Link href="/dashboard/notes" className="text-sm text-white/60 hover:text-white">Notes</Link>
          <Link href="/dashboard/time" className="text-sm text-white/60 hover:text-white">Time Tracking</Link>
          <Link href="/account" className="text-sm text-white/60 hover:text-white">Account</Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <PlannerPanel role={user.role} />
      </div>
    </main>
  );
}
