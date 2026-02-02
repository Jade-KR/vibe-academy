import type { ApiResponse } from "@/shared/types";

export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/user/avatar", {
    method: "POST",
    body: formData,
  });
  return response.json();
}

export async function deleteAvatar(): Promise<ApiResponse<null>> {
  const response = await fetch("/api/user/avatar", { method: "DELETE" });
  return response.json();
}
