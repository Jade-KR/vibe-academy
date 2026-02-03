import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurriculumSidebar } from "@/widgets/learn-layout/ui/curriculum-sidebar";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "progressPercent") return `${params?.percent}% complete`;
    return key;
  },
}));

// Mock i18n navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/learn/test-course/lesson-1",
}));

// Mock format utility
vi.mock("@/shared/lib/format", () => ({
  formatLessonDuration: (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  },
}));

const mockCourse = {
  id: "course-1",
  title: "React Course",
  slug: "react-course",
};

const mockChapters = [
  {
    id: "ch-1",
    title: "Getting Started",
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        title: "Introduction",
        duration: 300,
        isPreview: true,
        order: 1,
        completed: true,
        position: 300,
      },
      {
        id: "lesson-2",
        title: "Setup",
        duration: 420,
        isPreview: false,
        order: 2,
        completed: false,
        position: 0,
      },
    ],
  },
  {
    id: "ch-2",
    title: "Components",
    order: 2,
    lessons: [
      {
        id: "lesson-3",
        title: "JSX Basics",
        duration: 600,
        isPreview: false,
        order: 1,
        completed: false,
        position: 0,
      },
    ],
  },
];

const mockProgress = {
  totalLessons: 3,
  completedLessons: 1,
  percent: 33,
};

describe("CurriculumSidebar", () => {
  it("renders the course title", () => {
    render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={mockChapters}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    expect(screen.getByText("React Course")).toBeInTheDocument();
  });

  it("renders overall progress", () => {
    render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={mockChapters}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    expect(screen.getByText("overallProgress")).toBeInTheDocument();
    expect(screen.getByText("33% complete")).toBeInTheDocument();
  });

  it("renders chapter titles", () => {
    render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={mockChapters}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Components")).toBeInTheDocument();
  });

  it("renders lesson links with correct hrefs", () => {
    render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={mockChapters}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    const introLink = screen.getByText("Introduction").closest("a");
    expect(introLink).toHaveAttribute("href", "/learn/react-course/lesson-1");
  });

  it("highlights the current lesson with aria-current", () => {
    render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={mockChapters}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    const currentLink = screen.getByText("Introduction").closest("a");
    expect(currentLink).toHaveAttribute("aria-current", "page");
  });

  it("shows chapter progress counts", () => {
    render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={mockChapters}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("0/1")).toBeInTheDocument();
  });

  it("renders skeleton when chapters are empty", () => {
    const { container } = render(
      <CurriculumSidebar
        courseSlug="react-course"
        course={mockCourse}
        chapters={[]}
        progress={mockProgress}
        currentLessonId="lesson-1"
      />,
    );

    // Skeleton elements rendered for empty chapters
    const skeletons = container.querySelectorAll(
      '[class*="animate-pulse"], [data-slot="skeleton"]',
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
