"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { PROVIDER_CONFIGS } from "@/features/auth/social-login/config/providers";
import { useConnectedAccounts } from "../model/use-connected-accounts";
import type { SocialProvider } from "@/shared/types";

export function ConnectedAccounts() {
  const t = useTranslations("settings.connectedAccounts");
  const tSocial = useTranslations("auth.social");
  const { isLoading, disconnecting, isConnected, getIdentityId, connect, disconnect } =
    useConnectedAccounts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3" data-testid="connected-accounts-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {PROVIDER_CONFIGS.map((provider) => {
            const connected = isConnected(provider.id);
            const identityId = getIdentityId(provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{tSocial(provider.label)}</span>
                  {connected && <Badge variant="secondary">{t("connected")}</Badge>}
                </div>
                <div>
                  {connected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disconnecting === identityId}
                      onClick={() => identityId && disconnect(identityId)}
                      aria-label={t("disconnect")}
                    >
                      {t("disconnect")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => connect(provider.id as SocialProvider)}
                      aria-label={t("connect")}
                    >
                      {t("connect")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
