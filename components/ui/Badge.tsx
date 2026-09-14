import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "neutral" | "brand";
type Props = { children: ReactNode; tone?: Tone; className?: string };

// One consistent set of status colors for anything that represents a state —
// payment status, verification status, account status — instead of each
// page inventing its own ad-hoc pill styling. Kept distinct from the
// general brand accent: these carry meaning (paid vs pending vs failed),
// so they shouldn't share a color with decorative brand elements.
const toneClasses: Record<Tone, string> = {
  success: "border-acacia-500/35 bg-acacia-500/[0.14] text-acacia-300",
  warning: "border-brand-400/35 bg-brand-400/[0.12] text-brand-300",
  danger: "border-rust-500/35 bg-rust-500/[0.14] text-rust-400",
  neutral: "border-white/10 bg-white/[0.04] text-[#8a8578]",
  brand: "border-brand-500/25 bg-brand-500/[0.08] text-brand-300",
};

export default function Badge({ children, tone = "neutral", className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Maps a payment status string to the right Badge tone, so every place
 * that shows a payment status (admin finance, a receipt, a user's billing
 * history) agrees on what "pending" looks like. */
export function paymentStatusTone(status: string): Tone {
  if (status === "paid") return "success";
  if (status === "failed") return "danger";
  return "warning"; // pending
}
