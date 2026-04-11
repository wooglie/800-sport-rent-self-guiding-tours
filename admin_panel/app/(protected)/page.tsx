"use client";

import { useEffect, useState } from "react";
import { getTokenStats } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { TokenStats } from "@/types/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTokenStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Greška pri učitavanju")
      );
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nadzorna ploča</h1>
        <p className="mt-1 text-sm text-slate-500">Pregled aktivnosti pristupnih tokena</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <StatsCard label="Aktivni danas" value={stats.activeToday} accent="emerald" />
            <StatsCard label="Istekli" value={stats.expired} accent="rose" />
            <StatsCard label="Ukupno" value={stats.total} accent="indigo" />
            <StatsCard label="Nije skenirano" value={stats.notScanned} accent="amber" />
          </>
        ) : (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        )}
      </div>
    </div>
  );
}
