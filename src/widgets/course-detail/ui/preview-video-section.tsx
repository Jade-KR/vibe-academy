"use client";

import dynamic from "next/dynamic";

const VideoPlayer = dynamic(
  () => import("@/widgets/video-player").then((mod) => ({ default: mod.VideoPlayer })),
  { ssr: false },
);

interface PreviewVideoSectionProps {
  previewVideoUrl: string | null;
  thumbnailUrl: string | null;
}

export function PreviewVideoSection({ previewVideoUrl, thumbnailUrl }: PreviewVideoSectionProps) {
  if (!previewVideoUrl) return null;

  return (
    <section className="mb-8">
      <div className="aspect-video overflow-hidden rounded-lg">
        <VideoPlayer
          src={previewVideoUrl}
          poster={thumbnailUrl ?? undefined}
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
