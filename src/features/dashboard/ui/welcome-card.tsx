"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useUser } from "@/entities/user";

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "greetingMorning";
  if (hour < 18) return "greetingAfternoon";
  return "greetingEvening";
}

export function WelcomeCard() {
  const t = useTranslations("dashboard.welcome");
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <Card data-testid="welcome-skeleton">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  const greetingKey = getGreetingKey();
  const displayName = user?.name || user?.email || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t(greetingKey, { name: displayName })}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </CardContent>
    </Card>
  );
}
