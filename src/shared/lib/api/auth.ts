import { createServerClient } from "@/shared/api/supabase";

/**
 * Authenticate the current request by checking the Supabase session.
 * Returns the Supabase client and the authenticated user, or null if not authenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}
