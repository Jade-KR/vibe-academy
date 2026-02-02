import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

export { WebhookVerificationError };

/**
 * Verifies Polar webhook signature and parses the event payload.
 * Throws WebhookVerificationError if signature is invalid.
 */
export function verifyWebhookEvent(
  body: string,
  headers: Record<string, string>,
): ReturnType<typeof validateEvent> {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("POLAR_WEBHOOK_SECRET environment variable is required");
  }
  return validateEvent(body, headers, webhookSecret);
}
