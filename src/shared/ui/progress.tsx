import { cn } from "@/shared/lib/cn";

interface ProgressProps {
  /** Progress value between 0 and 100. */
  value: number;
  className?: string;
}

function Progress({ value, className }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

export { Progress };
export type { ProgressProps };
