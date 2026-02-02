import { getDbUser, type DbUser } from "./get-db-user";
import { errorResponse } from "./response";

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
