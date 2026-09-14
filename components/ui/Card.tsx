import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** "flat" for quiet content grouping, "raised" for the one surface per
   * section that should stand out (e.g. a highlighted upsell or callout). */
  variant?: "flat" | "raised";
};

export default function Card({ children, className = "", variant = "flat" }: Props) {
  const base = variant === "raised" ? "hero-surface rounded-[1.25rem]" : "border border-white/10 bg-white/[0.03] rounded-xl";
  return <div className={`${base} p-5 ${className}`}>{children}</div>;
}
