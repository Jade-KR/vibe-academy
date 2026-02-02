"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="container py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        {t("hero.title")}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild>
          <Link href="/register">{t("hero.cta")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/pricing">{t("hero.secondaryCta")}</Link>
        </Button>
      </div>
    </section>
  );
}
