"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { resetPassword } from "../api/reset-password";

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const t = useTranslations("auth");

  const handleResetPassword = async (data: { password: string; confirmPassword: string }) => {
    setIsLoading(true);
    try {
      const result = await resetPassword(data);
      if (result.success) {
        setIsSuccess(true);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return { handleResetPassword, isLoading, isSuccess };
}
