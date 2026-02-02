"use client";

import { useTranslations } from "next-intl";
import { User, Shield, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Link } from "@/i18n/navigation";

const actions = [
  {
    labelKey: "editProfile" as const,
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    labelKey: "accountSettings" as const,
    href: "/dashboard/settings/account",
    icon: Shield,
  },
  {
    labelKey: "viewPricing" as const,
    href: "/pricing",
    icon: CreditCard,
  },
];

export function QuickActions() {
  const t = useTranslations("dashboard.actions");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((action) => (
            <Button key={action.labelKey} variant="outline" className="w-full" asChild>
              <Link href={action.href}>
                <action.icon className="mr-2 h-4 w-4" />
                {t(action.labelKey)}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
