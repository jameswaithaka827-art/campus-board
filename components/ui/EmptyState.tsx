import type { ReactNode } from "react";

type Props = { title: string; action?: ReactNode; className?: string };

export default function EmptyState({ title, action, className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-dashed border-white/10 p-6 text-center ${className}`}>
      <p className="text-sm text-[#8a8578]">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
