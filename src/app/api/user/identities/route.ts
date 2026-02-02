import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";

export async function GET(_request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const {
      data: { user: fullUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !fullUser) {
      return errorResponse("AUTH_ERROR", "Failed to fetch user data", 500);
    }

    const identities = (fullUser.identities ?? []).map((identity) => ({
      id: identity.id,
      identityId: identity.identity_id,
      provider: identity.provider,
      createdAt: identity.created_at,
    }));

    return successResponse({ identities });
  } catch (error) {
    console.error("[GET /api/user/identities]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const body: unknown = await request.json();
    const { identityId } = body as { identityId: string };

    if (!identityId) {
      return errorResponse("VALIDATION_ERROR", "identityId is required", 400);
    }

    // Ensure user has at least 2 identities before unlinking
    const {
      data: { user: fullUser },
    } = await supabase.auth.getUser();

    if (!fullUser || (fullUser.identities?.length ?? 0) <= 1) {
      return errorResponse("LAST_IDENTITY", "Cannot disconnect your only login method", 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase unlinkIdentity type expects UserIdentity but we only have the id
    const { error } = await supabase.auth.unlinkIdentity({ id: identityId } as any);

    if (error) {
      return errorResponse("AUTH_ERROR", error.message, 400);
    }

    return successResponse(null, "Identity disconnected successfully");
  } catch (error) {
    console.error("[DELETE /api/user/identities]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
