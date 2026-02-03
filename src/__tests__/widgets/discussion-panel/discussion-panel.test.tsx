import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiscussionPanel } from "@/widgets/discussion-panel/ui/discussion-panel";
import type { DiscussionListItem } from "@/entities/discussion";

// Mock next-intl -- DiscussionPanel uses both useTranslations("discussion") and useTranslations("common")
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock SWR config
vi.mock("swr", () => ({
  useSWRConfig: () => ({ mutate: vi.fn() }),
}));

// Mock useUser hook
const mockUseUser = vi.fn();
vi.mock("@/entities/user", () => ({
  useUser: (...args: unknown[]) => mockUseUser(...args),
}));

// Mock useDiscussions hook
const mockUseDiscussions = vi.fn();
vi.mock("@/entities/discussion", () => ({
  useDiscussions: (...args: unknown[]) => mockUseDiscussions(...args),
}));

// Isolate child components
vi.mock("@/widgets/discussion-panel/ui/discussion-card", () => ({
  DiscussionCard: ({
    discussion,
    children,
  }: {
    discussion: DiscussionListItem;
    children?: React.ReactNode;
  }) => <div data-testid={`discussion-card-${discussion.id}`}>{children}</div>,
}));

vi.mock("@/widgets/discussion-panel/ui/discussion-form-dialog", () => ({
  DiscussionFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="discussion-form-dialog" /> : null,
}));

vi.mock("@/widgets/discussion-panel/ui/delete-confirm-dialog", () => ({
  DeleteConfirmDialog: () => <div data-testid="delete-confirm-dialog" />,
}));

vi.mock("@/widgets/discussion-panel/ui/comment-section", () => ({
  CommentSection: () => <div data-testid="comment-section" />,
}));

const mockDiscussions: DiscussionListItem[] = [
  {
    id: "d-1",
    title: "First question",
    content: "Hello world",
    createdAt: "2025-06-15T10:00:00Z",
    updatedAt: "2025-06-15T10:00:00Z",
    user: { id: "user-1", name: "Alice", avatarUrl: null },
    commentCount: 3,
  },
  {
    id: "d-2",
    title: "Second question",
    content: "Another post",
    createdAt: "2025-06-16T10:00:00Z",
    updatedAt: "2025-06-16T10:00:00Z",
    user: { id: "user-2", name: "Bob", avatarUrl: null },
    commentCount: 0,
  },
];

describe("DiscussionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({ user: { id: "user-1" } });
    mockUseDiscussions.mockReturnValue({
      discussions: [],
      hasMore: false,
      isLoading: false,
      mutate: vi.fn(),
    });
  });

  it("renders title heading", () => {
    render(<DiscussionPanel lessonId="lesson-1" />);
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("renders New Post button", () => {
    render(<DiscussionPanel lessonId="lesson-1" />);
    expect(screen.getByText("newPost")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    mockUseDiscussions.mockReturnValue({
      discussions: [],
      hasMore: false,
      isLoading: true,
      mutate: vi.fn(),
    });

    const { container } = render(<DiscussionPanel lessonId="lesson-1" />);
    const skeletons = container.querySelectorAll(
      '[class*="animate-pulse"], [data-slot="skeleton"]',
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no discussions", () => {
    render(<DiscussionPanel lessonId="lesson-1" />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("renders DiscussionCard items", () => {
    mockUseDiscussions.mockReturnValue({
      discussions: mockDiscussions,
      hasMore: false,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<DiscussionPanel lessonId="lesson-1" />);
    expect(screen.getByTestId("discussion-card-d-1")).toBeInTheDocument();
    expect(screen.getByTestId("discussion-card-d-2")).toBeInTheDocument();
  });

  it("shows load more button when hasMore is true", () => {
    mockUseDiscussions.mockReturnValue({
      discussions: mockDiscussions,
      hasMore: true,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<DiscussionPanel lessonId="lesson-1" />);
    expect(screen.getByText("next")).toBeInTheDocument();
  });

  it("opens form dialog on New Post click", () => {
    render(<DiscussionPanel lessonId="lesson-1" />);

    // Dialog should not be visible initially
    expect(screen.queryByTestId("discussion-form-dialog")).not.toBeInTheDocument();

    // Click New Post button
    fireEvent.click(screen.getByText("newPost"));

    // Dialog should now appear
    expect(screen.getByTestId("discussion-form-dialog")).toBeInTheDocument();
  });
});
