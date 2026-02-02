"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import type { SocialProvider } from "@/shared/types";
import { getProviderConfigs } from "../config/providers";
import { useSocialLogin } from "../model/use-social-login";
import { cn } from "@/shared/lib/cn";

export interface SocialLoginButtonsProps {
  /** Filter to show only specific providers. Defaults to all. */
  providers?: SocialProvider[];
  /** Whether to show the "or" divider above the buttons. Defaults to true. */
  showDivider?: boolean;
  /** Disable all buttons (e.g., while parent form is submitting). */
  disabled?: boolean;
  /** Additional CSS class for the container. */
  className?: string;
}

export function SocialLoginButtons({
  providers,
  showDivider = true,
  disabled = false,
  className,
}: SocialLoginButtonsProps) {
  const t = useTranslations("auth.social");
  const { handleSocialLogin } = useSocialLogin();
  const configs = getProviderConfigs(providers);

  return (
    <div className={cn("space-y-4", className)}>
      {showDivider && (
        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="px-3 text-sm text-muted-foreground">{t("dividerText")}</span>
          <Separator className="flex-1" />
        </div>
      )}
      <div className="grid gap-2">
        {configs.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className={cn("w-full", provider.className)}
            disabled={disabled}
            onClick={() => handleSocialLogin(provider.id)}
            aria-label={t("continueWith", { provider: t(provider.label) })}
          >
            {t("continueWith", { provider: t(provider.label) })}
          </Button>
        ))}
      </div>
    </div>
  );
}
