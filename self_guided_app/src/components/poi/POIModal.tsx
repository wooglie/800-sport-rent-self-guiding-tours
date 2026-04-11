"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Waypoint, Locale, POI } from "@/types/tour";
import { RichText } from "@/components/ui/RichText";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { POIDetailSheet } from "./POIDetailSheet";

const WalkingRouteMap = dynamic(
  () => import("@/components/map/WalkingRouteMap").then((m) => m.WalkingRouteMap),
  { ssr: false }
);

interface POIModalProps {
  waypoint: Waypoint | null;
  locale: Locale;
  onClose: () => void;
}

export function POIModal({ waypoint, locale, onClose }: POIModalProps) {
  const t = useTranslations("poi");
  const [richExpanded, setRichExpanded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);

  if (!waypoint) return null;

  const richContent = waypoint.richDescription?.[locale] ?? "";
  const isLong = richContent.length > 400;
  const hasWalkingRoute = (waypoint.walkingRoute?.length ?? 0) >= 2;

  return (
    <>
      {/* z-[1100] so it renders above Leaflet (z-1000) */}
      <div className="fixed inset-0 z-[1100] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div
          className="relative bg-card rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
          style={{ animation: "slideUp 0.25s ease-out" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-card-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-card-border flex-shrink-0">
            <h2 className="text-lg font-bold text-foreground">{waypoint.name[locale]}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              aria-label={t("close")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <ImageGallery images={waypoint.images} alt={waypoint.name[locale]} height="h-52" />

            <div className="px-4 py-4 space-y-4">
              {/* Short description */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {waypoint.description[locale]}
              </p>

              {/* Rich description */}
              {richContent && (
                <div>
                  <div className={isLong && !richExpanded ? "max-h-32 overflow-hidden relative" : ""}>
                    <RichText content={richContent} />
                    {isLong && !richExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card" />
                    )}
                  </div>
                  {isLong && (
                    <button
                      onClick={() => setRichExpanded(!richExpanded)}
                      className="text-sm font-semibold text-brand mt-2"
                    >
                      {richExpanded ? "↑" : t("readMore")}
                    </button>
                  )}
                </div>
              )}

              {/* Walking route mini-map */}
              {hasWalkingRoute && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    {locale === "hr" ? "Šetnja po lokaciji" : "Walking route"}
                  </p>
                  <div className="rounded-xl overflow-hidden border border-card-border">
                    <WalkingRouteMap
                      route={waypoint.walkingRoute!}
                      waypointLocation={waypoint.coordinates}
                      pois={waypoint.pois}
                      onPoiTap={setSelectedPoi}
                    />
                  </div>
                </div>
              )}

              {/* POI cards */}
              {waypoint.pois && waypoint.pois.length > 0 && (
                <div
                  className="flex gap-3 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {waypoint.pois.map((poi, i) => (
                    <button
                      key={poi.id}
                      onClick={() => setSelectedPoi(poi)}
                      className="flex-shrink-0 w-36 rounded-xl overflow-hidden border border-card-border bg-muted text-left"
                    >
                      <div className="relative h-20 bg-card-border">
                        {poi.images[0] && (
                          <Image src={poi.images[0]} alt={poi.title[locale]} fill className="object-cover" unoptimized />
                        )}
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-foreground line-clamp-2">
                          {poi.title[locale]}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPoi && (
        <POIDetailSheet poi={selectedPoi} locale={locale} onClose={() => setSelectedPoi(null)} />
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
