import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("BlogContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPosts = [
    {
      slug: "post-1",
      frontmatter: {
        title: "Post One",
        description: "Description one",
        date: "2026-01-28",
        author: "Author",
        category: "Guide",
        tags: ["tag1"],
        locale: "ko" as const,
        published: true,
      },
      content: "Content one",
      readingTime: 2,
    },
  ];

  it("renders heading blog.title", async () => {
    const { BlogContent } = await import("@/widgets/blog/ui/blog-content");
    render(<BlogContent posts={mockPosts} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("title");
  });

  it("renders description text", async () => {
    const { BlogContent } = await import("@/widgets/blog/ui/blog-content");
    render(<BlogContent posts={mockPosts} />);
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders PostList with posts", async () => {
    const { BlogContent } = await import("@/widgets/blog/ui/blog-content");
    render(<BlogContent posts={mockPosts} />);
    expect(screen.getByText("Post One")).toBeInTheDocument();
  });
});
