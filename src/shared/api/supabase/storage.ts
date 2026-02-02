import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import { createAdminClient } from "./server";

const AVATAR_BUCKET = "avatars";

function getClient(server?: boolean): SupabaseClient {
  return server ? createAdminClient() : createClient();
}

/**
 * Upload a user avatar to Supabase Storage.
 *
 * File is stored at `{userId}/avatar.{ext}` with upsert enabled,
 * so uploading a new avatar replaces the previous one.
 *
 * @param data - Buffer or File to upload
 * @param userId - The Supabase auth user ID
 * @param options.contentType - MIME type of the file
 * @param options.ext - File extension (jpg, png, webp)
 * @param options.server - Use admin client for server-side uploads (bypasses RLS)
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(
  data: Buffer | File,
  userId: string,
  options: { contentType: string; ext: string; server?: boolean },
): Promise<string> {
  const supabase = getClient(options.server);
  const filePath = `${userId}/avatar.${options.ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, data, {
    upsert: true,
    contentType: options.contentType,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete all avatar variants for a user from Supabase Storage.
 *
 * Removes png, jpg, and webp variants to ensure clean state
 * regardless of which format was previously uploaded.
 *
 * @param userId - The Supabase auth user ID
 * @param options.server - Use admin client for server-side deletes (bypasses RLS)
 */
export async function deleteAvatar(userId: string, options?: { server?: boolean }): Promise<void> {
  const supabase = getClient(options?.server);

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([`${userId}/avatar.png`, `${userId}/avatar.jpg`, `${userId}/avatar.webp`]);

  if (error) throw error;
}
