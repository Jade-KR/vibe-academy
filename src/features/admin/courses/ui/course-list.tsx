"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui";
import { useAdminCourses } from "../model/use-admin-courses";

function formatPrice(price: number, isFree: boolean): string {
  if (isFree) return "Free";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(price);
}

export function CourseList() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { courses, isLoading, mutate } = useAdminCourses();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleTogglePublish(courseId: string, currentlyPublished: boolean) {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentlyPublished }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to update");
        return;
      }
      toast.success(currentlyPublished ? t("courses.unpublish") : t("courses.publish"));
      mutate();
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to delete");
        return;
      }
      toast.success(t("courses.delete"));
      mutate();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("courses.title")}</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("courses.create")}
          </Link>
        </Button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">No courses yet</p>
          <Button asChild>
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("courses.create")}
            </Link>
          </Button>
        </div>
      ) : (
        /* Course table */
        <div className="rounded-lg border">
          {/* Header row */}
          <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_80px_80px_80px_120px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div>{t("courses.form.title")}</div>
            <div>{t("courses.form.level")}</div>
            <div>{t("courses.form.price")}</div>
            <div>Status</div>
            <div>Ch.</div>
            <div>Ls.</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Data rows */}
          {courses.map((course) => (
            <div
              key={course.id}
              className="grid grid-cols-1 gap-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[1fr_100px_100px_80px_80px_80px_120px] md:items-center md:gap-4"
            >
              {/* Title */}
              <div className="font-medium truncate">
                <Link href={`/admin/courses/${course.id}`} className="hover:underline">
                  {course.title}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground md:hidden">{course.level}</span>
              </div>

              {/* Level */}
              <div className="hidden text-sm text-muted-foreground md:block capitalize">
                {course.level}
              </div>

              {/* Price */}
              <div className="hidden text-sm md:block">
                {course.isFree ? (
                  <Badge variant="secondary">Free</Badge>
                ) : (
                  formatPrice(course.price, false)
                )}
              </div>

              {/* Status */}
              <div>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? t("courses.published") : t("courses.unpublished")}
                </Badge>
              </div>

              {/* Chapter count */}
              <div className="hidden text-sm text-muted-foreground md:block">
                {course.chapterCount}
              </div>

              {/* Lesson count */}
              <div className="hidden text-sm text-muted-foreground md:block">
                {course.lessonCount}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/courses/${course.id}`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t("courses.edit")}</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTogglePublish(course.id, course.isPublished)}
                >
                  {course.isPublished ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {course.isPublished ? t("courses.unpublish") : t("courses.publish")}
                  </span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(course.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">{t("courses.delete")}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("courses.delete")}</DialogTitle>
            <DialogDescription>{t("courses.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
