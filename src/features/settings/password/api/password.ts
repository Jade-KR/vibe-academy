import type { ApiResponse } from "@/shared/types";

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<ApiResponse<null>> {
  const response = await fetch("/api/user/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
