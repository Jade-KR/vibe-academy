import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseCard } from "@/widgets/course-card";
import type { CourseSummaryWithStats } from "@/entities/course";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "reviewCount") return `${params?.count} reviews`;
    return key;
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
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

const mockCourse: CourseSummaryWithStats = {
  id: "1",
  title: "React Fundamentals",
  slug: "react-fundamentals",
  description: "Learn React from scratch",
  price: 0,
  level: "beginner",
  category: "frontend-basic",
  thumbnailUrl: "/images/react.jpg",
  isFree: true,
  reviewCount: 42,
  averageRating: 4.5,
};

describe("CourseCard", () => {
  it("renders course title", () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
  });

  it("renders course description when showDescription is true", () => {
    render(<CourseCard course={mockCourse} showDescription={true} />);
    expect(screen.getByText("Learn React from scratch")).toBeInTheDocument();
  });

  it("hides course description when showDescription is false", () => {
    render(<CourseCard course={mockCourse} showDescription={false} />);
    expect(screen.queryByText("Learn React from scratch")).not.toBeInTheDocument();
  });

  it("renders level badge", () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText("level.beginner")).toBeInTheDocument();
  });

  it("renders free badge for free courses", () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText("free")).toBeInTheDocument();
  });

  it("does not render free badge for paid courses", () => {
    render(<CourseCard course={{ ...mockCourse, isFree: false, price: 50000 }} />);
    expect(screen.queryByText("free")).not.toBeInTheDocument();
  });

  it("renders review count and rating", () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(42 reviews)")).toBeInTheDocument();
  });

  it("does not render reviews when count is 0", () => {
    render(<CourseCard course={{ ...mockCourse, reviewCount: 0, averageRating: 0 }} />);
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });

  it("links to the course detail page", () => {
    render(<CourseCard course={mockCourse} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/courses/react-fundamentals");
  });

  it("renders thumbnail image with lazy loading", () => {
    render(<CourseCard course={mockCourse} />);
    const img = screen.getByAltText("React Fundamentals");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders fallback when no thumbnail", () => {
    render(<CourseCard course={{ ...mockCourse, thumbnailUrl: null }} />);
    // Fallback shows course title text
    const fallbacks = screen.getAllByText("React Fundamentals");
    expect(fallbacks.length).toBeGreaterThanOrEqual(2); // title + fallback
  });
});
