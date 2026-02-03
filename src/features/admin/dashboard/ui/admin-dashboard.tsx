"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DollarSign, Users, UserPlus, CreditCard } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAdminAnalytics } from "../model/use-admin-analytics";
import { AdminStatsCard } from "./admin-stats-card";

const PERIODS = ["7d", "30d", "90d", "all"] as const;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
}

export function AdminDashboard() {
  const [period, setPeriod] = useState<string>("30d");
  const t = useTranslations("admin");
  const { analytics, isLoading } = useAdminAnalytics(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className={cn("min-w-[48px]")}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatsCard
            title={t("dashboard.totalRevenue")}
            value={formatCurrency(analytics?.revenue.total ?? 0)}
            icon={DollarSign}
          />
          <AdminStatsCard
            title={t("dashboard.totalEnrollments")}
            value={String(analytics?.enrollments ?? 0)}
            icon={Users}
          />
          <AdminStatsCard
            title={t("dashboard.totalStudents")}
            value={String(analytics?.newUsers ?? 0)}
            icon={UserPlus}
          />
          <AdminStatsCard
            title={t("analytics.payments")}
            value={String(analytics?.revenue.count ?? 0)}
            icon={CreditCard}
          />
        </div>
      )}
    </div>
  );
}
