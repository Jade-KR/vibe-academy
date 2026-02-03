"use client";

import { useRouter } from "@/i18n/navigation";
import { CourseForm } from "@/features/admin/courses";

export default function AdminCourseNewPage() {
  const router = useRouter();
  return <CourseForm mode="create" onSuccess={(id) => router.push(`/admin/courses/${id}`)} />;
}
