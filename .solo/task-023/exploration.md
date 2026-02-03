# Exploration Results: Webhook 확장 -- Polar 강의 결제 이벤트 처리

> Task: task-023
> Explored at: 2026-02-03

## Summary

**The webhook handler already fully supports course purchase events, enrollment creation, and enrollment confirmation emails.** The existing code in `src/app/api/payments/webhook/route.ts` already branches between subscription and course purchase flows. The remaining gap is **refund handling** -- the `order.refunded` handler currently only updates payment status but does NOT revoke the enrollment or send a refund email.

---

## Related Files

### Directly Related (Webhook + Checkout Flow)

- `/Users/jade/projects/vibeAcademy/src/app/api/payments/webhook/route.ts` -- Main webhook handler (353 lines). Already handles 9 event types including course enrollment.
- `/Users/jade/projects/vibeAcademy/src/app/api/checkout/[courseSlug]/route.ts` -- Checkout API. Handles free (direct enrollment) and paid (Polar checkout session) courses.
- `/Users/jade/projects/vibeAcademy/src/shared/api/polar/webhooks.ts` -- Webhook signature verification using `@polar-sh/sdk/webhooks`.
- `/Users/jade/projects/vibeAcademy/src/shared/api/polar/client.ts` -- Polar SDK client.

### Email Templates

- `/Users/jade/projects/vibeAcademy/src/shared/api/resend/templates/course-enrollment.tsx` -- Already exists. Props: `{ name?, courseName, price, currency, learnUrl }`.
- `/Users/jade/projects/vibeAcademy/src/shared/api/resend/templates/refund.tsx` -- Already exists. Props: `{ name?, courseName, amount, currency, reason?, dashboardUrl }`.
- `/Users/jade/projects/vibeAcademy/src/shared/api/resend/templates/subscription.tsx` -- Reference: subscription email pattern.
- `/Users/jade/projects/vibeAcademy/src/shared/api/resend/client.ts` -- `sendEmail({ to, subject, react })`.
- `/Users/jade/projects/vibeAcademy/src/shared/api/resend/index.ts` -- Barrel export. Already exports `CourseEnrollmentEmail` and `RefundEmail`.

### Database Schema

- `/Users/jade/projects/vibeAcademy/src/db/schema/enrollments.ts` -- `enrollments` table: `{ id, userId, courseId, paymentId, purchasedAt, expiresAt }`. Has unique constraint on `(userId, courseId)`.
- `/Users/jade/projects/vibeAcademy/src/db/schema/payments.ts` -- `payments` table: `{ id, userId, polarPaymentId (unique), amount, currency, status, description, metadata, createdAt }`.
- `/Users/jade/projects/vibeAcademy/src/db/schema/enums.ts` -- `payment_status`: `pending | completed | failed | refunded`.
- `/Users/jade/projects/vibeAcademy/src/db/schema/courses.ts` -- `courses` table includes `polarProductId`, `isFree`, `price`, `slug`, `title`.

### Enrollment Entity + Utilities

- `/Users/jade/projects/vibeAcademy/src/entities/enrollment/api/use-enrollment.ts` -- SWR hook for single course enrollment check.
- `/Users/jade/projects/vibeAcademy/src/entities/enrollment/api/use-enrollments.ts` -- SWR hook for user's enrollment list.
- `/Users/jade/projects/vibeAcademy/src/shared/lib/api/enrollment-check.ts` -- Server-side `verifyLessonEnrollment(lessonId, userId)`.

### Tests

- `/Users/jade/projects/vibeAcademy/src/__tests__/api/payments/webhook.test.ts` -- 13 existing tests covering signature verification, all subscription events, checkout events, email sending, and error cases. Does NOT yet test course purchase (order.created with type=course_purchase) or order.refunded scenarios.

### Config

- `/Users/jade/projects/vibeAcademy/src/shared/config/site.ts` -- `siteConfig.name = "vibePack"`, `siteConfig.url = process.env.NEXT_PUBLIC_APP_URL`.

---

## What Already Exists (Complete)

### 1. Webhook Event Routing

The `handleWebhookEvent` switch already covers all needed event types:

- `checkout.created` -- Creates pending payment record. Detects course purchase via `metadata.type === "course_purchase"`.
- `checkout.updated` -- Updates payment status. On success for course purchases, calls `handleCourseEnrollment`.
- `order.created` -- Creates completed payment record. For course purchases, calls `handleCourseEnrollment`.
- `order.refunded` -- Marks payment as refunded. **Incomplete** (see below).
- All subscription events (created, updated, active, canceled, revoked).

### 2. Course Enrollment Creation (`handleCourseEnrollment`)

Already implemented at lines 268-329:

- Extracts `userId` and `courseId` from metadata.
- Uses `onConflictDoNothing` for idempotent enrollment insert.
- Logs skip when enrollment already exists.
- Sends `CourseEnrollmentEmail` via fire-and-forget `sendEmail()`.
- Queries user and course for email content.

### 3. Checkout Metadata

The checkout route (`/api/checkout/[courseSlug]`) attaches:

```typescript
metadata: {
  userId: dbUser.id,
  courseId: course.id,
  courseSlug: courseSlug,
  type: "course_purchase",
}
```

This metadata is used by the webhook handler to distinguish course purchases from subscription purchases.

### 4. Email Templates

- `CourseEnrollmentEmail` -- Complete with styled HTML email.
- `RefundEmail` -- Complete with styled HTML email. Props: `{ name?, courseName, amount, currency, reason?, dashboardUrl }`.
- Both already exported from `@/shared/api/resend/index.ts`.

### 5. Free Course Direct Enrollment

The checkout route handles free courses directly (no Polar) -- inserts enrollment and sends email in the API route itself, not via webhook.

---

## What Needs To Be Built (Gap Analysis)

### Gap 1: `order.refunded` -- Enrollment Revocation + Refund Email

**Current state** (lines 250-264):

```typescript
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
```

**What's missing:**

1. Look up the payment record to get `userId` and extract `courseId`/`courseSlug` from the stored `metadata` JSON or from the event metadata.
2. Delete the enrollment record: `DELETE FROM enrollments WHERE userId = ? AND courseId = ?`.
3. Send `RefundEmail` to the user (fire-and-forget pattern, same as enrollment email).
4. The `RefundEmail` template already exists and is already exported.

**Implementation notes:**

- The `payments.metadata` column stores `JSON.stringify(data)` from the original checkout/order event, which includes the full Polar event data with `metadata.courseId`, `metadata.courseSlug`, etc.
- Alternatively, the `order.refunded` event data itself may include metadata from the original order.
- Need to handle the case where the refund is for a subscription (not a course) -- only revoke enrollment if `metadata.type === "course_purchase"`.

### Gap 2: Test Coverage for Course Purchase Events

The existing test file (`webhook.test.ts`) does NOT test:

- `order.created` with `type: "course_purchase"` metadata (enrollment creation path)
- `checkout.updated` with `type: "course_purchase"` and `status: "succeeded"` (enrollment creation path)
- `order.refunded` (current behavior or new refund+enrollment revocation)
- `CourseEnrollmentEmail` being sent on course enrollment
- `RefundEmail` being sent on refund

---

## Discovered Patterns

### Webhook Event Handler Pattern

```typescript
async function handleXxxEvent(data: Record<string, unknown>) {
  const metadata = data.metadata as Record<string, string> | undefined;
  const userId = metadata?.userId;
  if (!userId) return;  // graceful skip

  // DB operation
  await db.insert(...).values({ ... });

  // Fire-and-forget email (try/catch, non-blocking)
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      sendEmail({ ... }).catch((err) => {
        console.error("[Webhook] Failed to send email", err);
      });
    }
  } catch (emailErr) {
    console.error("[Webhook] Failed to query user for email", emailErr);
  }
}
```

### Idempotent Insert Pattern

```typescript
const result = await db
  .insert(enrollments)
  .values({ userId, courseId, paymentId })
  .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] })
  .returning({ id: enrollments.id });

if (result.length === 0) {
  console.log(`[Webhook] Already exists, skipping`);
  return;
}
```

### Course vs Subscription Branching

The handler checks `metadata.type === "course_purchase"` to branch between course and subscription flows. This is set by the checkout API.

### Email Sending Pattern

- Fire-and-forget: `sendEmail({...}).catch(err => console.error(...))`
- Wrapped in try/catch so DB query failures for email don't break the webhook response
- Subject format: `"Action - ${siteConfig.name}"`

### Test Mock Pattern

- `mockVerifyWebhookEvent` for webhook verification
- Drizzle chain mocks: `mockInsertValues`, `mockUpdateSet`/`mockUpdateWhere`, `mockSelectFrom`/`mockSelectWhere`/`mockSelectLimit`
- `mockSendEmail` for email verification
- Uses `await new Promise((r) => setTimeout(r, 10))` to wait for fire-and-forget email promises

---

## Conventions

| Item                   | Pattern                                                |
| ---------------------- | ------------------------------------------------------ |
| Webhook log prefix     | `[Webhook]`                                            |
| API route log prefix   | `[POST /api/path]`                                     |
| Email: fire-and-forget | `sendEmail({...}).catch(err => console.error(...))`    |
| Enrollment: idempotent | `onConflictDoNothing` + check `result.length === 0`    |
| Metadata typing        | `data.metadata as Record<string, string> \| undefined` |
| Course detection       | `metadata?.type === "course_purchase"`                 |

---

## Recommended Approach

### 1. Extend `handleOrderRefunded` in `/Users/jade/projects/vibeAcademy/src/app/api/payments/webhook/route.ts`

- After updating payment status to "refunded", look up the original payment's metadata to determine if it was a course purchase.
- Two approaches to get course info:
  - (a) Query `payments` table for the record with this `polarPaymentId`, parse its `metadata` JSON to get `courseId`/`courseSlug`.
  - (b) Check `data.metadata` from the refund event itself (Polar may forward original metadata).
  - Recommend approach (a) as it's more reliable -- we stored the metadata at checkout/order time.
- If it's a course purchase, delete the enrollment and send `RefundEmail`.
- Import `RefundEmail` (already exported from `@/shared/api/resend/index.ts`).

### 2. Add test cases to `/Users/jade/projects/vibeAcademy/src/__tests__/api/payments/webhook.test.ts`

- Test `order.created` with course_purchase metadata triggers enrollment creation
- Test `order.refunded` triggers enrollment deletion + refund email
- Test `order.refunded` for non-course payment does NOT attempt enrollment deletion
- Test refund email failure does not break webhook response (fire-and-forget resilience)

### 3. No schema changes needed

- The `enrollments` table already has all needed columns.
- The `payments` table already stores metadata JSON.
- The `RefundEmail` template already exists with appropriate props.
- The barrel exports in `@/shared/api/resend/index.ts` already include `RefundEmail`.

### 4. Imports to add in webhook route

```typescript
import { RefundEmail } from "@/shared/api/resend/templates/refund";
```

(Already imported: `CourseEnrollmentEmail`, `sendEmail`, `siteConfig`, `enrollments`, `courses`, `users`, `payments`, `db`, `eq`)
