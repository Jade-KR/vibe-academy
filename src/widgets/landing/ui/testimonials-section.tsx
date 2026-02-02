"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";

const TESTIMONIAL_COUNT = 3;

export function TestimonialsSection() {
  const t = useTranslations("landing");

  return (
    <section className="bg-muted/50 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("testimonials.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("testimonials.subtitle")}</p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: TESTIMONIAL_COUNT }, (_, index) => (
            <Card key={index}>
              <CardHeader>
                <blockquote className="text-muted-foreground italic">
                  {t(`testimonials.items.${index}.quote`)}
                </blockquote>
                <CardTitle className="mt-4">{t(`testimonials.items.${index}.name`)}</CardTitle>
                <CardDescription>{t(`testimonials.items.${index}.role`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
