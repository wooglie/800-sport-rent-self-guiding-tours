"use client";

import { useTranslations } from "next-intl";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const t = useTranslations("errors");
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2000] bg-slate-800 text-white text-xs font-medium text-center py-2 px-4 flex items-center justify-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-3.5 h-3.5 flex-shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M8.111 8.111A5.25 5.25 0 0 0 6.75 12a5.25 5.25 0 0 0 5.25 5.25 5.25 5.25 0 0 0 3.139-1.027M10.5 10.5a3 3 0 0 1 4.243 4.243M4.5 4.5l15 15"
        />
      </svg>
      {t("offlineBanner")}
    </div>
  );
}
