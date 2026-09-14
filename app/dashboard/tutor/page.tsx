import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import ChatPanel from "../chat-panel";

export default async function TutorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { subscriptionStatus: true, role: true } });
  if (!user) redirect("/login");
  const entitlements = getEntitlements(user.subscriptionStatus);
  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-[1.5rem] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="eyebrow">James AI Tutor</p>
          <h1 className="font-display mt-3 text-3xl leading-tight sm:text-4xl">Study with an AI tutor that fits your workflow.</h1>
          <p className="mt-3 text-[#b8b3a2]">Ask for explanations, examples, quizzes, revision notes, flashcards, or help understanding a photo of your class work.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#c9c4b4]">
            {[["Explain", "Break down difficult topics"], ["Quiz", "Test your understanding"], ["Revise", "Build revision notes"], ["Images", `${entitlements.maxChatImages} photo${entitlements.maxChatImages === 1 ? "" : "s"} per request`]].map(([a,b]) => <span key={a} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2"><strong className="text-[#f4efe4]">{a}</strong> · {b}</span>)}
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Explain a topic", "Paste a question or concept and ask for a step-by-step explanation."],
          ["Make revision questions", "Ask James AI to turn your notes into practice questions and answers."],
          ["Use your study material", "Upload JPG/PNG/WebP photos of notes or diagrams for visual help."],
        ].map(([title, desc]) => <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-[#8a8578]">{desc}</p></div>)}
      </div>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Tutor workspace</h2><p className="text-xs text-[#8a8578]">Your existing James AI conversation stays available here.</p></div><Link href="/pricing" className="text-xs text-brand-300">{entitlements.isPro ? "Pro active" : "See Pro"}</Link></div>
        <ChatPanel isPro={entitlements.isPro} maxImages={entitlements.maxChatImages} />
      </section>
    </div>
  );
}
