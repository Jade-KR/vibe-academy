"use client";

import { useState, useEffect } from "react";
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

export function LessonMdxRenderer({ source }: LessonMdxRendererProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState(false);

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
    return <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">{source}</div>;
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
      <MDXRemote {...mdxSource} components={getMDXComponents()} />
    </div>
  );
}
