"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { DollarSign, Users, UserPlus, CreditCard } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useAdminAnalytics, AdminStatsCard } from "@/features/admin/dashboard";

const RevenueChart = dynamic(() => import("./revenue-chart"), { ssr: false });
const ActivityChart = dynamic(() => import("./activity-chart"), { ssr: false });

const PERIODS = ["7d", "30d", "90d", "all"] as const;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<string>("30d");
  const t = useTranslations("admin");

  const { analytics, isLoading } = useAdminAnalytics(period);

  const revenueData = analytics
    ? [{ name: t("analytics.revenue"), value: analytics.revenue.total }]
    : [];

  const activityData = analytics
    ? [
        { name: t("analytics.payments"), value: analytics.revenue.count },
        { name: t("dashboard.totalEnrollments"), value: analytics.enrollments },
        { name: t("dashboard.totalStudents"), value: analytics.newUsers },
      ]
    : [];

  const isAllZero =
    analytics &&
    analytics.revenue.total === 0 &&
    analytics.revenue.count === 0 &&
    analytics.enrollments === 0 &&
    analytics.newUsers === 0;

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("analytics.title")}</h1>
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

      {/* Stat cards */}
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
            description={
              analytics?.revenue.average
                ? `${t("analytics.payments")}: ${formatCurrency(analytics.revenue.average)} avg`
                : undefined
            }
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("analytics.revenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAllZero ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {t("analytics.noData")}
              </div>
            ) : (
              <RevenueChart data={revenueData} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>

        {/* Activity chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("analytics.summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAllZero ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {t("analytics.noData")}
              </div>
            ) : (
              <ActivityChart data={activityData} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
