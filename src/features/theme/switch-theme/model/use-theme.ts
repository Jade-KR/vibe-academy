"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export function useThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: (theme ?? "system") as Theme,
    resolvedTheme: resolvedTheme as "light" | "dark" | undefined,
    setTheme: (t: Theme) => setTheme(t),
    mounted,
  };
}
