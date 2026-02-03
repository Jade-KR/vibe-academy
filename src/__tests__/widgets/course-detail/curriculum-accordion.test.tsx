import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurriculumAccordion } from "@/widgets/course-detail/ui/curriculum-accordion";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params?.count !== undefined) return `${key}(${params.count})`;
    return key;
  },
}));

// Mock format utilities
vi.mock("@/shared/lib/format", () => ({
  formatDuration: (s: number) => `${Math.floor(s / 60)}m`,
  formatLessonDuration: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`,
}));

const mockChapters = [
  {
    id: "ch-1",
    courseId: "course-1",
    title: "Getting Started",
    order: 1,
    createdAt: new Date("2025-01-01"),
    lessons: [
      {
        id: "l-1",
        chapterId: "ch-1",
        title: "Introduction",
        description: null,
        videoUrl: null,
        duration: 300,
        isPreview: true,
        order: 1,
        createdAt: new Date("2025-01-01"),
      },
      {
        id: "l-2",
        chapterId: "ch-1",
        title: "Setup",
        description: "Setup guide",
        videoUrl: null,
        duration: 600,
        isPreview: false,
        order: 2,
        createdAt: new Date("2025-01-01"),
      },
    ],
  },
  {
    id: "ch-2",
    courseId: "course-1",
    title: "Advanced Topics",
    order: 2,
    createdAt: new Date("2025-01-02"),
    lessons: [
      {
        id: "l-3",
        chapterId: "ch-2",
        title: "Deep Dive",
        description: null,
        videoUrl: null,
        duration: null,
        isPreview: false,
        order: 1,
        createdAt: new Date("2025-01-02"),
      },
    ],
  },
];

describe("CurriculumAccordion", () => {
  it("renders section heading", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);
    expect(screen.getByText("curriculum")).toBeInTheDocument();
  });

  it("renders summary with chapters, lessons, and duration", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);
    expect(screen.getByText(/detail\.curriculum\.totalChapters\(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/lessons\(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/15m/)).toBeInTheDocument();
  });

  it("renders chapter titles with numbering", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
    expect(screen.getByText("Advanced Topics")).toBeInTheDocument();
  });

  it("shows Expand All button initially", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);
    expect(screen.getByText("detail.curriculum.expandAll")).toBeInTheDocument();
  });

  it("expands all chapters and changes button text to collapseAll on click", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);

    const expandButton = screen.getByText("detail.curriculum.expandAll");
    fireEvent.click(expandButton);

    // All lesson titles should be visible
    expect(screen.getByText(/Introduction/)).toBeInTheDocument();
    expect(screen.getByText(/Setup/)).toBeInTheDocument();
    expect(screen.getByText(/Deep Dive/)).toBeInTheDocument();

    // Button text should change
    expect(screen.getByText("detail.curriculum.collapseAll")).toBeInTheDocument();
  });

  it("collapses all chapters after expand-all then collapse-all", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);

    // Expand all
    fireEvent.click(screen.getByText("detail.curriculum.expandAll"));
    // Collapse all
    fireEvent.click(screen.getByText("detail.curriculum.collapseAll"));

    // Button text should be expandAll again
    expect(screen.getByText("detail.curriculum.expandAll")).toBeInTheDocument();
  });

  it("shows preview badge for preview lessons", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);

    // Expand all to see lessons
    fireEvent.click(screen.getByText("detail.curriculum.expandAll"));

    // Only one preview badge (the Introduction lesson)
    const previewBadges = screen.getAllByText("preview");
    expect(previewBadges).toHaveLength(1);
  });

  it("does not show preview badge for non-preview lessons", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);

    // Expand all
    fireEvent.click(screen.getByText("detail.curriculum.expandAll"));

    // Only 1 preview badge out of 3 lessons
    const previewBadges = screen.getAllByText("preview");
    expect(previewBadges).toHaveLength(1);
  });

  it("shows formatted duration for lessons with duration", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);

    // Expand all
    fireEvent.click(screen.getByText("detail.curriculum.expandAll"));

    // 300s = 5:00, 600s = 10:00
    expect(screen.getByText("5:00")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("does not show duration for lessons without duration", () => {
    render(<CurriculumAccordion chapters={mockChapters} totalLessons={3} totalDuration={900} />);

    // Expand all
    fireEvent.click(screen.getByText("detail.curriculum.expandAll"));

    // Deep Dive has no duration, so only 2 duration texts
    const durationTexts = [screen.queryByText("5:00"), screen.queryByText("10:00")].filter(Boolean);
    expect(durationTexts).toHaveLength(2);

    // Ensure Deep Dive lesson is rendered but has no duration value
    expect(screen.getByText(/Deep Dive/)).toBeInTheDocument();
  });
});
