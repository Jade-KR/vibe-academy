import type { ApiResponse } from "@/shared/types";

export async function login(data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<ApiResponse<{ user: { id: string; email: string } }>> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
