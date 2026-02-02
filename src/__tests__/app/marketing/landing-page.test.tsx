import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

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
vi.mock("@/widgets/landing", () => ({
  LandingContent: () => <div data-testid="landing-content" />,
}));

describe("Landing Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("page default export renders without error", async () => {
    const { default: HomePage } = await import("@/app/[locale]/(marketing)/page");
    const { container } = render(<HomePage />);
    expect(container.querySelector("[data-testid='landing-content']")).toBeInTheDocument();
  });

  it("generateMetadata returns correct title and description", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(marketing)/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "ko" }),
    });
    expect(metadata).toEqual({
      title: "meta.title",
      description: "meta.description",
    });
  });
});
