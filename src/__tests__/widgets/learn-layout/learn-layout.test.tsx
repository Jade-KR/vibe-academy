import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LearnLayout } from "@/widgets/learn-layout/ui/learn-layout";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock DiscussionPanel
vi.mock("@/widgets/discussion-panel", () => ({
  DiscussionPanel: (_props: any) => <div data-testid="discussion-panel" />,
}));

// Mock child components to isolate learn-layout tests
vi.mock("@/widgets/learn-layout/ui/curriculum-sidebar", () => ({
  CurriculumSidebar: (props: any) => (
    <div data-testid="curriculum-sidebar" className={props.className} />
  ),
}));

vi.mock("@/widgets/learn-layout/ui/lesson-content", () => ({
  LessonContent: (props: any) => <div data-testid="lesson-content" />,
}));

vi.mock("@/widgets/learn-layout/ui/mobile-learn-tabs", () => ({
  MobileLearnTabs: (props: any) => <div data-testid="mobile-learn-tabs" />,
}));

// Mock hooks
const mockUseCurriculum = vi.fn();
vi.mock("@/entities/progress", () => ({
  useCurriculum: (...args: any[]) => mockUseCurriculum(...args),
}));

vi.mock("@/features/progress", () => ({
  findNextLesson: () => null,
  findPreviousLesson: () => null,
}));

const mockChapters = [
  {
    id: "ch-1",
    title: "Chapter 1",
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        title: "Lesson 1",
        duration: 300,
        isPreview: false,
        order: 1,
        completed: false,
        position: 0,
      },
    ],
  },
];

describe("LearnLayout", () => {
  beforeEach(() => {
    mockUseCurriculum.mockReturnValue({
      course: { id: "course-1", title: "Test Course", slug: "test-course" },
      chapters: mockChapters,
      progress: { totalLessons: 1, completedLessons: 0, percent: 0 },
      error: null,
      isLoading: false,
    });
  });

  it("renders main layout with all panels", () => {
    render(<LearnLayout courseSlug="test-course" lessonId="lesson-1" />);

    expect(screen.getByTestId("curriculum-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-content")).toBeInTheDocument();
    expect(screen.getByTestId("discussion-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-learn-tabs")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading with no chapters", () => {
    mockUseCurriculum.mockReturnValue({
      course: null,
      chapters: [],
      progress: null,
      error: null,
      isLoading: true,
    });

    const { container } = render(<LearnLayout courseSlug="test-course" lessonId="lesson-1" />);
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error state for non-403 errors", () => {
    mockUseCurriculum.mockReturnValue({
      course: null,
      chapters: [],
      progress: null,
      error: { status: 500, message: "Server error" },
      isLoading: false,
    });

    render(<LearnLayout courseSlug="test-course" lessonId="lesson-1" />);
    expect(screen.getByText("errorLoadingCourse")).toBeInTheDocument();
    expect(screen.getByText("retry")).toBeInTheDocument();
  });

  it("toggles left panel when toggle button is clicked", () => {
    render(<LearnLayout courseSlug="test-course" lessonId="lesson-1" />);

    const leftToggle = screen.getByRole("button", { name: "hideCurriculum" });
    expect(leftToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(leftToggle);

    // After click, the button should indicate the panel is closed
    const closedToggle = screen.getByRole("button", { name: "showCurriculum" });
    expect(closedToggle).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles right panel when toggle button is clicked", () => {
    render(<LearnLayout courseSlug="test-course" lessonId="lesson-1" />);

    const rightToggle = screen.getByRole("button", { name: "hideDiscussion" });
    expect(rightToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(rightToggle);

    const closedToggle = screen.getByRole("button", { name: "showDiscussion" });
    expect(closedToggle).toHaveAttribute("aria-expanded", "false");
  });

  it("uses CSS collapse instead of unmounting sidebar on toggle", () => {
    render(<LearnLayout courseSlug="test-course" lessonId="lesson-1" />);

    // Sidebar should always be in DOM
    const sidebar = screen.getByTestId("curriculum-sidebar");
    expect(sidebar).toBeInTheDocument();

    // Toggle left panel off
    const leftToggle = screen.getByRole("button", { name: "hideCurriculum" });
    fireEvent.click(leftToggle);

    // Sidebar should still be in DOM (CSS collapse, not unmount)
    expect(screen.getByTestId("curriculum-sidebar")).toBeInTheDocument();
  });
});
