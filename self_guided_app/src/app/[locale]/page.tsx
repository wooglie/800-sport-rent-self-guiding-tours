"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAppState } from "@/hooks/useAppState";
import { LandingPage } from "@/components/ui/LandingPage";
import { TourCard } from "@/components/tour/TourCard";
import { LockedBanner } from "@/components/ui/LockedBanner";
import { ShareButton } from "@/components/ui/ShareButton";
import { TOUR_CATALOG } from "@/catalog";
import type { Locale } from "@/types/tour";

export default function TourListPage() {
  const t = useTranslations("tours");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { appState, session, visitedTours } = useAppState();

  const visitedIds = new Set(visitedTours.map((v) => v.tourId));

  if (appState === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="px-4 py-4 border-b border-card-border flex items-center justify-between">
          <div className="h-7 w-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
        </header>
        <div className="flex flex-col gap-4 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-muted h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (appState === "no_access") {
    return <LandingPage />;
  }

  const tours = appState === "active" ? (session?.tours ?? []) : TOUR_CATALOG;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-card-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        {appState === "active" && session && (
          <ShareButton token={session.token} />
        )}
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {appState === "expired" && <LockedBanner />}

        {tours.map((tour, i) => {
          const isVisited = visitedIds.has(tour.id);
          const state =
            appState === "expired"
              ? isVisited
                ? "visited"
                : "locked"
              : isVisited
              ? "visited"
              : "available";

          return (
            <TourCard
              key={tour.id}
              tour={tour}
              locale={locale}
              state={state}
              onStart={() => router.push(`/${locale}/tour/${tour.id}`)}
              priority={i === 0}
            />
          );
        })}
      </main>
    </div>
  );
}
