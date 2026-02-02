import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

describe("Blog i18n translations", () => {
  const requiredKeys = [
    "title",
    "description",
    "readMore",
    "readingTime",
    "noPosts",
    "allPosts",
    "categories",
    "tags",
    "publishedOn",
    "by",
    "backToList",
  ];

  it("ko/common.json has all required blog translation keys", () => {
    const raw = fs.readFileSync(path.join(process.cwd(), "public/locales/ko/common.json"), "utf-8");
    const data = JSON.parse(raw);
    expect(data.blog).toBeDefined();
    for (const key of requiredKeys) {
      expect(data.blog).toHaveProperty(key);
    }
  });

  it("en/common.json has all required blog translation keys", () => {
    const raw = fs.readFileSync(path.join(process.cwd(), "public/locales/en/common.json"), "utf-8");
    const data = JSON.parse(raw);
    expect(data.blog).toBeDefined();
    for (const key of requiredKeys) {
      expect(data.blog).toHaveProperty(key);
    }
  });

  it("getting-started.mdx has valid frontmatter", () => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "src/content/blog/getting-started.mdx"),
      "utf-8",
    );
    const { data } = matter(raw);
    expect(data.title).toBeDefined();
    expect(data.description).toBeDefined();
    expect(data.date).toBeDefined();
    expect(data.author).toBeDefined();
    expect(data.category).toBeDefined();
    expect(data.tags).toBeInstanceOf(Array);
    expect(data.locale).toBeDefined();
    expect(data.published).toBe(true);
  });
});
