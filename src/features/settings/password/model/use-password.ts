"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { changePassword as changePasswordApi } from "../api/password";

export function usePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("settings.password");

  const changePassword = async (
    data: { currentPassword: string; newPassword: string; confirmNewPassword: string },
    onSuccess?: () => void,
  ) => {
    setIsLoading(true);
    try {
      const result = await changePasswordApi(data);
      if (result.success) {
        toast.success(t("success"));
        onSuccess?.();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return { changePassword, isLoading };
}
