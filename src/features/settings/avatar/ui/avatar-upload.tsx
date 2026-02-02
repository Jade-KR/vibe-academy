"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { useAvatar } from "../model/use-avatar";

export interface AvatarUploadProps {
  avatarUrl: string | null;
  name: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AvatarUpload({ avatarUrl, name }: AvatarUploadProps) {
  const t = useTranslations("settings.avatar");
  const { upload, remove, isUploading, preview } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const displayUrl = preview ?? avatarUrl;

  const handleFileChange = useCallback(
    (file: File | undefined) => {
      if (file) {
        upload(file);
      }
    },
    [upload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0]);
    // Reset input value so the same file can be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div
            data-testid="avatar-drop-zone"
            className={cn(
              "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {displayUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- blob URLs from createObjectURL are not compatible with next/image */
              <img src={displayUrl} alt={name ?? "Avatar"} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {getInitials(name)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                aria-label={t("upload")}
              >
                {t("upload")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={remove}
                aria-label={t("remove")}
              >
                {t("remove")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("maxSize")}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          data-testid="avatar-file-input"
          onChange={handleInputChange}
        />
      </CardContent>
    </Card>
  );
}
