"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { login } from "../api/login";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");

  const handleLogin = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    setIsLoading(true);
    try {
      const result = await login(data);
      if (result.success) {
        router.push("/dashboard");
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading };
}
