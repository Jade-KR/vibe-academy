"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { fetchIdentities, disconnectIdentity as disconnectApi } from "../api/connected-accounts";
import type { Identity } from "../api/connected-accounts";
import type { SocialProvider } from "@/shared/types";

export function useConnectedAccounts() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const t = useTranslations("settings.connectedAccounts");

  const loadIdentities = useCallback(async () => {
    try {
      const result = await fetchIdentities();
      if (result.success) {
        setIdentities(result.data.identities);
      }
    } catch {
      // Silent fail on initial load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdentities();
  }, [loadIdentities]);

  const isConnected = (provider: SocialProvider): boolean => {
    return identities.some((identity) => identity.provider === provider);
  };

  const getIdentityId = (provider: SocialProvider): string | undefined => {
    return identities.find((identity) => identity.provider === provider)?.identityId;
  };

  const connect = (provider: SocialProvider) => {
    window.location.href = `/api/auth/social/${provider}`;
  };

  const disconnect = async (identityId: string) => {
    if (identities.length <= 1) {
      toast.error(t("lastIdentity"));
      return;
    }

    setDisconnecting(identityId);
    try {
      const result = await disconnectApi(identityId);
      if (result.success) {
        setIdentities((prev) => prev.filter((i) => i.identityId !== identityId));
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setDisconnecting(null);
    }
  };

  return {
    identities,
    isLoading,
    disconnecting,
    isConnected,
    getIdentityId,
    connect,
    disconnect,
  };
}
