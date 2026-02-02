import { getTranslations } from "next-intl/server";
import { LandingContent } from "@/widgets/landing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default function HomePage() {
  return <LandingContent />;
}
