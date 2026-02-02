import { describe, it, expect } from "vitest";
import { getReadingTime, getAllPosts, getPostBySlug } from "@/shared/lib/blog";
import type { BlogFrontmatter } from "@/shared/lib/blog";

describe("blog utilities", () => {
  describe("BlogFrontmatter type", () => {
    it("has required fields via fixture", () => {
      const fm: BlogFrontmatter = {
        title: "Test",
        description: "Desc",
        date: "2026-01-01",
        author: "Author",
        category: "Guide",
        tags: ["tag1"],
        locale: "ko",
        published: true,
      };
      expect(fm.title).toBe("Test");
      expect(fm.locale).toBe("ko");
    });
  });

  describe("getReadingTime", () => {
    it("returns 1 for empty string", () => {
      expect(getReadingTime("")).toBe(1);
    });

    it("returns reasonable reading time for 500 words", () => {
      const content = "word ".repeat(500);
      const result = getReadingTime(content);
      // reading-time uses ~200-265 wpm, so 500 words = 2-3 min
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(3);
    });

    it("returns 1 for short content", () => {
      const content = "Hello world";
      expect(getReadingTime(content)).toBe(1);
    });
  });

  describe("getAllPosts", () => {
    it("returns posts filtered by locale and sorted by date descending", () => {
      const posts = getAllPosts("ko");
      expect(posts.length).toBeGreaterThan(0);
      // Check that all returned posts have locale "ko"
      for (const post of posts) {
        expect(post.frontmatter.locale).toBe("ko");
      }
      // Check sorted by date descending
      for (let i = 1; i < posts.length; i++) {
        const prev = new Date(posts[i - 1].frontmatter.date).getTime();
        const curr = new Date(posts[i].frontmatter.date).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it("excludes posts with published: false", () => {
      const posts = getAllPosts("ko");
      for (const post of posts) {
        expect(post.frontmatter.published).toBe(true);
      }
      // draft-post.mdx has locale ko but published: false
      const slugs = posts.map((p) => p.slug);
      expect(slugs).not.toContain("draft-post");
    });

    it("returns empty array for unknown locale", () => {
      const posts = getAllPosts("fr");
      expect(posts).toEqual([]);
    });
  });

  describe("getPostBySlug", () => {
    it("returns correct post with frontmatter", () => {
      const post = getPostBySlug("getting-started");
      expect(post).not.toBeNull();
      expect(post!.slug).toBe("getting-started");
      expect(post!.frontmatter.title).toBe("vibePack 시작하기");
      expect(post!.frontmatter.author).toBe("vibePack Team");
      expect(post!.frontmatter.tags).toContain("Next.js");
      expect(post!.readingTime).toBeGreaterThanOrEqual(1);
    });

    it("returns null for non-existent slug", () => {
      const post = getPostBySlug("non-existent-slug");
      expect(post).toBeNull();
    });

    it("returns null for unpublished draft post", () => {
      const post = getPostBySlug("draft-post");
      expect(post).toBeNull();
    });
  });

  describe("BlogPost shape", () => {
    it("has readingTime as a number", () => {
      const post = getPostBySlug("getting-started");
      expect(post).not.toBeNull();
      expect(typeof post!.readingTime).toBe("number");
      expect(post!.readingTime).toBeGreaterThanOrEqual(1);
    });
  });
});
