import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success";
type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  // Marigold fill — the one accent-filled action per view. Use for the
  // single most important action on a screen, not every button.
  primary: "bg-brand-600 text-ink hover:bg-brand-500",
  // Default choice for most actions — quiet, doesn't compete for attention.
  secondary: "border border-white/10 bg-white/[0.03] text-[#f4efe4] hover:bg-white/[0.06]",
  // No border/fill at rest — for tertiary actions inside cards, toolbars.
  ghost: "text-[#c9c4b4] hover:text-[#f4efe4] hover:bg-white/5",
  // Acacia green — reserved for confirming/completing something (payments,
  // verification), not general-purpose positive actions.
  success: "bg-acacia-500 text-[#f4efe4] hover:bg-acacia-600",
};

const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";

export default function Button({ children, href, onClick, variant = "secondary", type = "button", disabled, className = "" }: Props) {
  const classes = `${base} ${variantClasses[variant]} ${className}`;
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={classes}>{children}</button>;
}
