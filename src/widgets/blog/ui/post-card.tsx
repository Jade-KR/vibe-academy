"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from "@/shared/ui";
import { Calendar, Clock, User } from "lucide-react";
import type { BlogPost } from "@/shared/lib/blog";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  const t = useTranslations("blog");
  const { frontmatter, slug, readingTime } = post;

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-lg">
        {frontmatter.image && (
          <div className="aspect-video overflow-hidden rounded-t-xl">
            <img
              src={frontmatter.image}
              alt={frontmatter.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{frontmatter.category}</Badge>
          </div>
          <CardTitle className="text-xl transition-colors group-hover:text-primary">
            {frontmatter.title}
          </CardTitle>
          <CardDescription>{frontmatter.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {frontmatter.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {frontmatter.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {frontmatter.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("readingTime", { minutes: readingTime })}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
