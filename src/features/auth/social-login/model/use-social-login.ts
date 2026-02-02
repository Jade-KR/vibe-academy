"use client";

import type { SocialProvider } from "@/shared/types";

/**
 * Hook for social login redirection.
 * Navigates browser to the OAuth entry API route.
 */
export function useSocialLogin() {
  const handleSocialLogin = (provider: SocialProvider) => {
    window.location.href = `/api/auth/social/${provider}`;
  };

  return { handleSocialLogin };
}
