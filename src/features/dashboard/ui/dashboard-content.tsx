"use client";

import { WelcomeCard } from "./welcome-card";
import { MyCoursesSection } from "./my-courses-section";
import { StatsCard } from "./stats-card";
import { QuickActions } from "./quick-actions";

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <WelcomeCard />
      <MyCoursesSection />
      <div className="grid gap-6 md:grid-cols-2">
        <StatsCard />
        <QuickActions />
      </div>
    </div>
  );
}
