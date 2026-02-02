import { getTranslations } from "next-intl/server";
import { DashboardContent } from "@/features/dashboard";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function DashboardPage() {
  return <DashboardContent />;
}
