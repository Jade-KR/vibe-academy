import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => <div data-testid="mdx-content">{source}</div>,
}));

vi.mock("@/widgets/blog", () => ({
  getMDXComponents: () => ({}),
}));

import { LegalPage } from "@/pages/legal";
import type { LegalFrontmatter, TocItem } from "@/shared/lib/legal";

describe("LegalPage", () => {
  const mockFrontmatter: LegalFrontmatter = {
    title: "Terms of Service",
    description: "Test description",
    lastModified: "2026-01-28",
    locale: "en",
  };

  const mockTocItems: TocItem[] = [
    { id: "overview", title: "Overview" },
    { id: "eligibility", title: "Eligibility" },
  ];

  const mockContent = "## Overview\n\nSome content here.";

  it("renders page title from frontmatter", () => {
    render(
      <LegalPage
        frontmatter={mockFrontmatter}
        content={mockContent}
        tocItems={mockTocItems}
        lastModifiedLabel="Last modified"
        tocLabel="Table of Contents"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
  });

  it("displays last-modified date", () => {
    render(
      <LegalPage
        frontmatter={mockFrontmatter}
        content={mockContent}
        tocItems={mockTocItems}
        lastModifiedLabel="Last modified"
        tocLabel="Table of Contents"
      />,
    );
    expect(screen.getByText(/Last modified/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-28/)).toBeInTheDocument();
  });

  it("renders table of contents section", () => {
    render(
      <LegalPage
        frontmatter={mockFrontmatter}
        content={mockContent}
        tocItems={mockTocItems}
        lastModifiedLabel="Last modified"
        tocLabel="Table of Contents"
      />,
    );
    expect(screen.getByRole("navigation", { name: "Table of Contents" })).toBeInTheDocument();
  });

  it("renders MDX content area", () => {
    const { container } = render(
      <LegalPage
        frontmatter={mockFrontmatter}
        content={mockContent}
        tocItems={mockTocItems}
        lastModifiedLabel="Last modified"
        tocLabel="Table of Contents"
      />,
    );
    expect(container.querySelector(".prose-custom")).toBeInTheDocument();
    expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
  });
});
