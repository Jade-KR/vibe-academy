"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/shared/ui/switch";
import { getAllPlans } from "@/entities/subscription";
import type { BillingInterval } from "@/entities/subscription";
import { PricingCard } from "./pricing-card";

export function PricingTable() {
  const t = useTranslations("pricing");
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const plans = getAllPlans();

  const isYearly = interval === "yearly";

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="text-sm font-medium">{t("monthly")}</span>
        <Switch
          checked={isYearly}
          onCheckedChange={(checked) => setInterval(checked ? "yearly" : "monthly")}
          aria-label="Toggle billing interval"
        />
        <span className="text-sm font-medium">{t("yearly")}</span>
      </div>
      {isYearly ? (
        <p className="text-center text-sm text-muted-foreground mb-8">{t("yearlyDiscount")}</p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} interval={interval} />
        ))}
      </div>
    </div>
  );
}
