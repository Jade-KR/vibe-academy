# Task-023: Webhook -- Polar Refund Enrollment Revocation

> Created: 2026-02-03
> Based on: exploration.md
> Estimated time: 1.5 hours

## Summary

Extend `handleOrderRefunded` in the existing Polar webhook handler to revoke course enrollments on refund and send a refund notification email. Most of the webhook infrastructure already exists -- this task fills one remaining gap (the refund handler's TODO comment) and adds test coverage for course-purchase webhook paths.

## Requirements

### Functional Requirements

- [ ] `order.refunded` for course purchases: delete enrollment record
- [ ] `order.refunded` for course purchases: send `RefundEmail`
- [ ] `order.refunded` for subscription payments: no enrollment action (existing behavior)
- [ ] Existing webhook flows remain unchanged

### Non-functional Requirements

- [ ] Email is fire-and-forget (failure must not break webhook 200 response)
- [ ] Graceful handling when payment record not found or metadata missing
- [ ] Tests for all new paths

## Architecture

### Data Flow (Refund)

```
Polar order.refunded event
    |
    v
handleOrderRefunded(data)
    |
    +-- 1. Update payments.status = "refunded" (already exists)
    |
    +-- 2. Query payment record by polarPaymentId (NEW)
    |       -> parse metadata JSON -> check type === "course_purchase"
    |
    +-- 3. If course purchase:
    |       a. DELETE FROM enrollments WHERE userId = ? AND courseId = ?
    |       b. Query user + course for email content
    |       c. Fire-and-forget sendEmail(RefundEmail)
    |
    +-- 4. If NOT course purchase: log and return (no enrollment action)
```

## Applied Skills

### Scan Results

3 skills found (project: 3, user: 0, default: 0)

### Selected Skills

| Skill                            | Location | Reason                                                       |
| -------------------------------- | -------- | ------------------------------------------------------------ |
| supabase-postgres-best-practices | project  | DELETE query on enrollments table; need correct WHERE clause |

### Excluded Skills

| Skill                       | Reason                              |
| --------------------------- | ----------------------------------- |
| vercel-react-best-practices | No React/UI components in this task |
| web-design-guidelines       | No UI work in this task             |

---

## Implementation Plan

### Phase 1: Extend `handleOrderRefunded` (~45 min)

**Goal**: Complete the refund handler with enrollment revocation and refund email.

**File**: `src/app/api/payments/webhook/route.ts`

**Tasks**:

1. **Add imports**:
   - `import { RefundEmail } from "@/shared/api/resend/templates/refund";`
   - `import { and } from "drizzle-orm";` (needed for compound WHERE on enrollment delete)

2. **Rewrite `handleOrderRefunded`** (lines 250-264), replacing the TODO comment with actual logic:

   ```typescript
   async function handleOrderRefunded(data: Record<string, unknown>) {
     const polarPaymentId = data.id as string;
     if (!polarPaymentId) return;

     // 1. Mark payment as refunded (existing)
     const [refundedPayment] = await db
       .update(payments)
       .set({ status: "refunded" })
       .where(eq(payments.polarPaymentId, polarPaymentId))
       .returning({
         id: payments.id,
         userId: payments.userId,
         amount: payments.amount,
         currency: payments.currency,
         metadata: payments.metadata,
       });

     if (!refundedPayment) {
       console.log(`[Webhook] Payment not found for refund: ${polarPaymentId}`);
       return;
     }

     console.log(`[Webhook] Payment refunded: ${polarPaymentId}`);

     // 2. Parse stored metadata to check if course purchase
     let storedMeta: Record<string, unknown> | null = null;
     try {
       if (refundedPayment.metadata) {
         const parsed = JSON.parse(refundedPayment.metadata);
         storedMeta = parsed?.metadata ?? parsed;
       }
     } catch {
       console.error(`[Webhook] Failed to parse payment metadata for ${polarPaymentId}`);
       return;
     }

     const isCourse = (storedMeta as Record<string, string> | null)?.type === "course_purchase";
     if (!isCourse) return;

     const userId = refundedPayment.userId;
     const courseId = (storedMeta as Record<string, string>).courseId;
     if (!courseId) {
       console.error(`[Webhook] Missing courseId in refund metadata for ${polarPaymentId}`);
       return;
     }

     // 3. Delete enrollment
     await db
       .delete(enrollments)
       .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

     console.log(`[Webhook] Enrollment revoked for user=${userId} course=${courseId}`);

     // 4. Send refund email (fire-and-forget)
     try {
       const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
       const [course] = await db
         .select({ title: courses.title })
         .from(courses)
         .where(eq(courses.id, courseId))
         .limit(1);

       if (user && course) {
         sendEmail({
           to: user.email,
           subject: `Refund Processed - ${siteConfig.name}`,
           react: RefundEmail({
             name: user.name ?? undefined,
             courseName: course.title,
             amount: refundedPayment.amount,
             currency: refundedPayment.currency,
             dashboardUrl: `${siteConfig.url}/dashboard`,
           }),
         }).catch((err) => {
           console.error("[Webhook] Failed to send refund email", err);
         });
       }
     } catch (emailErr) {
       console.error("[Webhook] Failed to query user/course for refund email", emailErr);
     }
   }
   ```

**Key decisions**:

- Use `.returning()` on the UPDATE query to get payment data in one round-trip instead of a separate SELECT.
- The `metadata` column stores `JSON.stringify(data)` from the original Polar event, so the course metadata is at `parsed.metadata.type` (Polar event data wraps the checkout metadata inside `data.metadata`). Parse defensively with fallback to top-level.
- Use `db.delete(enrollments).where(and(...))` -- the `and` import from drizzle-orm handles compound conditions.
- Graceful skip if payment not found, metadata unparseable, or not a course purchase.

**Verification**:

```bash
pnpm typecheck
pnpm test -- src/__tests__/api/payments/webhook.test.ts
```

### Phase 2: Add Test Coverage (~45 min)

**Goal**: Add tests for course purchase webhook paths and refund enrollment revocation.

**File**: `src/__tests__/api/payments/webhook.test.ts`

**Tasks**:

1. **Add mock for `db.delete`** to the existing mock chain:

   ```typescript
   const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
   // In the db mock:
   delete: vi.fn().mockImplementation(() => ({
     where: mockDeleteWhere,
   })),
   ```

2. **Extend `mockUpdateSet`** to support `.returning()`:

   ```typescript
   const mockUpdateReturning = vi.fn().mockResolvedValue([]);
   const mockUpdateWhere = vi.fn().mockImplementation(() => ({
     returning: mockUpdateReturning,
   }));
   ```

   Note: The existing `handleOrderRefunded` tests should still pass since the non-refund UPDATE paths do not call `.returning()`.

3. **Add mock for `RefundEmail` template**:

   ```typescript
   vi.mock("@/shared/api/resend/templates/refund", () => ({
     RefundEmail: vi.fn((props) => ({ type: "RefundEmail", props })),
   }));
   ```

4. **Add mock for `CourseEnrollmentEmail` template** (if not already mocked):

   ```typescript
   vi.mock("@/shared/api/resend/templates/course-enrollment", () => ({
     CourseEnrollmentEmail: vi.fn((props) => ({ type: "CourseEnrollmentEmail", props })),
   }));
   ```

5. **New test cases** (add after the existing email tests section):

   a. **`order.created` with course_purchase triggers enrollment**:
   - Mock `onConflictDoNothing` + `returning` on insert chain
   - Mock user and course SELECT queries for email
   - Verify enrollment insert was called with correct userId/courseId
   - Verify `CourseEnrollmentEmail` sent

   b. **`order.refunded` for course purchase -- revokes enrollment + sends RefundEmail**:
   - Mock `mockUpdateReturning` to return a payment record with course_purchase metadata
   - Verify `db.delete` called (enrollment revocation)
   - Verify `RefundEmail` sent with correct props (amount, currency, courseName)

   c. **`order.refunded` for subscription payment -- no enrollment action**:
   - Mock `mockUpdateReturning` to return a payment record WITHOUT course_purchase metadata
   - Verify `db.delete` NOT called
   - Verify `RefundEmail` NOT sent

   d. **`order.refunded` when payment not found**:
   - Mock `mockUpdateReturning` to return empty array `[]`
   - Verify no delete, no email, webhook still returns 200

   e. **`order.refunded` -- webhook succeeds even if refund email fails**:
   - Mock email to reject
   - Verify response is still 200

## Risks

| Risk                                                    | Impact | Mitigation                                                                                |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `metadata` JSON structure varies between event types    | Medium | Parse defensively; check both `parsed.metadata` and `parsed` top-level                    |
| Drizzle `update().returning()` mock complexity in tests | Low    | Chain mock carefully; existing tests still use the non-returning path                     |
| Concurrent refund + re-enrollment race                  | Low    | Polar sends refund events once; enrollment delete is idempotent (no error if row missing) |

## Completion Criteria

- [ ] `handleOrderRefunded` deletes enrollment for course purchases
- [ ] `handleOrderRefunded` sends `RefundEmail` for course purchases
- [ ] `handleOrderRefunded` skips enrollment logic for non-course payments
- [ ] All existing webhook tests still pass
- [ ] New tests cover: course order.created enrollment, course refund enrollment revocation, refund email, subscription refund no-op, payment-not-found graceful skip, email failure resilience
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
