"use client";

import { useTranslations } from "next-intl";
import type { BlogPost } from "@/shared/lib/blog";
import { PostList } from "./post-list";

interface BlogContentProps {
  posts: BlogPost[];
}

export function BlogContent({ posts }: BlogContentProps) {
  const t = useTranslations("blog");

  return (
    <section className="container py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </div>
      <PostList posts={posts} />
    </section>
  );
}
