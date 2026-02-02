"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { forgotPassword } from "../api/forgot-password";

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const t = useTranslations("auth");

  const handleForgotPassword = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const result = await forgotPassword(data);
      if (result.success) {
        setIsSent(true);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return { handleForgotPassword, isLoading, isSent };
}
