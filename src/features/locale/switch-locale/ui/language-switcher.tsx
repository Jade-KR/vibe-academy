"use client";

import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "../model/use-locale";
import type { Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("locale");
  const { locale, locales, isPending, switchLocale } = useLocaleSwitch();

  return (
    <div className="relative inline-flex items-center">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        disabled={isPending}
        aria-label={t("switchLanguage")}
        className="appearance-none rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
      {isPending ? (
        <span className="pointer-events-none absolute right-2 h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      ) : null}
    </div>
  );
}
