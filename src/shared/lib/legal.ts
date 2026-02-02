import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface LegalFrontmatter {
  title: string;
  description: string;
  lastModified: string;
  locale: "ko" | "en";
}

export interface LegalPage {
  slug: string;
  frontmatter: LegalFrontmatter;
  content: string;
}

export interface TocItem {
  id: string;
  title: string;
}

const LEGAL_DIR = path.join(process.cwd(), "src/content/legal");

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u3131-\uD79D-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+$/g, "")
    .replace(/^-+/g, "")
    .trim();
}

export function extractTableOfContents(content: string): TocItem[] {
  const headingRegex = /^## (.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    items.push({ id: slugify(match[1]), title: match[1] });
  }
  return items;
}

export function getLegalPage(slug: string, locale: string): LegalPage | null {
  const filePath = path.join(LEGAL_DIR, `${slug}-${locale}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { slug, frontmatter: data as LegalFrontmatter, content };
}
