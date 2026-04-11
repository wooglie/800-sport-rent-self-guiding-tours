type Locale = "hr" | "en";

type LocaleTabSwitcherProps = {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
};

export function LocaleTabSwitcher({
  activeLocale,
  onChange,
}: LocaleTabSwitcherProps) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {(["hr", "en"] as Locale[]).map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
            activeLocale === locale
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
