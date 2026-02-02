import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoursesPageContent } from "@/widgets/course-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "course" });

  return {
    title: t("allCourses"),
    description: t("emptyDescription"),
  };
}

export default function CoursesPage() {
  return <CoursesPageContent />;
}
