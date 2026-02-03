import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock siteConfig
vi.mock("@/shared/config/site", () => ({
  siteConfig: {
    name: "vibePack",
    url: "https://example.com",
    ogImage: "/og-image.png",
    locale: "ko_KR",
    description: "Test",
    creator: "vibePack",
    keywords: [],
    links: { github: "", twitter: "" },
  },
}));

// Mock the course detail widget
vi.mock("@/widgets/course-detail", () => ({
  CourseDetailContent: ({ slug, locale }: { slug: string; locale: string }) => (
    <div data-testid="course-detail" data-slug={slug} data-locale={locale} />
  ),
}));

const mockCourseData = {
  title: "React Mastery",
  slug: "react-mastery",
  description: "Learn React from scratch",
  thumbnailUrl: "https://example.com/thumb.jpg",
  category: "frontend",
  level: "intermediate",
  price: 99000,
  isFree: false,
};

describe("Course detail page", () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCourseData }),
    });
  });

  it("generateMetadata uses dynamic OG image URL", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(marketing)/courses/[slug]/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ko", slug: "react-mastery" }),
    });

    const images = metadata?.openGraph?.images;
    const ogImage = Array.isArray(images) ? images[0] : images;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageUrl = typeof ogImage === "string" ? ogImage : (ogImage as any)?.url;
    expect(imageUrl).toContain("/api/og");
    expect(imageUrl).toContain("title=");
  });

  it("generateMetadata uses siteConfig.url (not NEXT_PUBLIC_SITE_URL)", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(marketing)/courses/[slug]/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ko", slug: "react-mastery" }),
    });

    const images = metadata?.openGraph?.images;
    const ogImage = Array.isArray(images) ? images[0] : images;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageUrl = typeof ogImage === "string" ? ogImage : (ogImage as any)?.url;
    expect(imageUrl).toContain("https://example.com");
    expect(imageUrl).not.toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("generateMetadata falls back to 'Course Not Found' when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { generateMetadata } = await import("@/app/[locale]/(marketing)/courses/[slug]/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ko", slug: "nonexistent" }),
    });

    expect(metadata?.title).toContain("Course Not Found");
  });
});
