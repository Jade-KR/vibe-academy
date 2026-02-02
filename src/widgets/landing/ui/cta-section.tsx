"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui";
import { Link } from "@/i18n/navigation";

export function CtaSection() {
  const t = useTranslations("landing");

  return (
    <section className="py-24 text-center">
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("cta.subtitle")}</p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/register">{t("cta.button")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
