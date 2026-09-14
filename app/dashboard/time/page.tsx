import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import TimeTracker from "./time-tracker";

export default async function TimeTrackingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <Link href="/dashboard" className="font-bold">James AI</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">Chat</Link>
          <Link href="/dashboard/notes" className="text-sm text-white/60 hover:text-white">Notes</Link>
          <Link href="/dashboard/planner" className="text-sm text-white/60 hover:text-white">Planner</Link>
          <Link href="/account" className="text-sm text-white/60 hover:text-white">Account</Link>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Time Tracking</h1>
        <TimeTracker />
      </div>
    </main>
  );
}
