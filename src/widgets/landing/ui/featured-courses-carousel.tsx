"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { LandingCourseCard } from "./landing-course-card";
import type { CourseSummaryWithStats } from "../model/types";

interface FeaturedCoursesCarouselProps {
  courses: CourseSummaryWithStats[];
  isLoading: boolean;
}

export function FeaturedCoursesCarousel({ courses, isLoading }: FeaturedCoursesCarouselProps) {
  const t = useTranslations("landing");

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("featuredCourses.title")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{t("featuredCourses.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? null : (
          <div className="relative">
            {/* Navigation buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-md lg:flex"
              onClick={scrollPrev}
              aria-label={t("featuredCourses.prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-md lg:flex"
              onClick={scrollNext}
              aria-label={t("featuredCourses.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Carousel viewport */}
            <div ref={emblaRef} className="overflow-hidden">
              <div className="-ml-4 flex">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="min-w-0 flex-shrink-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <LandingCourseCard course={course} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination dots */}
            <div className="mt-6 flex items-center justify-center gap-2" role="tablist">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    index === selectedIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  onClick={() => scrollTo(index)}
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`${t("featuredCourses.slide")} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
