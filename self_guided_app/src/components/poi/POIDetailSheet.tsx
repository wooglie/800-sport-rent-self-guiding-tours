"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { POI, Locale } from "@/types/tour";
import { RichText } from "@/components/ui/RichText";
import { ImageGallery } from "@/components/ui/ImageGallery";

interface POIDetailSheetProps {
  poi: POI | null;
  locale: Locale;
  onClose: () => void;
}

function extractVideoEmbed(url: string): string | null {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export function POIDetailSheet({ poi, locale, onClose }: POIDetailSheetProps) {
  const t = useTranslations("poi");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  if (!poi) return null;

  const embedUrl = poi.videoUrl ? extractVideoEmbed(poi.videoUrl) : null;

  return (
    // z-[1200] — above POIModal (1100) and Leaflet (1000)
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border flex-shrink-0">
          <h2 className="text-base font-bold text-foreground flex-1 pr-4 line-clamp-1">
            {poi.title[locale]}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0"
            aria-label={t("close")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <ImageGallery images={poi.images} alt={poi.title[locale]} height="h-56" />

          <div className="px-4 py-4 space-y-4">
            <RichText content={poi.description[locale]} />

            {poi.videoUrl && (
              <div>
                {isOnline && embedUrl ? (
                  <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t("videoOffline")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
