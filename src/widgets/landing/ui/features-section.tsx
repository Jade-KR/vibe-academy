"use client";

import { useTranslations } from "next-intl";
import { Shield, CreditCard, Mail, Globe, Database, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui";
import type { LucideIcon } from "lucide-react";

interface FeatureItem {
  icon: LucideIcon;
  testId: string;
}

const FEATURES: FeatureItem[] = [
  { icon: Shield, testId: "icon-shield" },
  { icon: CreditCard, testId: "icon-credit-card" },
  { icon: Mail, testId: "icon-mail" },
  { icon: Globe, testId: "icon-globe" },
  { icon: Database, testId: "icon-database" },
  { icon: Activity, testId: "icon-activity" },
];

export function FeaturesSection() {
  const t = useTranslations("landing");

  return (
    <section className="bg-muted/50 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("features.subtitle")}</p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <Icon
                    className="mb-2 h-8 w-8 text-primary"
                    data-testid={feature.testId}
                    aria-hidden="true"
                  />
                  <CardTitle>{t(`features.items.${index}.title`)}</CardTitle>
                  <CardDescription>{t(`features.items.${index}.description`)}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
