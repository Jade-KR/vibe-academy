"use client";

import { useTranslations } from "next-intl";
import { ErrorFallback } from "@/shared/ui/error-boundary";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ErrorFallback
        error={error}
        onReset={reset}
        title={t("errorTitle")}
        description={t("errorDescription")}
        retryLabel={t("retry")}
      />
    </div>
  );
}
