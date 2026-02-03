import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/config/site";
import { db } from "@/db/client";
import { courses } from "@/db/schema/courses";
import { eq } from "drizzle-orm";
import { locales } from "@/i18n/config";
import { getAllPosts } from "@/shared/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static marketing pages
  const staticPaths: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/courses", changeFrequency: "weekly", priority: 0.8 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
    { path: "/reviews", changeFrequency: "weekly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/terms", changeFrequency: "monthly", priority: 0.3 },
    { path: "/legal/privacy", changeFrequency: "monthly", priority: 0.3 },
    { path: "/legal/refund", changeFrequency: "monthly", priority: 0.3 },
  ];

  for (const locale of locales) {
    for (const { path, changeFrequency, priority } of staticPaths) {
      entries.push({
        url: `${siteConfig.url}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      });
    }
  }

  // Dynamic course pages — select only needed columns per supabase-postgres best practices
  const publishedCourses = await db
    .select({ slug: courses.slug, updatedAt: courses.updatedAt })
    .from(courses)
    .where(eq(courses.isPublished, true));

  for (const locale of locales) {
    for (const course of publishedCourses) {
      entries.push({
        url: `${siteConfig.url}/${locale}/courses/${course.slug}`,
        lastModified: course.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Blog posts
  for (const locale of locales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      entries.push({
        url: `${siteConfig.url}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.frontmatter.date),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
