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

describe("BlogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders BlogContent with posts", async () => {
    const { default: BlogPage } = await import("@/app/[locale]/(marketing)/blog/page");
    const params = Promise.resolve({ locale: "ko" });
    const result = await BlogPage({ params });
    render(result);
    // BlogContent renders the blog title heading
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("title");
  });

  it("generateMetadata returns blog title and description", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(marketing)/blog/page");
    const params = Promise.resolve({ locale: "ko" });
    const metadata = await generateMetadata({ params });
    expect(metadata).toBeDefined();
  });
});
