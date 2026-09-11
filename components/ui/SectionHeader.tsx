import type { ReactNode } from "react";

type Props = { eyebrow: string; title: string; action?: ReactNode };

export default function SectionHeader({ eyebrow, title, action }: Props) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display mt-1 text-xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
