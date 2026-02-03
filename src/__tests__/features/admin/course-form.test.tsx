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
  usePathname: () => "/admin/courses/new",
}));

describe("CourseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders create mode form with all fields", async () => {
    const { CourseForm } = await import("@/features/admin/courses");
    render(<CourseForm mode="create" onSuccess={vi.fn()} />);

    // Card title and submit button both show create label
    const createTexts = screen.getAllByText("courses.create");
    expect(createTexts.length).toBe(2); // card title + submit button

    // Form labels should be present (translated keys)
    expect(screen.getByText("courses.form.title")).toBeInTheDocument();
    expect(screen.getByText("courses.form.slug")).toBeInTheDocument();
    expect(screen.getByText("courses.form.shortDescription")).toBeInTheDocument();
    expect(screen.getByText("courses.form.description")).toBeInTheDocument();
    expect(screen.getByText("courses.form.instructorBio")).toBeInTheDocument();
    expect(screen.getByText("courses.form.price")).toBeInTheDocument();
    expect(screen.getByText("courses.form.level")).toBeInTheDocument();
    expect(screen.getByText("courses.form.category")).toBeInTheDocument();
    expect(screen.getByText("courses.form.thumbnailUrl")).toBeInTheDocument();
    expect(screen.getByText("courses.form.previewVideoUrl")).toBeInTheDocument();
  });

  it("renders edit mode form with edit title", async () => {
    const { CourseForm } = await import("@/features/admin/courses");
    render(
      <CourseForm
        mode="edit"
        courseId="test-id"
        initialData={{
          title: "Test Course",
          slug: "test-course",
          description: "A test",
          price: 10000,
          level: "beginner",
          isPublished: false,
          isFree: false,
        }}
        onSuccess={vi.fn()}
      />,
    );

    // Card title shows edit label
    expect(screen.getByText("courses.edit")).toBeInTheDocument();

    // Submit button shows save text for edit mode
    expect(screen.getByText("save")).toBeInTheDocument();
  });

  it("renders isFree toggle with translated labels", async () => {
    const { CourseForm } = await import("@/features/admin/courses");
    render(<CourseForm mode="create" onSuccess={vi.fn()} />);

    // isFree label
    expect(screen.getByText("courses.form.isFree")).toBeInTheDocument();
    // Default is not free, so should show paid description
    expect(screen.getByText("courses.form.isPaidDescription")).toBeInTheDocument();
  });

  it("renders publish toggle with translated labels", async () => {
    const { CourseForm } = await import("@/features/admin/courses");
    render(<CourseForm mode="create" onSuccess={vi.fn()} />);

    // publish label
    expect(screen.getByText("courses.publish")).toBeInTheDocument();
    // Default is not published, so should show unpublished
    expect(screen.getByText("courses.unpublished")).toBeInTheDocument();
  });
});
