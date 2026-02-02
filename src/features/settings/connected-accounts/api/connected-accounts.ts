import type { ApiResponse } from "@/shared/types";

export interface Identity {
  id: string;
  identityId: string;
  provider: string;
  createdAt: string;
}

export async function fetchIdentities(): Promise<ApiResponse<{ identities: Identity[] }>> {
  const response = await fetch("/api/user/identities");
  return response.json();
}

export async function disconnectIdentity(identityId: string): Promise<ApiResponse<null>> {
  const response = await fetch("/api/user/identities", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identityId }),
  });
  return response.json();
}
