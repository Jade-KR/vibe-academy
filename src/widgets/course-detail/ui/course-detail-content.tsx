"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useCourse } from "@/entities/course";
import { useUser } from "@/entities/user";
import { useEnrollment } from "@/entities/enrollment";
import { Link } from "@/i18n/navigation";
import { Button, Skeleton } from "@/shared/ui";
import { AlertCircle, BookOpen } from "lucide-react";
import { CourseHero } from "./course-hero";
import { PurchaseWidget } from "./purchase-widget";
import { PreviewVideoSection } from "./preview-video-section";
import { CurriculumAccordion } from "./curriculum-accordion";
import { InstructorSection } from "./instructor-section";
import { CourseReviewsSection } from "./course-reviews-section";
import { CourseFaqSection } from "./course-faq-section";
import { RelatedCoursesSection } from "./related-courses-section";

interface CourseDetailContentProps {
  slug: string;
  locale: string;
}

export function CourseDetailContent({ slug }: CourseDetailContentProps) {
  const t = useTranslations("course");
  const tCommon = useTranslations("common");
  const { course, error, isLoading } = useCourse(slug);
  const { user, isLoading: isAuthLoading } = useUser();
  const { enrolled, mutate: mutateEnrollment } = useEnrollment(
    user && course ? course.id : undefined,
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = useCallback(async () => {
    if (!course) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/checkout/${course.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      if (!res.ok) {
        console.error("Checkout error:", json);
        return;
      }

      if (json.data?.enrolled) {
        // Free course -- revalidate enrollment
        await mutateEnrollment();
      } else if (json.data?.checkoutUrl) {
        // Paid course -- redirect to Polar checkout
        window.location.href = json.data.checkoutUrl;
        return; // Don't reset loading since we're redirecting
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  }, [course, mutateEnrollment]);

  // Loading state
  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">{t("detail.errorTitle")}</h1>
        <p className="text-muted-foreground">{t("detail.errorDescription")}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  // Not found state
  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">{t("detail.notFound")}</h1>
        <p className="text-muted-foreground">{t("detail.notFoundDescription")}</p>
        <Button asChild variant="outline">
          <Link href="/courses">{t("allCourses")}</Link>
        </Button>
      </div>
    );
  }

  // Cast to include review stats that come from the API but aren't in CourseDetail type
  const courseData = course as typeof course & {
    reviewCount: number;
    averageRating: number;
  };

  return (
    <div className="pb-24 lg:pb-0">
      {/* Hero */}
      <CourseHero course={courseData} />

      {/* Main content + sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Main content column */}
          <main className="lg:col-span-8">
            <PreviewVideoSection
              previewVideoUrl={courseData.previewVideoUrl}
              thumbnailUrl={courseData.thumbnailUrl}
            />

            <CurriculumAccordion
              chapters={courseData.chapters}
              totalLessons={courseData.totalLessons}
              totalDuration={courseData.totalDuration}
            />

            <InstructorSection instructorBio={courseData.instructorBio} />

            <CourseReviewsSection
              slug={slug}
              reviewCount={courseData.reviewCount}
              averageRating={courseData.averageRating}
            />

            <CourseFaqSection />

            <RelatedCoursesSection category={courseData.category} currentCourseId={courseData.id} />
          </main>

          {/* Desktop sidebar */}
          <aside className="hidden lg:col-span-4 lg:block">
            <PurchaseWidget
              course={courseData}
              enrolled={enrolled}
              isAuthLoading={isAuthLoading}
              user={user}
              onCheckout={handleCheckout}
              checkoutLoading={checkoutLoading}
              variant="desktop"
            />
          </aside>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <PurchaseWidget
        course={courseData}
        enrolled={enrolled}
        isAuthLoading={isAuthLoading}
        user={user}
        onCheckout={handleCheckout}
        checkoutLoading={checkoutLoading}
        variant="mobile"
      />
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="pb-24 lg:pb-0">
      {/* Hero skeleton */}
      <div className="bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-4 h-8 w-3/4" />
          <Skeleton className="mb-6 h-5 w-1/2" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            {/* Video skeleton */}
            <Skeleton className="mb-8 aspect-video w-full rounded-lg" />
            {/* Curriculum skeleton */}
            <Skeleton className="mb-4 h-6 w-40" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="mb-3 h-14 w-full rounded-lg" />
            ))}
          </div>
          <div className="hidden lg:col-span-4 lg:block">
            {/* Sidebar skeleton */}
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
