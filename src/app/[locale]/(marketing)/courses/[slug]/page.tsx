import type { Metadata } from "next";
import { generateSEO } from "@/shared/ui";
import { CourseDetailContent } from "@/widgets/course-detail";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/courses/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return generateSEO({ title: "Course Not Found" });

    const { data } = await res.json();
    return generateSEO({
      title: data.title,
      description: data.description ?? undefined,
      image: data.thumbnailUrl ?? undefined,
      type: "website",
      keywords: [data.category, data.level].filter(Boolean) as string[],
    });
  } catch {
    return generateSEO({ title: "Course Not Found" });
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  return <CourseDetailContent slug={slug} locale={locale} />;
}
