import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "./auth";
import { errorResponse } from "./response";

export type DbUser = {
  id: string;
  role: "user" | "admin";
};

/**
 * Authenticate the request and resolve to the internal DB user.
 * Returns either { dbUser, response: null } or { dbUser: null, response: NextResponse }.
 */
export async function getDbUser(): Promise<
  { dbUser: DbUser; response: null } | { dbUser: null; response: ReturnType<typeof errorResponse> }
> {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return {
      dbUser: null,
      response: errorResponse("UNAUTHORIZED", "Authentication required", 401),
    };
  }

  const [dbUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.supabaseUserId, user.id));

  if (!dbUser) {
    return {
      dbUser: null,
      response: errorResponse("NOT_FOUND", "User not found", 404),
    };
  }

  return { dbUser, response: null };
}
