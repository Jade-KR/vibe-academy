"use client";

import { ReactNode } from "react";
import { SWRProvider, ThemeProvider, AuthProvider, IntlProvider } from "@/shared/providers";

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <AuthProvider>
          <SWRProvider>{children}</SWRProvider>
        </AuthProvider>
      </ThemeProvider>
    </IntlProvider>
  );
}
