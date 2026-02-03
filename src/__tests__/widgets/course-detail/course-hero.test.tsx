import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseHero } from "@/widgets/course-detail/ui/course-hero";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, params?: Record<string, unknown>) => {
      if (key === "lessons") return `${params?.count} lessons`;
      if (key === "reviewCount") return `${params?.count} reviews`;
      return key;
    },
}));

const mockCourse = {
  id: "1",
  title: "React Fundamentals",
  slug: "react-fundamentals",
  description: "Learn React from scratch",
  longDescription: null,
  price: 0,
  level: "beginner" as const,
  category: "frontend-basic",
  thumbnailUrl: "/images/react.jpg",
  previewVideoUrl: null,
  instructorBio: null,
  isFree: true,
  isPublished: true,
  polarProductId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  chapters: [],
  totalLessons: 20,
  totalDuration: 7200,
  reviewCount: 42,
  averageRating: 4.5,
};

describe("CourseHero", () => {
  it("renders course title as h1", () => {
    render(<CourseHero course={mockCourse} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("React Fundamentals");
  });

  it("renders course description", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("Learn React from scratch")).toBeInTheDocument();
  });

  it("renders level badge", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("level.beginner")).toBeInTheDocument();
  });

  it("renders free badge for free courses", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("free")).toBeInTheDocument();
  });

  it("renders lesson count", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("20 lessons")).toBeInTheDocument();
  });

  it("renders formatted duration", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("2h 0m")).toBeInTheDocument();
  });

  it("renders rating and review count", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(42 reviews)")).toBeInTheDocument();
  });

  it("does not render rating when averageRating is 0", () => {
    render(<CourseHero course={{ ...mockCourse, averageRating: 0, reviewCount: 0 }} />);
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<CourseHero course={mockCourse} />);
    expect(screen.getByText("frontend-basic")).toBeInTheDocument();
  });
});
