import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => <div data-testid="mdx-content">{source}</div>,
}));

import { TableOfContents } from "@/pages/legal";
import type { TocItem } from "@/shared/lib/legal";

describe("TableOfContents", () => {
  const mockItems: TocItem[] = [
    { id: "first-section", title: "First Section" },
    { id: "second-section", title: "Second Section" },
    { id: "third-section", title: "Third Section" },
  ];

  it("renders a nav element with the given title", () => {
    render(<TableOfContents items={mockItems} title="Table of Contents" />);
    const nav = screen.getByRole("navigation", {
      name: "Table of Contents",
    });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText("Table of Contents")).toBeInTheDocument();
  });

  it("renders a list of links for each TOC item", () => {
    render(<TableOfContents items={mockItems} title="Table of Contents" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent("First Section");
    expect(links[1]).toHaveTextContent("Second Section");
    expect(links[2]).toHaveTextContent("Third Section");
  });

  it("each link has correct href attribute", () => {
    render(<TableOfContents items={mockItems} title="Table of Contents" />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "#first-section");
    expect(links[1]).toHaveAttribute("href", "#second-section");
    expect(links[2]).toHaveAttribute("href", "#third-section");
  });

  it("renders nothing when items array is empty", () => {
    const { container } = render(<TableOfContents items={[]} title="Table of Contents" />);
    expect(container.innerHTML).toBe("");
  });
});
