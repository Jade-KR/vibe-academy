import { MDXRemote } from "next-mdx-remote/rsc";
import { Calendar } from "lucide-react";
import { getMDXComponents } from "@/widgets/blog";
import { TableOfContents } from "./table-of-contents";
import type { LegalFrontmatter, TocItem } from "@/shared/lib/legal";

interface LegalPageProps {
  frontmatter: LegalFrontmatter;
  content: string;
  tocItems: TocItem[];
  lastModifiedLabel: string;
  tocLabel: string;
}

export function LegalPage({
  frontmatter,
  content,
  tocItems,
  lastModifiedLabel,
  tocLabel,
}: LegalPageProps) {
  return (
    <div className="container max-w-4xl py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{frontmatter.title}</h1>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {lastModifiedLabel}: {frontmatter.lastModified}
          </span>
        </div>
      </header>
      <div className="flex gap-12">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <TableOfContents items={tocItems} title={tocLabel} />
          </div>
        </aside>
        <article className="prose-custom min-w-0 flex-1">
          <MDXRemote source={content} components={getMDXComponents()} />
        </article>
      </div>
    </div>
  );
}
