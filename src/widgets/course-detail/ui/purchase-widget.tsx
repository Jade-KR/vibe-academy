"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Card, CardContent, Separator } from "@/shared/ui";
import { Check, Loader2 } from "lucide-react";
import type { CourseDetail } from "@/entities/course";
import type { UserProfile } from "@/entities/user";

interface PurchaseWidgetProps {
  course: CourseDetail & { reviewCount: number; averageRating: number };
  enrolled: boolean;
  isAuthLoading: boolean;
  user: UserProfile | null;
  onCheckout: () => void;
  checkoutLoading: boolean;
  variant: "desktop" | "mobile";
}

export function PurchaseWidget({
  course,
  enrolled,
  isAuthLoading,
  user,
  onCheckout,
  checkoutLoading,
  variant,
}: PurchaseWidgetProps) {
  const t = useTranslations("course");

  if (variant === "mobile") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Price */}
          <div className="text-lg font-bold text-foreground">
            {course.isFree ? (
              t("free")
            ) : (
              <span>
                {course.price.toLocaleString()}
                {t("currency")}
              </span>
            )}
          </div>

          {/* CTA */}
          <PurchaseCTA
            course={course}
            enrolled={enrolled}
            isAuthLoading={isAuthLoading}
            user={user}
            onCheckout={onCheckout}
            checkoutLoading={checkoutLoading}
            className="flex-1"
          />
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <Card className="sticky top-20">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          {t("detail.purchaseWidget.title")}
        </h3>

        {/* Price */}
        <div className="mb-4 text-2xl font-bold text-foreground">
          {course.isFree ? (
            t("free")
          ) : (
            <span>
              {course.price.toLocaleString()}
              {t("currency")}
            </span>
          )}
        </div>

        {/* CTA */}
        <PurchaseCTA
          course={course}
          enrolled={enrolled}
          isAuthLoading={isAuthLoading}
          user={user}
          onCheckout={onCheckout}
          checkoutLoading={checkoutLoading}
          className="w-full"
        />

        <Separator className="my-4" />

        {/* Includes list */}
        <h4 className="mb-3 text-sm font-medium text-foreground">{t("includes")}</h4>
        <ul className="space-y-2">
          {[t("lifetimeAccess"), t("certificate"), t("discussionAccess")].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PurchaseCTA({
  course,
  enrolled,
  isAuthLoading,
  user,
  onCheckout,
  checkoutLoading,
  className,
}: Omit<PurchaseWidgetProps, "variant"> & { className?: string }) {
  const t = useTranslations("course");

  // Loading auth state
  if (isAuthLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t("detail.purchaseWidget.processing")}
      </Button>
    );
  }

  // Enrolled -- show continue learning
  if (enrolled) {
    return (
      <Button asChild className={className}>
        <Link href={`/learn/${course.slug}`}>{t("continueLearning")}</Link>
      </Button>
    );
  }

  // Not authenticated -- show login
  if (!user) {
    return (
      <Button asChild className={className}>
        <Link href={`/login?redirect=/courses/${course.slug}`}>
          {t("detail.purchaseWidget.loginRequired")}
        </Link>
      </Button>
    );
  }

  // Authenticated, not enrolled
  return (
    <Button onClick={onCheckout} disabled={checkoutLoading} className={className}>
      {checkoutLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("detail.purchaseWidget.processing")}
        </>
      ) : course.isFree ? (
        t("detail.purchaseWidget.enrollFree")
      ) : (
        t("detail.purchaseWidget.enrollPaid")
      )}
    </Button>
  );
}
