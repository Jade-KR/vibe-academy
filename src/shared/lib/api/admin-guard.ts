import { z } from "zod";
import { getDbUser, type DbUser } from "./get-db-user";
import { errorResponse } from "./response";

const uuidSchema = z.string().uuid();

/** Validate that a route param is a valid UUID. Returns the UUID string if valid, or null if invalid. */
export function parseUuid(id: string): string | null {
  const result = uuidSchema.safeParse(id);
  return result.success ? result.data : null;
}

/**
 * Verify the current request is from an authenticated admin user.
 * Returns the DB user if authorized, or a pre-built error response (401/403) if not.
 */
export async function requireAdmin(): Promise<
  { dbUser: DbUser; response: null } | { dbUser: null; response: ReturnType<typeof errorResponse> }
> {
  const { dbUser, response } = await getDbUser();
  if (!dbUser) return { dbUser: null, response };
  if (dbUser.role !== "admin") {
    return {
      dbUser: null,
      response: errorResponse("FORBIDDEN", "Admin access required", 403),
    };
  }
  return { dbUser, response: null };
}
