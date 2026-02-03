import { NextRequest } from "next/server";
import { verifyWebhookEvent, WebhookVerificationError } from "@/shared/api/polar/webhooks";
import { db } from "@/db/client";
import { subscriptions } from "@/db/schema/subscriptions";
import { payments } from "@/db/schema/payments";
import { users } from "@/db/schema/users";
import { enrollments } from "@/db/schema/enrollments";
import { courses } from "@/db/schema/courses";
import { eq, and } from "drizzle-orm";
import { errorResponse } from "@/shared/lib/api";
import { sendEmail } from "@/shared/api/resend";
import { SubscriptionEmail } from "@/shared/api/resend/templates/subscription";
import { CourseEnrollmentEmail } from "@/shared/api/resend/templates/course-enrollment";
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
    case "order.refunded":
      await handleOrderRefunded(event.data);
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

  const isCourse = metadata?.type === "course_purchase";

  await db.insert(payments).values({
    userId,
    polarPaymentId: data.id as string,
    amount: (data.amount as number) ?? 0,
    currency: (data.currency as string) ?? "KRW",
    status: "pending",
    description: isCourse
      ? `Course purchase: ${metadata?.courseSlug ?? "unknown"}`
      : `Checkout for ${metadata?.planId ?? "unknown"} plan`,
    metadata: JSON.stringify(data),
  });
}

async function handleCheckoutUpdated(data: Record<string, unknown>) {
  const polarPaymentId = data.id as string;
  if (!polarPaymentId) return;

  const metadata = data.metadata as Record<string, string> | undefined;
  const status = mapCheckoutStatus(data.status);

  // Update payment status (works for both subscription and course)
  await db.update(payments).set({ status }).where(eq(payments.polarPaymentId, polarPaymentId));

  // Course purchase: create enrollment on success
  if (metadata?.type === "course_purchase" && status === "completed") {
    await handleCourseEnrollment(metadata, polarPaymentId, data);
  }
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

  const isCourse = metadata?.type === "course_purchase";
  const polarPaymentId = data.id as string;

  await db.insert(payments).values({
    userId,
    polarPaymentId,
    amount: (data.amount as number) ?? 0,
    currency: (data.currency as string) ?? "KRW",
    status: "completed",
    description: isCourse
      ? `Course purchase: ${metadata?.courseSlug ?? "unknown"}`
      : `Order for ${metadata?.planId ?? "unknown"} plan`,
    metadata: JSON.stringify(data),
  });

  // Course purchase: create enrollment
  if (isCourse) {
    await handleCourseEnrollment(metadata, polarPaymentId, data);
  }
}

async function handleOrderRefunded(data: Record<string, unknown>) {
  const polarPaymentId = data.id as string;
  if (!polarPaymentId) return;

  // Mark payment as refunded
  await db
    .update(payments)
    .set({ status: "refunded" })
    .where(eq(payments.polarPaymentId, polarPaymentId));

  console.log(`[Webhook] Payment refunded: ${polarPaymentId}`);

  // Note: enrollment removal and refund email are handled by a separate refund task.
  // For now, just update payment status.
}

// --- Course Purchase Helpers ---

async function handleCourseEnrollment(
  metadata: Record<string, string>,
  _polarPaymentId: string,
  _data: Record<string, unknown>,
) {
  const userId = metadata.userId;
  const courseId = metadata.courseId;
  if (!userId || !courseId) {
    console.error("[Webhook] Missing userId or courseId in course purchase metadata");
    return;
  }

  // Idempotency: check if enrollment already exists
  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (existing) {
    console.log(
      `[Webhook] Enrollment already exists for user=${userId} course=${courseId}, skipping`,
    );
    return;
  }

  // Create enrollment
  await db.insert(enrollments).values({
    userId,
    courseId,
    paymentId: _polarPaymentId,
  });

  console.log(`[Webhook] Enrollment created for user=${userId} course=${courseId}`);

  // Send confirmation email (fire-and-forget)
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [course] = await db
      .select({ title: courses.title, price: courses.price })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (user && course) {
      const courseSlug = metadata.courseSlug ?? "";
      sendEmail({
        to: user.email,
        subject: `Course Enrolled - ${siteConfig.name}`,
        react: CourseEnrollmentEmail({
          name: user.name ?? undefined,
          courseName: course.title,
          price: course.price,
          currency: "KRW",
          learnUrl: `${siteConfig.url}/ko/learn/${courseSlug}`,
        }),
      }).catch((err) => {
        console.error("[Webhook] Failed to send course enrollment email", err);
      });
    }
  } catch (emailErr) {
    console.error("[Webhook] Failed to query user/course for enrollment email", emailErr);
  }
}

function mapCheckoutStatus(polarStatus: unknown): "pending" | "completed" | "failed" {
  if (polarStatus === "succeeded") return "completed";
  if (polarStatus === "failed" || polarStatus === "expired") return "failed";
  return "pending";
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
