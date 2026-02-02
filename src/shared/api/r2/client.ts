import { S3Client } from "@aws-sdk/client-s3";

/**
 * R2 configuration is optional — not all environments have R2 configured.
 * When env vars are missing, the client is null and consumers should
 * handle the absence gracefully (e.g. return null for video URLs).
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const isConfigured = !!(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

/**
 * S3-compatible client for Cloudflare R2.
 * Returns null when R2 env vars are not configured.
 */
export const r2Client: S3Client | null = isConfigured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const R2_BUCKET_NAME: string | null = process.env.R2_BUCKET_NAME || null;

/**
 * Optional public domain for R2 bucket. When set, video URLs are served
 * via this domain instead of presigned URLs. Preferred for HLS since
 * segment files (.ts) resolve via relative paths from the same domain.
 */
export const R2_PUBLIC_DOMAIN: string | null = process.env.R2_PUBLIC_DOMAIN || null;
