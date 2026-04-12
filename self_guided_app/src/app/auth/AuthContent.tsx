"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { validateToken, fetchTours } from "@/lib/api";
import { getSession, isSessionValid, saveSession } from "@/lib/session";
import { cacheTourAssets } from "@/lib/mapCache";
import { StoreInfo } from "@/components/ui/StoreInfo";

type Status =
  | "validating"
  | "invalid"
  | "expired_token"
  | "network_error"
  | "server_error"
  | "done";

const LOCALE_KEY = process.env.NEXT_PUBLIC_LOCALE_KEY ?? "sport_rent_locale";

export function AuthContent() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("validating");

  const code = searchParams.get("token") ?? "";

  function getRedirectLocale(): string {
    if (typeof localStorage === "undefined") return "hr";
    return localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "hr";
  }

  async function validate() {
    if (!code) {
      router.replace("/");
      return;
    }

    // Already have a valid session for this exact token? Redirect immediately.
    // If a different token is provided (new QR code), fall through to re-validate.
    const existing = getSession();
    if (existing && isSessionValid(existing) && existing.token === code) {
      router.replace(`/${getRedirectLocale()}`);
      return;
    }

    setStatus("validating");

    try {
      const result = await validateToken(code);

      if (!result.valid) {
        setStatus(result.reason === "expired" ? "expired_token" : "invalid");
        return;
      }

      const tours = await fetchTours(result.jwt);
      saveSession({
        token: code,
        expiresAt: result.expiresAt,
        createdAt: new Date().toISOString(),
        tours,
      });

      // Cache assets in background (don't await, so we don't block redirect)
      cacheTourAssets(tours).catch(() => {});

      setStatus("done");
      router.replace(`/${getRedirectLocale()}`);
    } catch (err) {
      setStatus(err === "network_error" ? "network_error" : "server_error");
    }
  }

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "validating" || status === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">{t("validating")}</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-red-600 dark:text-red-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("invalid")}</p>
      </div>
    );
  }

  if (status === "expired_token") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {t("expired_token")}
          </p>
        </div>
        <StoreInfo />
      </div>
    );
  }

  // network_error or server_error
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
      <p className="text-zinc-600 dark:text-zinc-400">{t("error")}</p>
      <button
        onClick={validate}
        className="px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold"
      >
        {t("retry")}
      </button>
    </div>
  );
}
