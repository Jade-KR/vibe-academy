"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
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
import { useAdminCoupons } from "../model/use-admin-coupons";
import { CouponCreateDialog } from "./coupon-create-dialog";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(price);
}

export function CouponList() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { coupons, total, pageSize, hasMore, isLoading, mutate } = useAdminCoupons(page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? t("deleteFailed"));
        return;
      }
      toast.success(t("coupons.deleted"));
      mutate();
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("coupons.title")}</h1>
        <CouponCreateDialog onSuccess={() => mutate()} />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">{t("coupons.empty")}</p>
        </div>
      ) : (
        /* Coupon table */
        <div className="rounded-lg border">
          {/* Header row */}
          <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_1fr_80px_60px_120px_60px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div>{t("coupons.code")}</div>
            <div>{t("coupons.discountType")}</div>
            <div>{t("coupons.discountAmount")}</div>
            <div>{t("coupons.appliesTo")}</div>
            <div>{t("coupons.maxUses")}</div>
            <div>{t("coupons.usedCount")}</div>
            <div>{t("coupons.validUntil")}</div>
            <div />
          </div>

          {/* Data rows */}
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="grid grid-cols-1 gap-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[1fr_100px_100px_1fr_80px_60px_120px_60px] md:items-center md:gap-4"
            >
              {/* Code */}
              <div className="font-mono font-medium text-sm">
                {coupon.code}
                {/* Mobile: show discount inline */}
                <span className="ml-2 text-xs text-muted-foreground md:hidden">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discount}%`
                    : formatPrice(coupon.discount)}
                </span>
              </div>

              {/* Discount Type */}
              <div className="hidden md:block">
                <Badge variant="outline">
                  {coupon.discountType === "fixed"
                    ? t("coupons.discountFixed")
                    : t("coupons.discountPercent")}
                </Badge>
              </div>

              {/* Discount amount */}
              <div className="hidden text-sm md:block">
                {coupon.discountType === "percentage"
                  ? `${coupon.discount}%`
                  : formatPrice(coupon.discount)}
              </div>

              {/* Applies to */}
              <div className="hidden text-sm text-muted-foreground md:block truncate">
                {coupon.courseName ?? t("coupons.allCourses")}
              </div>

              {/* Max uses */}
              <div className="hidden text-sm text-muted-foreground md:block">
                {coupon.maxUses ?? t("coupons.unlimited")}
              </div>

              {/* Used count */}
              <div className="hidden text-sm text-muted-foreground md:block">
                {coupon.usedCount}
              </div>

              {/* Expires at */}
              <div className="hidden text-sm text-muted-foreground md:block">
                {coupon.expiresAt
                  ? dateFormatter.format(new Date(coupon.expiresAt))
                  : t("coupons.noExpiry")}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(coupon.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">{t("coupons.delete")}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {tCommon("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {tCommon("page", { current: page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("coupons.delete")}</DialogTitle>
            <DialogDescription>{t("coupons.deleteConfirm")}</DialogDescription>
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
