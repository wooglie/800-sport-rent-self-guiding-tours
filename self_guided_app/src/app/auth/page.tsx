"use client";

import { Suspense, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import hrMessages from "@/messages/hr.json";
import enMessages from "@/messages/en.json";
import { AuthContent } from "./AuthContent";

type SupportedLocale = "hr" | "en";
const allMessages = { hr: hrMessages, en: enMessages };
const LOCALE_KEY = process.env.NEXT_PUBLIC_LOCALE_KEY ?? "sport_rent_locale";

export default function AuthPage() {
  const [locale, setLocale] = useState<SupportedLocale>("hr");

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "hr") setLocale(stored as SupportedLocale);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={allMessages[locale]}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </NextIntlClientProvider>
  );
}
