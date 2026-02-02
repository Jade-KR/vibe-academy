import { cn } from "@/shared/lib/cn";
import { type VariantProps, cva } from "class-variance-authority";
import { Spinner } from "./spinner";

const loadingSpinnerVariants = cva("flex items-center justify-center", {
  variants: {
    variant: {
      inline: "py-4",
      fullscreen: "fixed inset-0 z-50 bg-background/80",
      overlay: "absolute inset-0 z-40 bg-background/60 backdrop-blur-sm",
      minimal: "",
    },
    size: {
      sm: "",
      default: "",
      lg: "",
    },
  },
  defaultVariants: {
    variant: "inline",
    size: "default",
  },
});

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loadingSpinnerVariants> {
  label?: string;
}

function LoadingSpinner({ className, variant, size, label, ...props }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label || "Loading"}
      className={cn(loadingSpinnerVariants({ variant }), className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2">
        <Spinner size={size} />
        {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  );
}

export { LoadingSpinner, loadingSpinnerVariants };
export type { LoadingSpinnerProps };
