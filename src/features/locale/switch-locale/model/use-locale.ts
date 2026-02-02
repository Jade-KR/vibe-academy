"use client";

import { useLocale as useNextIntlLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTransition } from "react";
import type { Locale } from "@/i18n/config";

export function useLocaleSwitch() {
  const locale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return {
    locale,
    locales: routing.locales,
    isPending,
    switchLocale,
  };
}
