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
  usePathname: () => "/admin/courses/123",
}));

// Mock @dnd-kit to avoid complex DnD provider requirements
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: "vertical",
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => null } },
}));

describe("CurriculumEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no chapters", async () => {
    const { CurriculumEditor } = await import("@/widgets/curriculum-editor");
    render(<CurriculumEditor courseId="course-1" chapters={[]} onMutate={vi.fn()} />);

    expect(screen.getByText("chapters.empty")).toBeInTheDocument();
  });

  it("renders add chapter button", async () => {
    const { CurriculumEditor } = await import("@/widgets/curriculum-editor");
    render(<CurriculumEditor courseId="course-1" chapters={[]} onMutate={vi.fn()} />);

    const addButtons = screen.getAllByText("chapters.add");
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it("renders chapters with titles", async () => {
    const chapters = [
      {
        id: "ch-1",
        courseId: "course-1",
        title: "Introduction",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: [],
      },
      {
        id: "ch-2",
        courseId: "course-1",
        title: "Getting Started",
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: [
          {
            id: "ls-1",
            chapterId: "ch-2",
            title: "First Lesson",
            description: null,
            videoUrl: null,
            duration: 300,
            isPreview: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    const { CurriculumEditor } = await import("@/widgets/curriculum-editor");
    render(<CurriculumEditor courseId="course-1" chapters={chapters} onMutate={vi.fn()} />);

    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();

    // Lesson should be visible
    expect(screen.getByText("First Lesson")).toBeInTheDocument();

    // Empty state for chapter with no lessons
    expect(screen.getByText("lessons.empty")).toBeInTheDocument();

    // Lesson count badges (translated key with count param)
    expect(screen.getByText('chapters.lessonCount:{"count":0}')).toBeInTheDocument();
    expect(screen.getByText('chapters.lessonCount:{"count":1}')).toBeInTheDocument();
  });

  it("renders card title with chapters.title translation key", async () => {
    const { CurriculumEditor } = await import("@/widgets/curriculum-editor");
    render(<CurriculumEditor courseId="course-1" chapters={[]} onMutate={vi.fn()} />);

    expect(screen.getByText("chapters.title")).toBeInTheDocument();
  });
});
