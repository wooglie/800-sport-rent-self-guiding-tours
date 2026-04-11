"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Tour, TourSummary, Locale } from "@/types/tour";
import { StoreInfo } from "@/components/ui/StoreInfo";

type CardState = "available" | "visited" | "locked";

interface TourCardProps {
  tour: Tour | TourSummary;
  locale: Locale;
  state: CardState;
  onStart?: () => void;
  priority?: boolean;
}

const difficultyLabel: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

const difficultyColor: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  moderate:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

export function TourCard({ tour, locale, state, onStart, priority }: TourCardProps) {
  const t = useTranslations("tours");
  const [showStore, setShowStore] = useState(false);

  return (
    <article className="rounded-2xl overflow-hidden bg-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
      {/* Cover image */}
      <div className="relative h-48 bg-muted">
        <Image
          src={tour.coverImage}
          alt={tour.name[locale]}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 640px"
          unoptimized
          priority={priority}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyColor[tour.difficulty]}`}
          >
            {difficultyLabel[tour.difficulty]}
          </span>
          {state === "visited" && (
            <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </svg>
              {t("visited")}
            </span>
          )}
        </div>

        {/* Locked overlay */}
        {state === "locked" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
            <div className="bg-white/10 backdrop-blur rounded-full p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Bottom stats overlay */}
        <div className="absolute bottom-3 left-3 flex gap-3">
          <span className="flex items-center gap-1 text-white text-xs font-medium bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M8 1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM4.5 4.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                clipRule="evenodd"
              />
              <path d="M3.5 10.5a4.5 4.5 0 0 1 9 0v.213A6.75 6.75 0 0 1 8 12.25a6.75 6.75 0 0 1-4.5-1.537V10.5Z" />
            </svg>
            {tour.distance}
          </span>
          <span className="flex items-center gap-1 text-white text-xs font-medium bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z"
                clipRule="evenodd"
              />
            </svg>
            {tour.duration}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground leading-snug">
          {tour.name[locale]}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {tour.description[locale]}
        </p>

        {state === "locked" ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowStore(!showStore)}
              className="w-full py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2 border border-card-border"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              {t("locked")}
            </button>
            {showStore && <StoreInfo />}
          </div>
        ) : (
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm transition-colors shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
          >
            {t("preview")}
          </button>
        )}
      </div>
    </article>
  );
}
