"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

// Extracted as a standalone component so it can also be used by error.tsx
interface ErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
  className?: string;
}

function ErrorFallback({
  error,
  onReset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  retryLabel = "Retry",
  className,
}: ErrorFallbackProps) {
  return (
    <div className={cn("flex items-center justify-center p-6", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">{description}</p>
          {process.env.NODE_ENV === "development" && error?.message ? (
            <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-muted p-3 text-left text-xs">
              {error.message}
            </pre>
          ) : null}
        </CardContent>
        {onReset ? (
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}

export { ErrorBoundary, ErrorFallback };
export type { ErrorBoundaryProps, ErrorFallbackProps };
