"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import type { CommentListItem } from "@/entities/discussion";
import { CommentForm } from "./comment-form";

interface CommentItemProps {
  comment: CommentListItem;
  discussionId: string;
  currentUserId: string | undefined;
  onDelete: (commentId: string) => void;
  onCommentMutate: () => void;
}

export function CommentItem({
  comment,
  discussionId,
  currentUserId,
  onDelete,
  onCommentMutate,
}: CommentItemProps) {
  const t = useTranslations("discussion");
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = currentUserId === comment.user.id;
  const authorName = comment.user.name ?? "?";

  if (isEditing) {
    return (
      <div className="py-2">
        <CommentForm
          discussionId={discussionId}
          editData={{ id: comment.id, content: comment.content }}
          onSuccess={() => {
            setIsEditing(false);
            onCommentMutate();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <Avatar className="h-7 w-7">
        {comment.user.avatarUrl ? (
          <AvatarImage src={comment.user.avatarUrl} alt={authorName} />
        ) : null}
        <AvatarFallback className="text-xs">{authorName[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("byAuthor", { name: authorName })}
          </span>
          <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </time>
        </div>
        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
      </div>

      {isOwner ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Menu">
              <MoreVertical className="h-3 w-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-3 w-3" aria-hidden="true" />
              {t("editComment")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(comment.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3 w-3" aria-hidden="true" />
              {t("deleteComment")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
