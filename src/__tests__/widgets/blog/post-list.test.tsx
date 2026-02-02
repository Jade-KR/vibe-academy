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

describe("PostList", () => {
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
    {
      slug: "post-2",
      frontmatter: {
        title: "Post Two",
        description: "Description two",
        date: "2026-01-27",
        author: "Author",
        category: "News",
        tags: ["tag2"],
        locale: "ko" as const,
        published: true,
      },
      content: "Content two",
      readingTime: 5,
    },
  ];

  it("renders multiple PostCards in a grid", async () => {
    const { PostList } = await import("@/widgets/blog/ui/post-list");
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText("Post One")).toBeInTheDocument();
    expect(screen.getByText("Post Two")).toBeInTheDocument();
  });

  it("renders empty state message when no posts", async () => {
    const { PostList } = await import("@/widgets/blog/ui/post-list");
    render(<PostList posts={[]} />);
    expect(screen.getByText("noPosts")).toBeInTheDocument();
  });
});
