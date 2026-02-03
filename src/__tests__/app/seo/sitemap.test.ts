import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB client
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([
      { slug: "intro-to-react", updatedAt: new Date("2025-12-01") },
      { slug: "advanced-ts", updatedAt: new Date("2025-12-15") },
    ]),
  },
}));

// Mock courses schema
vi.mock("@/db/schema/courses", () => ({
  courses: {
    slug: "slug",
    updatedAt: "updated_at",
    isPublished: "is_published",
  },
}));

// Mock drizzle-orm eq function
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, _val) => ({ col: _col, val: _val })),
}));

// Mock blog utility
vi.mock("@/shared/lib/blog", () => ({
  getAllPosts: vi.fn((locale: string) =>
    locale === "ko" ? [{ slug: "getting-started", frontmatter: { date: "2025-11-01" } }] : [],
  ),
}));

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("includes static marketing pages for both locales", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.includes("/ko/"))).toBe(true);
    expect(urls.some((u) => u.includes("/en/"))).toBe(true);
    expect(urls.some((u) => u.includes("/ko/courses"))).toBe(true);
    expect(urls.some((u) => u.includes("/ko/pricing"))).toBe(true);
  });

  it("includes dynamic course URLs for each locale", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.includes("/ko/courses/intro-to-react"))).toBe(true);
    expect(urls.some((u) => u.includes("/en/courses/intro-to-react"))).toBe(true);
    expect(urls.some((u) => u.includes("/ko/courses/advanced-ts"))).toBe(true);
    expect(urls.some((u) => u.includes("/en/courses/advanced-ts"))).toBe(true);
  });

  it("includes blog post URLs", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.includes("/ko/blog/getting-started"))).toBe(true);
  });

  it("sets correct priorities", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();

    // Root should have priority 1.0
    const rootEntry = entries.find((e) => e.url.endsWith("/ko/"));
    expect(rootEntry?.priority).toBe(1.0);

    // Course pages should have priority 0.8
    const courseEntry = entries.find((e) => e.url.includes("/courses/intro-to-react"));
    expect(courseEntry?.priority).toBe(0.8);

    // Blog posts should have priority 0.6
    const blogEntry = entries.find((e) => e.url.includes("/blog/getting-started"));
    expect(blogEntry?.priority).toBe(0.6);
  });
});
