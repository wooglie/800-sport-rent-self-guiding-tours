type StatsCardProps = {
  label: string;
  value: number | string;
  description?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose";
};

const ACCENT_CLASSES = {
  indigo: "border-l-indigo-500 text-indigo-600",
  emerald: "border-l-emerald-500 text-emerald-600",
  amber: "border-l-amber-500 text-amber-600",
  rose: "border-l-rose-500 text-rose-600",
};

export function StatsCard({
  label,
  value,
  description,
  accent = "indigo",
}: StatsCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 bg-white p-6 shadow-sm ${ACCENT_CLASSES[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-4xl font-bold`}>{value}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      )}
    </div>
  );
}
