import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.needsEmailVerification) redirect("/account/verify-email");
  if (session.user.needsPasswordSetup) redirect("/account/security");
  return <DashboardShell>{children}</DashboardShell>;
}
