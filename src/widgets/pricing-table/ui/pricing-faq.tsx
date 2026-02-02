"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/ui/accordion";

const FAQ_KEYS = ["q1", "q2", "q3", "q4"] as const;

export function PricingFaq() {
  const t = useTranslations("pricing.faq");

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-center mb-8">{t("title")}</h2>
      <Accordion type="single" collapsible>
        {FAQ_KEYS.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger>{t(key)}</AccordionTrigger>
            <AccordionContent>
              {t(key.replace("q", "a") as "a1" | "a2" | "a3" | "a4")}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
