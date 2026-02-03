import type { Metadata } from "next";
import { LearnLayout } from "@/widgets/learn-layout";

interface LearnPageProps {
  params: Promise<{ locale: string; courseSlug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: LearnPageProps): Promise<Metadata> {
  const { courseSlug } = await params;

  return {
    title: `Learn - ${courseSlug}`,
  };
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { courseSlug, lessonId } = await params;

  return <LearnLayout courseSlug={courseSlug} lessonId={lessonId} />;
}
