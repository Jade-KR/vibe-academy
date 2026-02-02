"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { register } from "../api/register";

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");

  const handleRegister = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await register(data);
      if (result.success) {
        router.push("/verify-email");
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return { handleRegister, isLoading };
}
