import { getTranslations } from "next-intl/server";
import { generateSEO } from "@/shared/ui";
import { getAllPosts } from "@/shared/lib/blog";
import { BlogContent } from "@/widgets/blog";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return generateSEO({
    title: t("title"),
    description: t("description"),
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const posts = getAllPosts(locale);
  return <BlogContent posts={posts} />;
}
