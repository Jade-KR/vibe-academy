"use client";

import { WelcomeCard } from "./welcome-card";
import { StatsCard } from "./stats-card";
import { QuickActions } from "./quick-actions";

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <WelcomeCard />
      <div className="grid gap-6 md:grid-cols-2">
        <StatsCard />
        <QuickActions />
      </div>
    </div>
  );
}
