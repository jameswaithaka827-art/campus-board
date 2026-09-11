import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardShell from "../dashboard/dashboard-shell";
import BillingButton from "./billing-button";
import RoleSelector from "./role-selector";
import TimezoneSelector from "./timezone-selector";
import AvatarUpload from "./avatar-upload";
import { getRemainingActions } from "@/lib/ai-usage";
import { getEntitlements } from "@/lib/entitlements";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  // A *real* paid subscription (only meaningful once Stripe/Pesapal is
  // configured and FREE_MODE is off) — separate from entitlements below,
  // which also reflects the free-mode override everyone currently gets.
  const hasRealSubscription = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";
  const ent = getEntitlements(user.subscriptionStatus);
  const remaining = getRemainingActions(user.chatMessageCount, user.chatUsageMonth, ent.aiMonthlyLimit);

  return (
    <DashboardShell>
      <div className="max-w-lg">
        <p className="eyebrow">Your account</p>
        <h1 className="font-display mt-2 text-2xl">Account</h1>

        <div className="glass-panel rounded-xl p-6 mt-6 mb-4 space-y-5">
          <div>
            <p className="mini-label mb-2">Profile</p>
            <AvatarUpload initialUrl={user.avatarUrl} name={user.name} />
          </div>
          <p className="mini-label mb-1">Current plan</p>
          <p className="font-display text-xl">{hasRealSubscription ? "Pro" : "Free"}</p>
          {!hasRealSubscription && ent.isPro && (
            <p className="text-xs text-emerald-400">All Pro features are currently included free.</p>
          )}

          {hasRealSubscription ? (
            <BillingButton />
          ) : (
            <>
              <p className="text-sm text-[#8a8578] mb-4">
                {remaining} free AI actions remaining this month.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg text-sm font-medium text-ink"
              >
                See plan details
              </Link>
            </>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div>
            <p className="mini-label mb-1">How you use James AI</p>
            <p className="text-xs text-[#6b6759] mb-3">
              Changes the labels and AI prompts used on the Notes page.
            </p>
            <RoleSelector currentRole={user.role} />
          </div>
          <TimezoneSelector current={user.timeZone} />
        </div>
      </div>
    </DashboardShell>
  );
}
