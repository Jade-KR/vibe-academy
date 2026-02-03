"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import rehypePrettyCode from "rehype-pretty-code";
import { Skeleton } from "@/shared/ui";
import { getMDXComponents } from "@/widgets/blog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonMdxRendererProps {
  source: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders lesson description MDX content with syntax highlighting.
 *
 * Security note: Lesson descriptions are admin-authored content stored in the
 * database. The MDX is trusted because only administrators can create or edit
 * lesson content through the admin panel. The `getMDXComponents()` constraint
 * further limits which components are available during rendering.
 */
export function LessonMdxRenderer({ source }: LessonMdxRendererProps) {
  const t = useTranslations("learn");
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState(false);

  // Memoize MDX components to avoid creating a new object reference on every render
  const components = useMemo(() => getMDXComponents(), []);

  useEffect(() => {
    let cancelled = false;

    serialize(source, {
      mdxOptions: {
        rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
      },
    })
      .then((result) => {
        if (!cancelled) setMdxSource(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        {t("errorRenderingContent")}
      </div>
    );
  }

  if (!mdxSource) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <MDXRemote {...mdxSource} components={components} />
    </div>
  );
}
