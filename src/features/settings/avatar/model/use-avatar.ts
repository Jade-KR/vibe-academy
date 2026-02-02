"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { uploadAvatar as uploadAvatarApi, deleteAvatar as deleteAvatarApi } from "../api/avatar";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function useAvatar() {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const t = useTranslations("settings.avatar");
  const { mutate } = useSWRConfig();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "invalidType";
    if (file.size > MAX_SIZE) return "tooLarge";
    return null;
  };

  const upload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(t(validationError));
      return;
    }

    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const result = await uploadAvatarApi(file);
      if (result.success) {
        toast.success(t("success"));
        mutate("/api/user/profile");
      } else {
        toast.error(result.error.message);
        setPreview(null);
      }
    } catch {
      toast.error(t("unexpectedError"));
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const remove = async () => {
    setIsUploading(true);
    try {
      const result = await deleteAvatarApi();
      if (result.success) {
        toast.success(t("removed"));
        setPreview(null);
        mutate("/api/user/profile");
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, remove, isUploading, preview, validateFile };
}
