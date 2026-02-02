import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  locale: "ko" | "en";
  published: boolean;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  readingTime: number; // minutes
}

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export function getReadingTime(content: string): number {
  const result = readingTime(content);
  return Math.max(1, Math.ceil(result.minutes));
}

export function getAllPosts(locale: string): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  const posts: BlogPost[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as BlogFrontmatter;

    if (fm.locale !== locale || !fm.published) continue;

    posts.push({
      slug: file.replace(/\.mdx$/, ""),
      frontmatter: fm,
      content,
      readingTime: getReadingTime(content),
    });
  }

  return posts.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as BlogFrontmatter;

  if (!fm.published) return null;

  return {
    slug,
    frontmatter: fm,
    content,
    readingTime: getReadingTime(content),
  };
}
