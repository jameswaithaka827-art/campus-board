import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DeleteAccountForm from "./delete-form";

export default async function DeleteAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <main className="min-h-screen grid place-items-center"><Link className="text-brand-300 underline" href="/login">Sign in to manage your account</Link></main>;
  return <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12"><div className="mx-auto max-w-xl rounded-3xl border border-red-500/20 bg-white/[0.03] p-7"><p className="text-sm text-red-300">Account & data</p><h1 className="text-3xl font-bold mt-1">Delete your James AI account</h1><p className="mt-3 text-slate-400">This permanently removes your profile and associated James AI records. This action cannot be undone.</p><DeleteAccountForm/><Link href="/account" className="mt-5 inline-block text-sm text-slate-400 underline">Cancel</Link></div></main>;
}
