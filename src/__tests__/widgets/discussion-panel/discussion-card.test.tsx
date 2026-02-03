import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiscussionCard } from "@/widgets/discussion-panel/ui/discussion-card";
import type { DiscussionListItem } from "@/entities/discussion";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "byAuthor") return `by ${params?.name}`;
    if (key === "createdAt") return `on ${params?.date}`;
    if (key === "commentCount") return `${params?.count} comments`;
    return key;
  },
}));

const mockDiscussion: DiscussionListItem = {
  id: "d-1",
  title: "How to use hooks?",
  content: "I am struggling with useEffect cleanup. Can someone explain?",
  createdAt: "2025-06-15T10:00:00Z",
  updatedAt: "2025-06-15T10:00:00Z",
  user: {
    id: "user-1",
    name: "Alice",
    avatarUrl: null,
  },
  commentCount: 5,
};

const defaultProps = {
  discussion: mockDiscussion,
  currentUserId: undefined as string | undefined,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleComments: vi.fn(),
  isExpanded: false,
};

describe("DiscussionCard", () => {
  it("renders discussion title", () => {
    render(<DiscussionCard {...defaultProps} />);
    expect(screen.getByText("How to use hooks?")).toBeInTheDocument();
  });

  it("renders discussion content", () => {
    render(<DiscussionCard {...defaultProps} />);
    expect(
      screen.getByText("I am struggling with useEffect cleanup. Can someone explain?"),
    ).toBeInTheDocument();
  });

  it("renders author name", () => {
    render(<DiscussionCard {...defaultProps} />);
    expect(screen.getByText("by Alice")).toBeInTheDocument();
  });

  it("renders creation date", () => {
    render(<DiscussionCard {...defaultProps} />);
    // The component calls new Date(createdAt).toLocaleDateString()
    const expectedDate = new Date("2025-06-15T10:00:00Z").toLocaleDateString();
    expect(screen.getByText(`on ${expectedDate}`)).toBeInTheDocument();
  });

  it("renders comment count button", () => {
    render(<DiscussionCard {...defaultProps} />);
    expect(screen.getByText("5 comments")).toBeInTheDocument();
  });

  it("shows owner dropdown when currentUserId matches", () => {
    render(<DiscussionCard {...defaultProps} currentUserId="user-1" />);
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  it("hides dropdown when currentUserId differs", () => {
    render(<DiscussionCard {...defaultProps} currentUserId="user-2" />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("hides dropdown when currentUserId is undefined", () => {
    render(<DiscussionCard {...defaultProps} currentUserId={undefined} />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("calls onToggleComments on comment button click", () => {
    const onToggleComments = vi.fn();
    render(<DiscussionCard {...defaultProps} onToggleComments={onToggleComments} />);

    fireEvent.click(screen.getByText("5 comments"));
    expect(onToggleComments).toHaveBeenCalledWith("d-1");
  });

  it("renders children when isExpanded is true", () => {
    render(
      <DiscussionCard {...defaultProps} isExpanded={true}>
        <span>child content</span>
      </DiscussionCard>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("does not render children when isExpanded is false", () => {
    render(
      <DiscussionCard {...defaultProps} isExpanded={false}>
        <span>child content</span>
      </DiscussionCard>,
    );
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
  });

  it("handles null author name with fallback", () => {
    const nullNameDiscussion: DiscussionListItem = {
      ...mockDiscussion,
      user: { ...mockDiscussion.user, name: null },
    };
    render(<DiscussionCard {...defaultProps} discussion={nullNameDiscussion} />);
    // The component uses `discussion.user.name ?? "?"` for authorName
    expect(screen.getByText("by ?")).toBeInTheDocument();
    // Avatar fallback shows first character of authorName ("?")
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
