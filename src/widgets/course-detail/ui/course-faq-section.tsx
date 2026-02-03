"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Separator,
} from "@/shared/ui";

const FAQ_INDICES = [0, 1, 2, 3] as const;

export function CourseFaqSection() {
  const t = useTranslations("course");

  return (
    <section className="mb-8">
      <Separator className="mb-8" />
      <h2 className="mb-4 text-xl font-semibold text-foreground">{t("faq.title")}</h2>
      <Accordion type="single" collapsible>
        {FAQ_INDICES.map((index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-sm font-medium">
              {t(`detail.faq.items.${index}.q`)}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`detail.faq.items.${index}.a`)}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
