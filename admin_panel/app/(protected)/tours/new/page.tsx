"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTour } from "@/lib/api";
import { TourForm } from "@/components/tours/TourForm";
import { LocaleTabSwitcher } from "@/components/tours/LocaleTabSwitcher";
import type { CreateTourRequest } from "@/types/api";
import type { Locale } from "@/types/tour";

export default function NewTourPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("hr");

  async function handleSubmit(tour: CreateTourRequest) {
    setError(null);
    setIsLoading(true);
    try {
      await createTour(tour);
      router.push("/tours");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri kreiranju ture");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="-mt-8 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-sm -mx-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">Nova tura</h1>
          <div className="flex items-center gap-3">
            <LocaleTabSwitcher activeLocale={activeLocale} onChange={setActiveLocale} />
            <span className="hidden text-sm text-slate-500 sm:block">Jezik koji se uređuje</span>
          </div>
        </div>
      </div>

      {/* Scrollable form body */}
      <div className="py-8">
        {error && (
          <p className="mb-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <TourForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          activeLocale={activeLocale}
        />
      </div>
    </div>
  );
}
