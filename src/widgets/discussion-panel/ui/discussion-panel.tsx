"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Card, CardContent, Skeleton, Button } from "@/shared/ui";
import { useUser } from "@/entities/user";
import { useDiscussions } from "@/entities/discussion";
import type { DiscussionListItem } from "@/entities/discussion";
import { DiscussionCard } from "./discussion-card";
import { DiscussionFormDialog } from "./discussion-form-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { CommentSection } from "./comment-section";

interface DiscussionPanelProps {
  lessonId: string;
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
            <Skeleton className="mt-4 h-6 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DiscussionPanel({ lessonId }: DiscussionPanelProps) {
  const t = useTranslations("discussion");
  const tc = useTranslations("common");
  const { user } = useUser();
  const { mutate: globalMutate } = useSWRConfig();

  const [page, setPage] = useState(1);
  const [allDiscussions, setAllDiscussions] = useState<DiscussionListItem[]>([]);
  const { discussions, hasMore, isLoading, mutate } = useDiscussions({
    lessonId,
    page,
    pageSize: 20,
  });

  // Merge paginated results for "load more" pattern
  const displayDiscussions = useMemo(
    () => (page === 1 ? discussions : [...allDiscussions, ...discussions]),
    [page, discussions, allDiscussions],
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);

  // Delete state
  const [deletingItem, setDeletingItem] = useState<{
    type: "discussion" | "comment";
    id: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded comments state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleComments = useCallback((discussionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(discussionId)) {
        next.delete(discussionId);
      } else {
        next.add(discussionId);
      }
      return next;
    });
  }, []);

  const handleNewPost = useCallback(() => {
    setEditingDiscussion(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((discussion: DiscussionListItem) => {
    setEditingDiscussion({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
    });
    setDialogOpen(true);
  }, []);

  const handleDeleteDiscussion = useCallback((discussionId: string) => {
    setDeletingItem({ type: "discussion", id: discussionId });
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    setDeletingItem({ type: "comment", id: commentId });
  }, []);

  const handleFormSuccess = useCallback(async () => {
    setDialogOpen(false);
    setEditingDiscussion(null);
    // Reset to page 1 and revalidate
    setPage(1);
    setAllDiscussions([]);
    await mutate();
  }, [mutate]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const url =
        deletingItem.type === "discussion"
          ? `/api/discussions/${deletingItem.id}`
          : `/api/comments/${deletingItem.id}`;

      const response = await fetch(url, { method: "DELETE" });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      if (deletingItem.type === "discussion") {
        toast.success(t("deletePost"));
        // Reset to page 1 and revalidate discussions
        setPage(1);
        setAllDiscussions([]);
        await mutate();
      } else {
        toast.success(t("deleteComment"));
        // Revalidate comments for all expanded discussions + discussions list for commentCount
        await globalMutate(
          (key: unknown) =>
            typeof key === "string" &&
            key.startsWith("/api/discussions/") &&
            key.includes("/comments"),
          undefined,
          { revalidate: true },
        );
        await mutate();
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  }, [deletingItem, mutate, globalMutate, t]);

  const handleLoadMore = useCallback(() => {
    setAllDiscussions(displayDiscussions);
    setPage((prev) => prev + 1);
  }, [displayDiscussions]);

  // Determine delete dialog text
  const deleteTitle = deletingItem?.type === "discussion" ? t("deletePost") : t("deleteComment");
  const deleteDescription =
    deletingItem?.type === "discussion" ? t("deletePostConfirm") : t("deleteCommentConfirm");

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t("title")}</h2>
        <Button onClick={handleNewPost} size="sm" className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("newPost")}
        </Button>
      </div>

      {/* Content */}
      {isLoading && page === 1 ? (
        <SkeletonList />
      ) : displayDiscussions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-lg font-medium text-foreground">{t("empty")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayDiscussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              currentUserId={user?.id}
              onEdit={handleEdit}
              onDelete={handleDeleteDiscussion}
              onToggleComments={handleToggleComments}
              isExpanded={expandedIds.has(discussion.id)}
            >
              {expandedIds.has(discussion.id) ? (
                <CommentSection
                  discussionId={discussion.id}
                  currentUserId={user?.id}
                  onDeleteComment={handleDeleteComment}
                />
              ) : null}
            </DiscussionCard>
          ))}

          {/* Load more */}
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {tc("next")}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <DiscussionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lessonId={lessonId}
        editData={editingDiscussion ?? undefined}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        title={deleteTitle}
        description={deleteDescription}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </section>
  );
}
