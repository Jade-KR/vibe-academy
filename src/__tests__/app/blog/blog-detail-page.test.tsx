import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-content">{source.substring(0, 50)}</div>
  ),
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("BlogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders post title and metadata for existing post", async () => {
    const { default: BlogDetailPage } = await import("@/app/[locale]/(marketing)/blog/[slug]/page");
    const params = Promise.resolve({ locale: "ko", slug: "getting-started" });
    const result = await BlogDetailPage({ params });
    render(result);
    expect(screen.getByText("vibePack 시작하기")).toBeInTheDocument();
    expect(screen.getByText("vibePack Team")).toBeInTheDocument();
  });

  it("renders MDX content", async () => {
    const { default: BlogDetailPage } = await import("@/app/[locale]/(marketing)/blog/[slug]/page");
    const params = Promise.resolve({ locale: "ko", slug: "getting-started" });
    const result = await BlogDetailPage({ params });
    render(result);
    expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
  });

  it("renders JSON-LD structured data", async () => {
    const { default: BlogDetailPage } = await import("@/app/[locale]/(marketing)/blog/[slug]/page");
    const params = Promise.resolve({ locale: "ko", slug: "getting-started" });
    const result = await BlogDetailPage({ params });
    const { container } = render(result);
    const jsonLdScript = container.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript).toBeInTheDocument();
    const data = JSON.parse(jsonLdScript!.textContent || "{}");
    expect(data["@type"]).toBe("BlogPosting");
    expect(data.headline).toBe("vibePack 시작하기");
  });

  it("generateMetadata returns article SEO for existing post", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(marketing)/blog/[slug]/page");
    const params = Promise.resolve({ locale: "ko", slug: "getting-started" });
    const metadata = await generateMetadata({ params });
    expect(metadata).toBeDefined();
    // Should have article type in openGraph
    if (metadata && "openGraph" in metadata) {
      expect((metadata as any).openGraph.type).toBe("article");
    }
  });

  it("generateMetadata returns empty object for non-existent post", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(marketing)/blog/[slug]/page");
    const params = Promise.resolve({ locale: "ko", slug: "non-existent" });
    const metadata = await generateMetadata({ params });
    expect(metadata).toEqual({});
  });
});
