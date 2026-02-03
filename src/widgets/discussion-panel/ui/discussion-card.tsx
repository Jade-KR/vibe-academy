"use client";

import { useTranslations } from "next-intl";
import { MessageCircle, MoreVertical, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import type { DiscussionListItem } from "@/entities/discussion";

interface DiscussionCardProps {
  discussion: DiscussionListItem;
  currentUserId: string | undefined;
  onEdit: (discussion: DiscussionListItem) => void;
  onDelete: (discussionId: string) => void;
  onToggleComments: (discussionId: string) => void;
  isExpanded: boolean;
  children?: React.ReactNode;
}

export function DiscussionCard({
  discussion,
  currentUserId,
  onEdit,
  onDelete,
  onToggleComments,
  isExpanded,
  children,
}: DiscussionCardProps) {
  const t = useTranslations("discussion");
  const isOwner = currentUserId === discussion.user.id;
  const authorName = discussion.user.name ?? "?";

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header: Avatar + author + date + menu */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {discussion.user.avatarUrl ? (
                <AvatarImage src={discussion.user.avatarUrl} alt={authorName} />
              ) : null}
              <AvatarFallback className="text-xs">{authorName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {t("byAuthor", { name: authorName })}
              </span>
              <time className="text-xs text-muted-foreground" dateTime={discussion.createdAt}>
                {t("createdAt", {
                  date: new Date(discussion.createdAt).toLocaleDateString(),
                })}
              </time>
            </div>
          </div>

          {isOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Menu">
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(discussion)}>
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t("editPost")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(discussion.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t("deletePost")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* Title + content preview */}
        <h3 className="mt-3 font-semibold text-foreground">{discussion.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{discussion.content}</p>

        {/* Comment count toggle */}
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => onToggleComments(discussion.id)}
            aria-expanded={isExpanded}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("commentCount", { count: discussion.commentCount })}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Expanded comments section */}
        {isExpanded ? <div className="mt-4 border-t pt-4">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
