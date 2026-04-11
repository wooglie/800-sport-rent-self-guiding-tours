"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/hooks/useAppState";
import { recordVisit } from "@/lib/session";
import { getTourSummary } from "@/catalog";
import { StoreInfo } from "@/components/ui/StoreInfo";
import type { Locale } from "@/types/tour";

interface TourDetailClientProps {
  id: string;
}

export function TourDetailClient({ id }: TourDetailClientProps) {
  const t = useTranslations("tours");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { appState, session, visitedTours } = useAppState();

  // While state is loading, show skeleton so we never flash "locked" incorrectly
  if (appState === "loading") {
    return (
      <div className="flex flex-col min-h-screen animate-pulse">
        <div className="h-64 bg-muted" />
        <div className="p-5 space-y-4">
          <div className="h-8 bg-muted rounded-xl w-3/4" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-12 bg-muted rounded-2xl mt-6" />
        </div>
      </div>
    );
  }

  const tour =
    appState === "active"
      ? session?.tours.find((tour) => tour.id === id) ?? getTourSummary(id)
      : getTourSummary(id);

  if (!tour) {
    return <div className="p-6 text-center text-muted-foreground">Tour not found.</div>;
  }

  const isVisited = visitedTours.some((v) => v.tourId === id);
  const canStart = appState === "active";
  const fullTour = appState === "active" ? session?.tours.find((t) => t.id === id) : null;

  function handleStart() {
    if (!fullTour) return;
    recordVisit(fullTour);
    router.push(`/${locale}/tour/${id}/active`);
  }

  const difficultyBadge = {
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    moderate: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    hard: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  }[tour.difficulty];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative h-72 bg-muted">
        <Image
          src={tour.coverImage}
          alt={tour.name[locale]}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        {isVisited && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
            {t("visited")}
          </div>
        )}

        {/* Title + stats overlaid on image bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-2">
            <h1 className="text-2xl font-bold text-white leading-tight flex-1">
              {tour.name[locale]}
            </h1>
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyBadge}`}>
              {tour.difficulty}
            </span>
          </div>
          <div className="flex gap-3 mt-2">
            <span className="text-white/80 text-sm">{tour.distance}</span>
            <span className="text-white/50">·</span>
            <span className="text-white/80 text-sm">{tour.duration}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Description */}
        <p className="text-muted-foreground leading-relaxed">
          {tour.description[locale]}
        </p>

        {/* Waypoint list or count */}
        {fullTour ? (
          <div className="space-y-2">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">
              {t("waypointCount", { count: fullTour.waypoints.length })}
            </h2>
            <div className="space-y-1.5">
              {fullTour.waypoints.map((wp, i) => (
                <div
                  key={wp.id}
                  className="p-3 bg-muted rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground">{wp.name[locale]}</span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {wp.pois && wp.pois.length > 0 && (
                          <span className="text-[11px] bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-medium px-2 py-0.5 rounded-full">
                            {wp.pois.length} {wp.pois.length === 1 ? "POI" : "POIs"}
                          </span>
                        )}
                        {wp.richDescription?.[locale] && (
                          <span className="text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-medium px-2 py-0.5 rounded-full">
                            {locale === "hr" ? "Priča" : "Story"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {wp.pois && wp.pois.length > 0 && (
                    <div className="mt-2 ml-10 space-y-1">
                      {wp.pois.map((poi, j) => (
                        <div key={poi.id} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-brand/20 text-brand text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {j + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">{poi.title[locale]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          "waypoints" in tour && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {t("waypointCount", { count: (tour as { waypoints: unknown[] }).waypoints.length })}
            </div>
          )
        )}

        {/* CTA */}
        <div className="pt-2">
          {canStart ? (
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-dark text-white font-bold text-base transition-colors shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
            >
              {t("start")}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-bold text-base text-center border border-card-border">
                {t("locked")}
              </div>
              <StoreInfo />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
