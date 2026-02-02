import type { SocialProvider } from "@/shared/types";

export interface ProviderDisplayConfig {
  id: SocialProvider;
  label: string; // i18n key under "auth.social"
  /** CSS classes for brand coloring (optional, used for visual distinction) */
  className?: string;
}

/**
 * Display configuration for each social OAuth provider.
 * Labels are i18n keys resolved at render time.
 */
export const PROVIDER_CONFIGS: ProviderDisplayConfig[] = [
  { id: "google", label: "google" },
];

export function getProviderConfigs(filter?: SocialProvider[]): ProviderDisplayConfig[] {
  if (!filter) return PROVIDER_CONFIGS;
  return PROVIDER_CONFIGS.filter((p) => filter.includes(p.id));
}
