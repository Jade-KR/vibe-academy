import type { ApiResponse } from "@/shared/types";

export async function register(data: {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}): Promise<ApiResponse<{ user: { id: string; email: string; name?: string } }>> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
