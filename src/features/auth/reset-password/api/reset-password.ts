import type { ApiResponse } from "@/shared/types";

export async function resetPassword(data: {
  password: string;
  confirmPassword: string;
}): Promise<ApiResponse<null>> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
