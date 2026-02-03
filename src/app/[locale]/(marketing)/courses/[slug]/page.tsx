import type { Metadata } from "next";
import { generateSEO, JsonLd } from "@/shared/ui";
import { siteConfig } from "@/shared/config/site";
import { CourseDetailContent } from "@/widgets/course-detail";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getCourse(slug: string) {
  const res = await fetch(`${siteConfig.url}/api/courses/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const { data } = await res.json();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const data = await getCourse(slug);
    if (!data) return generateSEO({ title: "Course Not Found" });

    const ogImageUrl = `${siteConfig.url}/api/og?${new URLSearchParams({
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.thumbnailUrl && { image: data.thumbnailUrl }),
    }).toString()}`;

    return generateSEO({
      title: data.title,
      description: data.description ?? undefined,
      image: ogImageUrl,
      type: "website",
      keywords: [data.category, data.level].filter(Boolean) as string[],
    });
  } catch {
    return generateSEO({ title: "Course Not Found" });
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const course = await getCourse(slug);

  const jsonLd = course
    ? {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.description,
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
          sameAs: siteConfig.url,
        },
        url: `${siteConfig.url}/${locale}/courses/${slug}`,
        image: course.thumbnailUrl,
        coursePrerequisites: course.level,
        ...(course.isFree
          ? { isAccessibleForFree: true }
          : {
              offers: {
                "@type": "Offer",
                price: course.price,
                priceCurrency: "KRW",
                availability: "https://schema.org/InStock",
              },
            }),
      }
    : null;

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <CourseDetailContent slug={slug} locale={locale} />
    </>
  );
}
