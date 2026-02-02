"use client";

import { useTranslations } from "next-intl";
import { BookOpen, BarChart3, Rocket } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";
import type { LucideIcon } from "lucide-react";

interface ValuePropItem {
  icon: LucideIcon;
}

const VALUE_PROPS: ValuePropItem[] = [{ icon: BookOpen }, { icon: BarChart3 }, { icon: Rocket }];

export function ValuePropositionSection() {
  const t = useTranslations("landing");

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("valueProp.title")}
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">{t("valueProp.subtitle")}</p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {VALUE_PROPS.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{t(`valueProp.items.${index}.title`)}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  {t(`valueProp.items.${index}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
