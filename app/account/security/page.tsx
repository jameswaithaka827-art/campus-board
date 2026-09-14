import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PasswordForm from "./password-form";

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!user) redirect("/login");
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        <div className="mb-7">
          <p className="text-sm text-brand-300">James AI Security</p>
          <h1 className="text-3xl font-bold mt-2">Finish securing your account</h1>
          <p className="text-white/50 mt-2">You are verified by Google. Now create a strong backup password for password sign-in.</p>
        </div>
        <PasswordForm hasExistingPassword={Boolean(user.passwordHash)} />
      </div>
    </main>
  );
}
