type Props = { label: string; value: string; sublabel?: string };

export default function StatCard({ label, value, sublabel }: Props) {
  return (
    <div className="stat-card">
      <div className="mini-label">{label}</div>
      {/* tabular-nums keeps digits fixed-width so a column of numbers
          lines up — standard practice for financial/metric displays,
          otherwise proportional digits make amounts look uneven. */}
      <div className="font-display mt-2 text-2xl" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-[#6b6759]">{sublabel}</div>}
    </div>
  );
}
