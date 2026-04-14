"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

const LOCALE_KEY = process.env.NEXT_PUBLIC_LOCALE_KEY ?? "sport_rent_locale";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    localStorage.setItem(LOCALE_KEY, next);
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.replace(newPath);
  }

  return (
    <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
      {["hr", "en"].map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`${compact ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm"} rounded-lg font-semibold transition-all ${
            locale === loc
              ? "bg-brand text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
