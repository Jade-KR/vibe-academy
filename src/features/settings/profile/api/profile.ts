import type { ApiResponse } from "@/shared/types";

export interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  locale: string;
  createdAt: string;
}

export async function fetchProfile(): Promise<ApiResponse<ProfileData>> {
  const response = await fetch("/api/user/profile");
  return response.json();
}

export async function updateProfile(data: {
  name?: string;
  locale?: string;
}): Promise<ApiResponse<ProfileData>> {
  const response = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
