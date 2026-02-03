import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin/courses",
}));

const mockUseAdminCourses = vi.fn();
vi.mock("@/features/admin/courses/model/use-admin-courses", () => ({
  useAdminCourses: () => mockUseAdminCourses(),
}));

describe("CourseList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons when loading", async () => {
    mockUseAdminCourses.mockReturnValue({
      courses: [],
      total: 0,
      isLoading: true,
      error: null,
      mutate: vi.fn(),
    });
    const { CourseList } = await import("@/features/admin/courses");
    const { container } = render(<CourseList />);
    // Skeleton elements should be present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no courses", async () => {
    mockUseAdminCourses.mockReturnValue({
      courses: [],
      total: 0,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });
    const { CourseList } = await import("@/features/admin/courses");
    render(<CourseList />);
    expect(screen.getByText("courses.empty")).toBeInTheDocument();
  });

  it("renders course rows with title and badges", async () => {
    mockUseAdminCourses.mockReturnValue({
      courses: [
        {
          id: "course-1",
          title: "React Basics",
          slug: "react-basics",
          description: null,
          price: 49000,
          level: "beginner",
          category: "frontend",
          isPublished: true,
          isFree: false,
          createdAt: "2026-01-01",
          chapterCount: 3,
          lessonCount: 12,
        },
        {
          id: "course-2",
          title: "Free Intro",
          slug: "free-intro",
          description: null,
          price: 0,
          level: "beginner",
          category: "frontend",
          isPublished: false,
          isFree: true,
          createdAt: "2026-01-02",
          chapterCount: 1,
          lessonCount: 4,
        },
      ],
      total: 2,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });
    const { CourseList } = await import("@/features/admin/courses");
    render(<CourseList />);

    // Course titles should appear as links
    expect(screen.getByText("React Basics")).toBeInTheDocument();
    expect(screen.getByText("Free Intro")).toBeInTheDocument();

    // Status badges
    expect(screen.getByText("courses.published")).toBeInTheDocument();
    expect(screen.getByText("courses.unpublished")).toBeInTheDocument();

    // Free badge for the free course
    expect(screen.getByText("courses.free")).toBeInTheDocument();

    // Table headers
    expect(screen.getByText("courses.tableStatus")).toBeInTheDocument();
    expect(screen.getByText("courses.tableActions")).toBeInTheDocument();
  });

  it("renders create button with correct link", async () => {
    mockUseAdminCourses.mockReturnValue({
      courses: [],
      total: 0,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });
    const { CourseList } = await import("@/features/admin/courses");
    render(<CourseList />);

    const createLinks = screen.getAllByText("courses.create");
    expect(createLinks.length).toBeGreaterThan(0);
  });
});
