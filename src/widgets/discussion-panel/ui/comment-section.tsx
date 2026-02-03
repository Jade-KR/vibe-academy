"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/shared/ui";
import { useComments } from "@/entities/discussion";
import { useSWRConfig } from "swr";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";

interface CommentSectionProps {
  discussionId: string;
  currentUserId: string | undefined;
  onDeleteComment: (commentId: string) => void;
}

export function CommentSection({
  discussionId,
  currentUserId,
  onDeleteComment,
}: CommentSectionProps) {
  const t = useTranslations("discussion");
  const { comments, isLoading, mutate } = useComments(discussionId);
  const { mutate: globalMutate } = useSWRConfig();

  const handleCommentMutate = useCallback(async () => {
    await mutate();
    // Also revalidate discussions list to update commentCount
    await globalMutate(
      (key: unknown) =>
        typeof key === "string" && key.startsWith("/api/lessons/") && key.includes("/discussions"),
      undefined,
      { revalidate: true },
    );
  }, [mutate, globalMutate]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Comments heading */}
      <h4 className="text-sm font-medium text-foreground">{t("comments")}</h4>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              discussionId={discussionId}
              currentUserId={currentUserId}
              onDelete={onDeleteComment}
              onCommentMutate={handleCommentMutate}
            />
          ))}
        </div>
      )}

      {/* New comment form */}
      <div className="mt-4">
        <CommentForm discussionId={discussionId} onSuccess={handleCommentMutate} />
      </div>
    </div>
  );
}
