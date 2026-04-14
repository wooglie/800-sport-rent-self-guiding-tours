"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { POI, Locale } from "@/types/tour";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (!poi) return null;

  const embedUrl = poi.videoUrl ? extractVideoEmbed(poi.videoUrl) : null;

  return (
    // z-[1200] — above POIModal (1100) and Leaflet (1000)
    <BottomSheet
      title={
        <h2 className="text-base font-bold text-foreground line-clamp-1">
          {poi.title[locale]}
        </h2>
      }
      onClose={onClose}
      zIndex={1200}
      partialRatio={0.88}
      topOffset={57}
      closeThreshold={0.55}
      snapUpPx={40}
      snapDownPx={80}
      backdropOpacity={50}
    >
      <ImageGallery images={poi.images} alt={poi.title[locale]} height="h-56" />

      <div className="px-4 py-4 space-y-4">
        <RichText content={poi.description[locale]} />

        {poi.videoUrl && (
          <div>
            {isOnline && embedUrl ? (
              <div
                className="relative w-full rounded-xl overflow-hidden"
                style={{ paddingBottom: "56.25%" }}
              >
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
    </BottomSheet>
  );
}
