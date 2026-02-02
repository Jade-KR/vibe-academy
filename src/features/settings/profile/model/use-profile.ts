"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { fetchProfile, updateProfile as updateProfileApi } from "../api/profile";
import type { ProfileData } from "../api/profile";
import type { ApiResponse } from "@/shared/types";

const PROFILE_KEY = "/api/user/profile";

async function profileFetcher(): Promise<ApiResponse<ProfileData>> {
  return fetchProfile();
}

export function useProfile() {
  const t = useTranslations("settings.profile");
  const { data, error, isLoading, mutate } = useSWR(PROFILE_KEY, profileFetcher);

  const updateProfile = async (values: { name?: string; locale?: string }) => {
    const result = await updateProfileApi(values);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    await mutate(result, {
      optimisticData: (current: ApiResponse<ProfileData> | undefined) => {
        const currentData = current?.success ? current.data : ({} as ProfileData);
        return {
          success: true as const,
          data: { ...currentData, ...values },
        };
      },
      rollbackOnError: true,
      revalidate: false,
    });
    toast.success(t("success"));
  };

  return {
    profile: data?.success ? data.data : undefined,
    error,
    isLoading,
    updateProfile,
    mutate,
  };
}
