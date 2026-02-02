"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import type { PricingPlan, BillingInterval } from "@/entities/subscription";

interface PricingCardProps {
  plan: PricingPlan;
  interval: BillingInterval;
}

const formatPrice = (price: number): string => new Intl.NumberFormat("ko-KR").format(price);

export function PricingCard({ plan, interval }: PricingCardProps) {
  const t = useTranslations("pricing");

  const price = plan.price[interval];
  const isFree = price === 0;
  const isPro = plan.id === "pro";

  return (
    <Card className={cn("flex flex-col", isPro && "ring-2 ring-primary")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          {isPro ? <Badge>{t("popular")}</Badge> : null}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6">
          {isFree ? (
            <span className="text-4xl font-bold">{t("free")}</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{formatPrice(price)}</span>
              <span className="text-muted-foreground">{t("currency")}</span>
              <span className="text-muted-foreground">
                {interval === "monthly" ? t("perMonth") : t("perYear")}
              </span>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium mb-3">{t("features")}</h4>
          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/register">{isFree ? t("getStarted") : t("subscribe")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
