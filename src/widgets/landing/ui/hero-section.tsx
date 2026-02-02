"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="container py-16 md:py-24">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Button size="lg" asChild>
              <Link href="/courses">{t("hero.cta")}</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/reviews">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto aspect-video w-full max-w-lg lg:max-w-none">
          <Image
            src="/images/hero-illustration.svg"
            alt={t("hero.imageAlt")}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}
