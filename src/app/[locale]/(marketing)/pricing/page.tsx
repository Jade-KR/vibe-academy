import { getTranslations } from "next-intl/server";
import { PricingContent } from "@/widgets/pricing-table";

export async function generateMetadata() {
  const t = await getTranslations("pricing");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function PricingPage() {
  return <PricingContent />;
}
