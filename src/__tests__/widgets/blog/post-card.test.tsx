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

describe("PostCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPost = {
    slug: "test-post",
    frontmatter: {
      title: "Test Post Title",
      description: "Test post description text",
      date: "2026-01-28",
      author: "Test Author",
      category: "Guide",
      tags: ["tag1", "tag2"],
      image: "/test-image.png",
      locale: "ko" as const,
      published: true,
    },
    content: "Test content",
    readingTime: 3,
  };

  it("renders post title", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders post description", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Test post description text")).toBeInTheDocument();
  });

  it("renders formatted date", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("2026-01-28")).toBeInTheDocument();
  });

  it("renders category as Badge", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Guide")).toBeInTheDocument();
  });

  it("renders tags as Badges", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
  });

  it("renders reading time", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("readingTime")).toBeInTheDocument();
  });

  it("renders link to /blog/{slug}", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/test-post");
  });

  it("renders author name", async () => {
    const { PostCard } = await import("@/widgets/blog/ui/post-card");
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });
});
