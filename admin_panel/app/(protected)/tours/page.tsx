"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listTours, deleteTour } from "@/lib/api";
import { TourTable } from "@/components/tours/TourTable";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Tour } from "@/types/tour";

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTours()
      .then(setTours)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Greška pri učitavanju")
      );
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteTour(id);
      setTours((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri brisanju");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ture</h1>
        <Link
          href="/tours/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nova tura
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {tours ? (
        <TourTable tours={tours} onDelete={handleDelete} />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}
