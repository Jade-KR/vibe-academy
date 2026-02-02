import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } from "./client";

/** Default presigned URL expiry for video viewing: 1 hour */
const DEFAULT_GET_EXPIRES_IN = 3600;

/** Default presigned URL expiry for admin uploads: 30 minutes */
const DEFAULT_PUT_EXPIRES_IN = 1800;

/**
 * Get a readable URL for a video stored in R2.
 *
 * Strategy:
 * 1. If R2_PUBLIC_DOMAIN is configured, return a public URL (preferred for HLS).
 * 2. If R2 client is configured, generate a presigned GET URL.
 * 3. If R2 is not configured at all, return null.
 *
 * @param objectKey - R2 object key, e.g. "videos/react/1-1/master.m3u8"
 * @param expiresIn - Presigned URL expiry in seconds (only used if no public domain)
 */
export async function getVideoUrl(
  objectKey: string,
  expiresIn: number = DEFAULT_GET_EXPIRES_IN,
): Promise<string | null> {
  if (R2_PUBLIC_DOMAIN) {
    return `https://${R2_PUBLIC_DOMAIN}/${objectKey}`;
  }

  return getPresignedVideoUrl(objectKey, expiresIn);
}

/**
 * Generate a presigned GET URL for reading an object from R2.
 * Use getVideoUrl() instead when resolving lesson video URLs (handles public domain fallback).
 *
 * Returns null if R2 is not configured.
 *
 * @param objectKey - R2 object key
 * @param expiresIn - URL expiry in seconds (default: 1 hour)
 */
export async function getPresignedVideoUrl(
  objectKey: string,
  expiresIn: number = DEFAULT_GET_EXPIRES_IN,
): Promise<string | null> {
  if (!r2Client || !R2_BUCKET_NAME) return null;

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a presigned PUT URL for uploading an object to R2.
 * Used by admin upload workflow.
 *
 * Returns null if R2 is not configured.
 *
 * @param objectKey - Destination R2 object key
 * @param contentType - MIME type of the upload
 * @param expiresIn - URL expiry in seconds (default: 30 minutes)
 */
export async function getPresignedUploadUrl(
  objectKey: string,
  contentType?: string,
  expiresIn: number = DEFAULT_PUT_EXPIRES_IN,
): Promise<string | null> {
  if (!r2Client || !R2_BUCKET_NAME) return null;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ...(contentType && { ContentType: contentType }),
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}
