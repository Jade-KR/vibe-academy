"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui";
import { CourseForm, useAdminCourse } from "@/features/admin/courses";

const CurriculumEditor = dynamic(
  () =>
    import("@/widgets/curriculum-editor").then((m) => ({
      default: m.CurriculumEditor,
    })),
  { loading: () => <Skeleton className="h-96 w-full" /> },
);

export default function AdminCourseEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const t = useTranslations("admin");
  const { course, isLoading, error, mutate } = useAdminCourse(id || undefined);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t("courses.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("courses.edit")}</h1>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{t("courses.details")}</TabsTrigger>
          <TabsTrigger value="curriculum">{t("chapters.title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <CourseForm
            mode="edit"
            courseId={id}
            initialData={{
              title: course.title,
              slug: course.slug,
              description: course.description ?? "",
              longDescription: course.longDescription ?? "",
              price: course.price,
              level: course.level,
              category: course.category ?? "",
              thumbnailUrl: course.thumbnailUrl ?? "",
              previewVideoUrl: course.previewVideoUrl ?? "",
              instructorBio: course.instructorBio ?? "",
              isPublished: course.isPublished,
              isFree: course.isFree,
            }}
            onSuccess={() => mutate()}
          />
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6">
          <CurriculumEditor courseId={id} chapters={course.chapters} onMutate={() => mutate()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
