import type { ApiResponse } from "@/shared/types";

export async function forgotPassword(data: { email: string }): Promise<ApiResponse<null>> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
