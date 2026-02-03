import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewHighlightsSection } from "@/widgets/landing/ui/review-highlights-section";
import type { GlobalReviewItem } from "@/entities/review";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock i18n navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockReviews: GlobalReviewItem[] = [
  {
    id: "r-1",
    rating: 5,
    title: "Amazing course!",
    content: "Learned so much about React patterns.",
    createdAt: "2025-06-01T00:00:00Z",
    user: { name: "Bob", avatarUrl: null },
    course: { title: "React Master", slug: "react-master" },
  },
  {
    id: "r-2",
    rating: 3,
    title: null,
    content: "It was okay, could be better.",
    createdAt: "2025-06-02T00:00:00Z",
    user: { name: null, avatarUrl: null },
    course: { title: "CSS Basics", slug: "css-basics" },
  },
];

describe("ReviewHighlightsSection", () => {
  it("renders section title", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    expect(screen.getByText("reviewHighlights.title")).toBeInTheDocument();
  });

  it("renders review content text", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    expect(screen.getByText("Learned so much about React patterns.")).toBeInTheDocument();
  });

  it("renders review title when present", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    expect(screen.getByText("Amazing course!")).toBeInTheDocument();
  });

  it("does not render review title when null", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    // The second review has title=null, so content should exist but no <h3> title for it
    expect(screen.getByText("It was okay, could be better.")).toBeInTheDocument();
    // Only one h3 for the first review
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Amazing course!");
  });

  it("renders reviewer name", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows anonymous fallback for null name", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    expect(screen.getByText("reviewHighlights.anonymous")).toBeInTheDocument();
  });

  it("renders course link", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    const link = screen.getByText("React Master");
    expect(link.closest("a")).toHaveAttribute("href", "/courses/react-master");
  });

  it("renders 5 filled stars for a 5-star review", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    const fiveStarContainer = screen.getByLabelText("5 / 5");
    const stars = fiveStarContainer.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    // All 5 should have fill-yellow-400
    const filledStars = fiveStarContainer.querySelectorAll("svg.fill-yellow-400");
    expect(filledStars).toHaveLength(5);
  });

  it("renders 3 filled and 2 empty stars for a 3-star review", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    const threeStarContainer = screen.getByLabelText("3 / 5");
    const stars = threeStarContainer.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    const filledStars = threeStarContainer.querySelectorAll("svg.fill-yellow-400");
    expect(filledStars).toHaveLength(3);
  });

  it("shows more link when hasMore is true", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={true} />);
    // Desktop + Mobile both render the moreLink text
    const moreLinks = screen.getAllByText("reviewHighlights.moreLink");
    expect(moreLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("hides more link when hasMore is false", () => {
    render(<ReviewHighlightsSection reviews={mockReviews} isLoading={false} hasMore={false} />);
    expect(screen.queryByText("reviewHighlights.moreLink")).not.toBeInTheDocument();
  });

  it("shows skeleton when isLoading is true", () => {
    const { container } = render(
      <ReviewHighlightsSection reviews={[]} isLoading={true} hasMore={false} />,
    );
    const skeletons = container.querySelectorAll(
      '[class*="animate-pulse"], [data-slot="skeleton"]',
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders nothing in content area when reviews is empty and not loading", () => {
    render(<ReviewHighlightsSection reviews={[]} isLoading={false} hasMore={false} />);
    // Section title should still be present
    expect(screen.getByText("reviewHighlights.title")).toBeInTheDocument();
    // But no review cards should be rendered (empty branch returns null)
    expect(screen.queryByLabelText(/\d+ \/ 5/)).not.toBeInTheDocument();
  });
});
