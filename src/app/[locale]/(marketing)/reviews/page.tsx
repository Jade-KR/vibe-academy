import { getTranslations } from "next-intl/server";
import { generateSEO } from "@/shared/ui";
import { ReviewsPageContent } from "@/widgets/reviews";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "review" });
  return generateSEO({
    title: t("allReviews"),
    description: t("recentReviews"),
  });
}

export default async function ReviewsPage({ params }: Props) {
  const { locale } = await params;
  return <ReviewsPageContent locale={locale} />;
}
