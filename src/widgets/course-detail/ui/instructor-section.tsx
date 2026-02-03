"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, Separator } from "@/shared/ui";
import { GraduationCap } from "lucide-react";

interface InstructorSectionProps {
  instructorBio: string | null;
}

export function InstructorSection({ instructorBio }: InstructorSectionProps) {
  const t = useTranslations("course");

  if (!instructorBio) return null;

  const paragraphs = instructorBio.split("\n").filter((p) => p.trim());

  return (
    <section className="mb-8">
      <Separator className="mb-8" />
      <h2 className="mb-4 text-xl font-semibold text-foreground">{t("instructor.title")}</h2>
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback>
            <GraduationCap className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
