"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/hooks/useAppState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProximity } from "@/hooks/useProximity";
import { useWakeLock } from "@/hooks/useWakeLock";
import { POIModal } from "@/components/poi/POIModal";
import { POIDetailSheet } from "@/components/poi/POIDetailSheet";
import { TourProgress } from "@/components/tour/TourProgress";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import type { Waypoint, Locale, POI } from "@/types/tour";

const TourMap = dynamic(() => import("@/components/map/TourMap"), { ssr: false });

interface ActiveTourClientProps {
  id: string;
}

export function ActiveTourClient({ id }: ActiveTourClientProps) {
  const t = useTranslations("active");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const { appState, session } = useAppState();
  const { position, error: gpsError } = useGeolocation();
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(null);
  const [activePoi, setActivePoi] = useState<POI | null>(null);
  const [dismissedGpsError, setDismissedGpsError] = useState(false);

  useWakeLock();

  useEffect(() => {
    if (appState !== "loading" && appState !== "active") {
      router.replace(`/${locale}`);
    }
  }, [appState, locale, router]);

  const tour = session?.tours.find((tour) => tour.id === id);

  const { triggeredWaypoint, triggeredIds } = useProximity(
    tour?.waypoints ?? [],
    position
  );

  useEffect(() => {
    if (triggeredWaypoint && triggeredWaypoint.id !== activeWaypoint?.id) {
      setActiveWaypoint(triggeredWaypoint);
    }
  }, [triggeredWaypoint, activeWaypoint?.id]);

  function handleBack() {
    const confirmed = window.confirm(t("exit_confirm"));
    if (confirmed) router.back();
  }

  if (appState === "loading" || !tour) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-card-border border-t-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Top bar — z-[1001] to sit above Leaflet controls (z-1000) but below modals */}
      <div className="absolute top-0 left-0 right-0 z-[1001] flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-card-border">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-foreground truncate text-sm">
            {tour.name[locale]}
          </h1>
          <TourProgress
            tour={tour}
            userPosition={position}
            visitedCount={triggeredIds.size}
          />
        </div>
        <LanguageSwitcher compact />
      </div>

      {/* Full-screen map */}
      <div className="flex-1 min-h-0 mt-[57px]">
        <MapErrorBoundary>
        <TourMap
          tour={tour}
          userPosition={position}
          activeWaypointId={activeWaypoint?.id ?? null}
          onWaypointTap={setActiveWaypoint}
          onPoiTap={setActivePoi}
        />
        </MapErrorBoundary>
      </div>

      {/* GPS error banner — z-[1001] same level as top bar */}
      {gpsError && !dismissedGpsError && (
        <div className="absolute bottom-6 left-4 right-4 z-[1001] bg-amber-500 text-white text-sm font-medium rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
          <span>{tErrors("gps")}</span>
          <button onClick={() => setDismissedGpsError(true)} className="ml-3 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      <POIModal
        waypoint={activeWaypoint}
        locale={locale}
        onClose={() => setActiveWaypoint(null)}
      />

      <POIDetailSheet
        poi={activePoi}
        locale={locale}
        onClose={() => setActivePoi(null)}
      />
    </div>
  );
}
