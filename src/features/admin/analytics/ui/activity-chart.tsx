"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/shared/ui";

interface ActivityChartProps {
  data: { name: string; value: number }[];
  isLoading: boolean;
}

export default function ActivityChart({ data, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-lg" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Bar dataKey="value" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
