"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { useUser } from "@/entities/user";
import { PRICING_PLANS } from "@/entities/subscription";

export function StatsCard() {
  const t = useTranslations("dashboard.stats");
  const { isLoading } = useUser();

  // Default to FREE plan since no subscription API exists yet
  const plan = PRICING_PLANS.FREE;

  if (isLoading) {
    return (
      <Card data-testid="stats-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    );
  }

  const formatLimit = (value: number, type: "api" | "storage") => {
    if (value === -1) return t("unlimited");
    if (type === "api") return t("perMonth", { count: value });
    return t("mb", { count: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="secondary">{plan.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("features")}</p>
          <ul className="mt-2 space-y-1">
            {plan.features.map((feature) => (
              <li key={feature} className="text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("apiCalls")}</p>
            <p className="text-lg font-semibold">{formatLimit(plan.limits.apiCalls, "api")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("storage")}</p>
            <p className="text-lg font-semibold">{formatLimit(plan.limits.storage, "storage")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
