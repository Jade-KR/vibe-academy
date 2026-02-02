import { NextRequest } from "next/server";
import { verifyWebhookEvent, WebhookVerificationError } from "@/shared/api/polar/webhooks";
import { db } from "@/db/client";
import { subscriptions } from "@/db/schema/subscriptions";
import { payments } from "@/db/schema/payments";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { errorResponse } from "@/shared/lib/api";
import { sendEmail } from "@/shared/api/resend";
import { SubscriptionEmail } from "@/shared/api/resend/templates/subscription";
import { siteConfig } from "@/shared/config/site";

// No auth -- webhooks are verified by signature only

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
    };

    let event: { type: string; data: Record<string, unknown> };
    try {
      event = verifyWebhookEvent(body, headers) as {
        type: string;
        data: Record<string, unknown>;
      };
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        return errorResponse("INVALID_SIGNATURE", "Webhook signature verification failed", 400);
      }
      throw error;
    }

    await handleWebhookEvent(event);

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("[POST /api/payments/webhook]", error);
    return errorResponse("INTERNAL_ERROR", "Webhook processing failed", 500);
  }
}

async function handleWebhookEvent(event: { type: string; data: Record<string, unknown> }) {
  switch (event.type) {
    case "checkout.created":
      await handleCheckoutCreated(event.data);
      break;
    case "checkout.updated":
      await handleCheckoutUpdated(event.data);
      break;
    case "subscription.created":
      await handleSubscriptionCreated(event.data);
      break;
    case "subscription.updated":
      await handleSubscriptionUpdated(event.data);
      break;
    case "subscription.active":
      await handleSubscriptionActive(event.data);
      break;
    case "subscription.canceled":
      await handleSubscriptionCanceled(event.data);
      break;
    case "subscription.revoked":
      await handleSubscriptionRevoked(event.data);
      break;
    case "order.created":
      await handleOrderCreated(event.data);
      break;
    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }
}

// --- Event Handlers ---

async function handleCheckoutCreated(data: Record<string, unknown>) {
  const metadata = data.metadata as Record<string, string> | undefined;
  const userId = metadata?.userId;
  if (!userId) return;

  await db.insert(payments).values({
    userId,
    polarPaymentId: data.id as string,
    amount: (data.amount as number) ?? 0,
    currency: (data.currency as string) ?? "KRW",
    status: "pending",
    description: `Checkout for ${metadata?.planId ?? "unknown"} plan`,
    metadata: JSON.stringify(data),
  });
}

async function handleCheckoutUpdated(data: Record<string, unknown>) {
  const polarPaymentId = data.id as string;
  if (!polarPaymentId) return;

  const status = data.status === "succeeded" ? "completed" : "pending";

  await db.update(payments).set({ status }).where(eq(payments.polarPaymentId, polarPaymentId));
}

async function handleSubscriptionCreated(data: Record<string, unknown>) {
  const metadata = data.metadata as Record<string, string> | undefined;
  const userId = metadata?.userId;
  if (!userId) return;

  await db.insert(subscriptions).values({
    userId,
    polarSubscriptionId: data.id as string,
    polarCustomerId: (data.customerId as string) ?? null,
    planId: metadata?.planId ?? "pro",
    status: "active",
    currentPeriodStart: data.currentPeriodStart
      ? new Date(data.currentPeriodStart as string)
      : null,
    currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd as string) : null,
  });

  // Send subscription confirmation email (fire-and-forget)
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      sendEmail({
        to: user.email,
        subject: `Subscription Confirmed - ${siteConfig.name}`,
        react: SubscriptionEmail({
          name: user.name ?? undefined,
          planName: metadata?.planId ?? "Pro",
          amount: (data.amount as number) ?? 0,
          currency: (data.currency as string) ?? "KRW",
          periodEnd: data.currentPeriodEnd
            ? new Date(data.currentPeriodEnd as string).toLocaleDateString()
            : undefined,
          dashboardUrl: `${siteConfig.url}/dashboard`,
        }),
      }).catch((err) => {
        console.error("[Webhook] Failed to send subscription email", err);
      });
    }
  } catch (emailErr) {
    console.error("[Webhook] Failed to query user for email", emailErr);
  }
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  const polarSubId = data.id as string;
  if (!polarSubId) return;

  await db
    .update(subscriptions)
    .set({
      status: mapPolarStatus(data.status as string),
      currentPeriodStart: data.currentPeriodStart
        ? new Date(data.currentPeriodStart as string)
        : undefined,
      currentPeriodEnd: data.currentPeriodEnd
        ? new Date(data.currentPeriodEnd as string)
        : undefined,
      cancelAtPeriodEnd: (data.cancelAtPeriodEnd as boolean) ?? false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.polarSubscriptionId, polarSubId));
}

async function handleSubscriptionActive(data: Record<string, unknown>) {
  const polarSubId = data.id as string;
  if (!polarSubId) return;

  await db
    .update(subscriptions)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(subscriptions.polarSubscriptionId, polarSubId));
}

async function handleSubscriptionCanceled(data: Record<string, unknown>) {
  const polarSubId = data.id as string;
  if (!polarSubId) return;

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.polarSubscriptionId, polarSubId));
}

async function handleSubscriptionRevoked(data: Record<string, unknown>) {
  const polarSubId = data.id as string;
  if (!polarSubId) return;

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.polarSubscriptionId, polarSubId));
}

async function handleOrderCreated(data: Record<string, unknown>) {
  const metadata = data.metadata as Record<string, string> | undefined;
  const userId = metadata?.userId;
  if (!userId) return;

  await db.insert(payments).values({
    userId,
    polarPaymentId: data.id as string,
    amount: (data.amount as number) ?? 0,
    currency: (data.currency as string) ?? "KRW",
    status: "completed",
    description: `Order for ${metadata?.planId ?? "unknown"} plan`,
    metadata: JSON.stringify(data),
  });
}

function mapPolarStatus(
  polarStatus: string,
): "active" | "canceled" | "past_due" | "unpaid" | "incomplete" | "trialing" {
  const statusMap: Record<
    string,
    "active" | "canceled" | "past_due" | "unpaid" | "incomplete" | "trialing"
  > = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    unpaid: "unpaid",
    incomplete: "incomplete",
    trialing: "trialing",
  };
  return statusMap[polarStatus] ?? "active";
}
