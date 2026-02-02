"use client";

import { useTranslations } from "next-intl";
import { Separator } from "@/shared/ui/separator";
import { PricingTable } from "./pricing-table";
import { PricingFaq } from "./pricing-faq";

export function PricingContent() {
  const t = useTranslations("pricing");

  return (
    <section className="container py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("description")}</p>
      </div>
      <PricingTable />
      <Separator className="my-16" />
      <PricingFaq />
    </section>
  );
}
