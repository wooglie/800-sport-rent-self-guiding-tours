"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listTours, updateTour } from "@/lib/api";
import { TourForm } from "@/components/tours/TourForm";
import { LocaleTabSwitcher } from "@/components/tours/LocaleTabSwitcher";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Tour, Locale } from "@/types/tour";
import type { CreateTourRequest } from "@/types/api";

export default function EditTourPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const [tour, setTour] = useState<Tour | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("hr");

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    listTours()
      .then((tours) => {
        const found = tours.find((t) => t.id === id);
        if (found) {
          setTour(found);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Greška pri učitavanju")
      );
  }, [id]);

  async function handleSubmit(data: CreateTourRequest) {
    setError(null);
    setIsLoading(true);
    try {
      await updateTour(id, data);
      router.push("/tours");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri spremanju ture"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (notFound) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Tura nije pronađena.
      </p>
    );
  }

  if (!tour) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="-mt-8 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-sm -mx-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">
            Uredi turu — {tour.name.hr}
          </h1>
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
          initialValues={tour}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isEditing
          activeLocale={activeLocale}
        />
      </div>
    </div>
  );
}
