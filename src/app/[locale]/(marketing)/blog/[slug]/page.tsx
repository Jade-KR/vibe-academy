import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getTranslations } from "next-intl/server";
import { generateSEO, JsonLd, Badge } from "@/shared/ui";
import { getPostBySlug, getAllPosts } from "@/shared/lib/blog";
import { getMDXComponents } from "@/widgets/blog";
import { siteConfig } from "@/shared/config/site";
import { Calendar, Clock, User } from "lucide-react";

interface BlogDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const koPosts = getAllPosts("ko");
  const enPosts = getAllPosts("en");
  return [
    ...koPosts.map((p) => ({ locale: "ko", slug: p.slug })),
    ...enPosts.map((p) => ({ locale: "en", slug: p.slug })),
  ];
}

export async function generateMetadata({ params }: BlogDetailProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return generateSEO({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    type: "article",
    image: post.frontmatter.image,
    keywords: post.frontmatter.tags,
  });
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const t = await getTranslations("blog");
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    author: { "@type": "Person", name: post.frontmatter.author },
    datePublished: post.frontmatter.date,
    publisher: { "@type": "Organization", name: siteConfig.name },
    image: post.frontmatter.image,
  };

  return (
    <article className="container max-w-3xl py-16">
      <JsonLd data={jsonLd} />
      <header className="mb-12">
        <Badge variant="secondary">{post.frontmatter.category}</Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {post.frontmatter.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.frontmatter.description}</p>
        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {post.frontmatter.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.frontmatter.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {t("readingTime", { minutes: post.readingTime })}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {post.frontmatter.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </header>
      <div className="prose-custom">
        <MDXRemote source={post.content} components={getMDXComponents()} />
      </div>
    </article>
  );
}
