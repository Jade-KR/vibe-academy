import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonContent } from "@/widgets/learn-layout/ui/lesson-content";

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

// Mock VideoPlayer dynamic import
vi.mock("@/widgets/video-player", () => ({
  VideoPlayer: (_props: any) => <div data-testid="video-player" />,
}));

// Mock LessonMdxRenderer dynamic import
vi.mock("../ui/lesson-mdx-renderer", () => ({
  LessonMdxRenderer: ({ source }: any) => <div data-testid="mdx-renderer">{source}</div>,
}));

// Mock next/dynamic to render the component directly
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, _options?: any) => {
    // Return a component that calls the loader synchronously for tests
    const Component = (props: any) => {
      // We need to handle the dynamic import by just returning a simple placeholder
      return <div data-testid="dynamic-component" {...props} />;
    };
    Component.displayName = "DynamicComponent";
    return Component;
  },
}));

// Mock useLearnLesson hook
const mockLesson = {
  id: "lesson-1",
  title: "Introduction to React",
  description: "# Hello World",
  videoUrl: "https://example.com/video.mp4",
  duration: 300,
  isPreview: false,
  order: 1,
};

const mockUseLearnLesson = vi.fn();
vi.mock("@/entities/progress", () => ({
  useLearnLesson: (...args: any[]) => mockUseLearnLesson(...args),
}));

// Mock useProgressSaver hook
const mockManualComplete = vi.fn();
vi.mock("@/features/progress", () => ({
  useProgressSaver: () => ({
    handleTimeUpdate: vi.fn(),
    handleEnded: vi.fn(),
    manualComplete: mockManualComplete,
    isCompleted: false,
    isSaving: false,
  }),
}));

const defaultProps = {
  courseSlug: "react-course",
  lessonId: "lesson-1",
  currentLesson: {
    id: "lesson-1",
    title: "Introduction to React",
    duration: 300,
    isPreview: false,
    order: 1,
    completed: false,
    position: 0,
  },
  nextLesson: { lessonId: "lesson-2", lessonTitle: "Setup", chapterTitle: "Getting Started" },
  prevLesson: null,
};

describe("LessonContent", () => {
  beforeEach(() => {
    mockUseLearnLesson.mockReturnValue({
      lesson: mockLesson,
      error: null,
      isLoading: false,
    });
    mockManualComplete.mockResolvedValue(undefined);
  });

  it("renders lesson title", () => {
    render(<LessonContent {...defaultProps} />);
    expect(screen.getByText("Introduction to React")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading", () => {
    mockUseLearnLesson.mockReturnValue({
      lesson: null,
      error: null,
      isLoading: true,
    });

    const { container } = render(<LessonContent {...defaultProps} />);
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error state with retry button on error", () => {
    mockUseLearnLesson.mockReturnValue({
      lesson: null,
      error: new Error("Failed"),
      isLoading: false,
    });

    render(<LessonContent {...defaultProps} />);
    expect(screen.getByText("errorLoadingLesson")).toBeInTheDocument();
    expect(screen.getByText("retry")).toBeInTheDocument();
  });

  it("renders navigation buttons", () => {
    render(<LessonContent {...defaultProps} />);

    expect(screen.getByText("previousLesson")).toBeInTheDocument();
    expect(screen.getByText("nextLesson")).toBeInTheDocument();
    expect(screen.getByText("markComplete")).toBeInTheDocument();
  });

  it("disables previous button when no previous lesson", () => {
    render(<LessonContent {...defaultProps} prevLesson={null} />);

    // Find the disabled previous button (not a link)
    const prevButtons = screen.getAllByText("previousLesson");
    const prevButton = prevButtons[0].closest("button");
    expect(prevButton).toBeDisabled();
  });

  it("renders next lesson as a link when available", () => {
    render(<LessonContent {...defaultProps} />);

    const nextLink = screen.getByText("nextLesson").closest("a");
    expect(nextLink).toHaveAttribute("href", "/learn/react-course/lesson-2");
  });

  it("returns null when no lesson and not loading or error", () => {
    mockUseLearnLesson.mockReturnValue({
      lesson: null,
      error: null,
      isLoading: false,
    });

    const { container } = render(<LessonContent {...defaultProps} />);
    expect(container.innerHTML).toBe("");
  });
});
