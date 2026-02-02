"use client";

import { useTranslations } from "next-intl";
import type { BlogPost } from "@/shared/lib/blog";
import { PostCard } from "./post-card";

interface PostListProps {
  posts: BlogPost[];
}

export function PostList({ posts }: PostListProps) {
  const t = useTranslations("blog");

  if (posts.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">{t("noPosts")}</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
