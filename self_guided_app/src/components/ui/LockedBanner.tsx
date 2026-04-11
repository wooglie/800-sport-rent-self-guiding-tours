"use client";

import { useTranslations } from "next-intl";
import { StoreInfo } from "./StoreInfo";

export function LockedBanner() {
  const t = useTranslations("expired");

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600 dark:text-amber-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-amber-900 dark:text-amber-200">{t("title")}</h2>
          <p className="text-amber-700 dark:text-amber-300 text-sm">{t("body")}</p>
        </div>
      </div>
      <StoreInfo />
    </div>
  );
}
