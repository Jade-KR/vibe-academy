import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReviewsPageContent } from "@/widgets/reviews/ui/reviews-page-content";
import type { GlobalReviewItem } from "@/entities/review";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "totalReviews") return `Total ${params?.count} reviews`;
    return key;
  },
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

// Mock usePaginatedGlobalReviews hook
const mockUsePaginatedGlobalReviews = vi.fn();
vi.mock("@/entities/review", () => ({
  usePaginatedGlobalReviews: (...args: unknown[]) => mockUsePaginatedGlobalReviews(...args),
}));

const mockReviews: GlobalReviewItem[] = [
  {
    id: "r-1",
    rating: 4,
    title: "Great course",
    content: "Very informative and well structured.",
    createdAt: "2025-07-10T00:00:00Z",
    user: { name: "Charlie", avatarUrl: null },
    course: { title: "TypeScript Pro", slug: "typescript-pro" },
  },
];

describe("ReviewsPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: [],
      total: 0,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });
  });

  it("renders page heading", () => {
    render(<ReviewsPageContent locale="ko" />);
    expect(screen.getByText("allReviews")).toBeInTheDocument();
  });

  it("shows total review count", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 42,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    expect(screen.getByText("Total 42 reviews")).toBeInTheDocument();
  });

  it("shows fallback text when total is 0", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 0,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    expect(screen.getByText("recentReviews")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: [],
      total: 0,
      hasMore: false,
      isLoading: true,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    const { container } = render(<ReviewsPageContent locale="ko" />);
    const skeletons = container.querySelectorAll(
      '[class*="animate-pulse"], [data-slot="skeleton"]',
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    render(<ReviewsPageContent locale="ko" />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("renders review cards with star rating", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    expect(screen.getByLabelText("4 / 5")).toBeInTheDocument();
  });

  it("renders review card with course link", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    const courseLink = screen.getByText("TypeScript Pro");
    expect(courseLink.closest("a")).toHaveAttribute("href", "/courses/typescript-pro");
  });

  it("renders review card with date", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    const timeElement = screen.getByText(new Date("2025-07-10T00:00:00Z").toLocaleDateString("ko"));
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveAttribute("dateTime", "2025-07-10T00:00:00Z");
  });

  it("shows load more button when hasMore is true", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 20,
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    expect(screen.getByText("moreReviews")).toBeInTheDocument();
  });

  it("hides load more button when hasMore is false", () => {
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      loadMore: vi.fn(),
    });

    render(<ReviewsPageContent locale="ko" />);
    expect(screen.queryByText("moreReviews")).not.toBeInTheDocument();
  });

  it("calls loadMore on load more button click", () => {
    const mockLoadMore = vi.fn();
    mockUsePaginatedGlobalReviews.mockReturnValue({
      reviews: mockReviews,
      total: 20,
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      loadMore: mockLoadMore,
    });

    render(<ReviewsPageContent locale="ko" />);
    fireEvent.click(screen.getByText("moreReviews"));
    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });
});
