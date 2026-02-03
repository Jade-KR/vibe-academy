import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---- Mocks ----

const mockVerifyWebhookEvent = vi.fn();
vi.mock("@/shared/api/polar/webhooks", () => ({
  verifyWebhookEvent: mockVerifyWebhookEvent,
  WebhookVerificationError: class WebhookVerificationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "WebhookVerificationError";
    }
  },
}));

// Drizzle mock chains

// Insert chain: values() -> onConflictDoNothing() -> returning()
const mockInsertReturning = vi.fn().mockResolvedValue([]);
const mockInsertOnConflictDoNothing = vi.fn().mockImplementation(() => ({
  returning: mockInsertReturning,
}));
const mockInsertValues = vi.fn().mockImplementation(() => ({
  onConflictDoNothing: mockInsertOnConflictDoNothing,
}));

// Update chain: set() -> where() -> returning()
const mockUpdateReturning = vi.fn().mockResolvedValue([]);
const mockUpdateWhere = vi.fn().mockImplementation(() => ({
  returning: mockUpdateReturning,
}));
const mockUpdateSet = vi.fn().mockImplementation(() => ({
  where: mockUpdateWhere,
}));

// Select chain: from() -> where() -> limit()
const mockSelectLimit = vi.fn().mockResolvedValue([]);
const mockSelectWhere = vi.fn().mockImplementation(() => ({
  limit: mockSelectLimit,
}));
const mockSelectFrom = vi.fn().mockImplementation(() => ({
  where: mockSelectWhere,
}));

// Delete chain: where()
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);

vi.mock("@/db/client", () => ({
  db: {
    insert: vi.fn().mockImplementation(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn().mockImplementation(() => ({
      set: mockUpdateSet,
    })),
    select: vi.fn().mockImplementation(() => ({
      from: mockSelectFrom,
    })),
    delete: vi.fn().mockImplementation(() => ({
      where: mockDeleteWhere,
    })),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
  and: vi.fn().mockImplementation((...conditions: unknown[]) => ({ and: conditions })),
}));

// Resend email mock
const mockSendEmail = vi.fn().mockResolvedValue({ data: { id: "msg_123" } });
vi.mock("@/shared/api/resend", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/shared/api/resend/templates/subscription", () => ({
  SubscriptionEmail: vi.fn((props: Record<string, unknown>) => ({
    type: "SubscriptionEmail",
    props,
  })),
}));

vi.mock("@/shared/api/resend/templates/course-enrollment", () => ({
  CourseEnrollmentEmail: vi.fn((props: Record<string, unknown>) => ({
    type: "CourseEnrollmentEmail",
    props,
  })),
}));

vi.mock("@/shared/api/resend/templates/refund", () => ({
  RefundEmail: vi.fn((props: Record<string, unknown>) => ({
    type: "RefundEmail",
    props,
  })),
}));

vi.mock("@/shared/config/site", () => ({
  siteConfig: {
    name: "vibePack",
    url: "http://localhost:3000",
  },
}));

// ---- Helpers ----

function createWebhookRequest(body: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "webhook-id": "wh-123",
      "webhook-timestamp": "1234567890",
      "webhook-signature": "v1,sig123",
      ...headers,
    },
    body,
  });
}

// ---- Tests ----

describe("POST /api/payments/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when webhook signature verification fails", async () => {
    const { WebhookVerificationError } = await import("@/shared/api/polar/webhooks");
    mockVerifyWebhookEvent.mockImplementation(() => {
      throw new WebhookVerificationError("Invalid signature");
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "test" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_SIGNATURE");
  });

  it("handles checkout.created event - inserts payment record", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "checkout.created",
      data: {
        id: "checkout-123",
        amount: 19000,
        currency: "KRW",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "checkout.created" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "db-user-456",
        polarPaymentId: "checkout-123",
        status: "pending",
      }),
    );
  });

  it("handles checkout.updated event (succeeded) - updates payment status", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "checkout.updated",
      data: {
        id: "checkout-123",
        status: "succeeded",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "checkout.updated" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
  });

  it("handles subscription.created event - inserts subscription record", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.created",
      data: {
        id: "polar-sub-abc",
        customerId: "polar-cust-def",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        currentPeriodEnd: "2026-02-01T00:00:00Z",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.created" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "db-user-456",
        polarSubscriptionId: "polar-sub-abc",
        planId: "pro",
        status: "active",
      }),
    );
  });

  it("handles subscription.updated event - updates subscription fields", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.updated",
      data: {
        id: "polar-sub-abc",
        status: "active",
        currentPeriodStart: "2026-02-01T00:00:00Z",
        currentPeriodEnd: "2026-03-01T00:00:00Z",
        cancelAtPeriodEnd: false,
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.updated" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        cancelAtPeriodEnd: false,
      }),
    );
  });

  it("handles subscription.active event - sets status to active", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.active",
      data: {
        id: "polar-sub-abc",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.active" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
  });

  it("handles subscription.canceled event - sets status to canceled", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.canceled",
      data: {
        id: "polar-sub-abc",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.canceled" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "canceled",
        cancelAtPeriodEnd: true,
      }),
    );
  });

  it("handles subscription.revoked event - clears period dates", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.revoked",
      data: {
        id: "polar-sub-abc",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.revoked" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "canceled",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    );
  });

  it("handles order.created event - inserts payment with completed status", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.created",
      data: {
        id: "order-456",
        amount: 19000,
        currency: "KRW",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "order.created" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "db-user-456",
        polarPaymentId: "order-456",
        status: "completed",
      }),
    );
  });

  it("acknowledges unknown event types with 200", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "unknown.event",
      data: {},
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "unknown.event" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
  });

  it("returns 500 when DB error occurs during processing", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "checkout.created",
      data: {
        id: "checkout-123",
        amount: 19000,
        currency: "KRW",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });
    mockInsertValues.mockImplementationOnce(() => {
      throw new Error("DB connection failed");
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "checkout.created" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("skips checkout.created when metadata has no userId", async () => {
    mockVerifyWebhookEvent.mockReturnValue({
      type: "checkout.created",
      data: {
        id: "checkout-123",
        amount: 19000,
        currency: "KRW",
        metadata: {},
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "checkout.created" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  // ---- Subscription email tests ----

  it("sends subscription email after subscription.created when user found", async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { id: "db-user-456", email: "jade@test.com", name: "Jade" },
    ]);

    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.created",
      data: {
        id: "polar-sub-abc",
        customerId: "polar-cust-def",
        amount: 19000,
        currency: "KRW",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        currentPeriodEnd: "2026-02-01T00:00:00Z",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.created" }));
    const response = await POST(request);

    expect(response.status).toBe(200);

    // Give fire-and-forget a tick
    await new Promise((r) => setTimeout(r, 10));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jade@test.com",
        subject: expect.stringContaining("Subscription"),
      }),
    );
  });

  it("webhook succeeds even if subscription email fails", async () => {
    mockSelectLimit.mockResolvedValueOnce([
      { id: "db-user-456", email: "jade@test.com", name: "Jade" },
    ]);
    mockSendEmail.mockRejectedValueOnce(new Error("Email send failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.created",
      data: {
        id: "polar-sub-abc",
        customerId: "polar-cust-def",
        amount: 19000,
        currency: "KRW",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        currentPeriodEnd: "2026-02-01T00:00:00Z",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.created" }));
    const response = await POST(request);

    expect(response.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));
    consoleSpy.mockRestore();
  });

  it("skips email if user not found in DB after subscription.created", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    mockVerifyWebhookEvent.mockReturnValue({
      type: "subscription.created",
      data: {
        id: "polar-sub-abc",
        customerId: "polar-cust-def",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        currentPeriodEnd: "2026-02-01T00:00:00Z",
        metadata: {
          userId: "db-user-456",
          planId: "pro",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "subscription.created" }));
    const response = await POST(request);

    expect(response.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  // ---- Course purchase enrollment tests ----

  it("order.created with course_purchase triggers enrollment insert and email", async () => {
    // Enrollment insert returns a new record
    mockInsertReturning.mockResolvedValueOnce([{ id: "enrollment-001" }]);

    // User and course SELECT queries for email
    mockSelectLimit
      .mockResolvedValueOnce([{ id: "db-user-456", email: "jade@test.com", name: "Jade" }])
      .mockResolvedValueOnce([{ title: "React Mastery", price: 49000 }]);

    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.created",
      data: {
        id: "order-course-789",
        amount: 49000,
        currency: "KRW",
        metadata: {
          userId: "db-user-456",
          courseId: "course-abc",
          courseSlug: "react-mastery",
          type: "course_purchase",
        },
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "order.created" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // Payment insert
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "db-user-456",
        polarPaymentId: "order-course-789",
        status: "completed",
      }),
    );

    // Enrollment insert via onConflictDoNothing chain
    expect(mockInsertOnConflictDoNothing).toHaveBeenCalled();
    expect(mockInsertReturning).toHaveBeenCalled();

    // Give fire-and-forget a tick
    await new Promise((r) => setTimeout(r, 10));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jade@test.com",
        subject: expect.stringContaining("Course Enrolled"),
      }),
    );
  });

  // ---- Refund tests ----

  it("order.refunded for course purchase revokes enrollment and sends RefundEmail", async () => {
    const courseMetadata = JSON.stringify({
      metadata: {
        userId: "db-user-456",
        courseId: "course-abc",
        courseSlug: "react-mastery",
        type: "course_purchase",
      },
    });

    // Update returns the refunded payment record
    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: "payment-001",
        userId: "db-user-456",
        amount: 49000,
        currency: "KRW",
        metadata: courseMetadata,
      },
    ]);

    // User and course SELECT queries for refund email
    mockSelectLimit
      .mockResolvedValueOnce([{ id: "db-user-456", email: "jade@test.com", name: "Jade" }])
      .mockResolvedValueOnce([{ title: "React Mastery" }]);

    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.refunded",
      data: {
        id: "order-course-789",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const { db } = await import("@/db/client");
    const request = createWebhookRequest(JSON.stringify({ type: "order.refunded" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // Payment updated to refunded
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "refunded" }));

    // Enrollment deleted
    expect(db.delete).toHaveBeenCalled();
    expect(mockDeleteWhere).toHaveBeenCalled();

    // Give fire-and-forget a tick
    await new Promise((r) => setTimeout(r, 10));

    // Refund email sent
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jade@test.com",
        subject: expect.stringContaining("Refund Processed"),
      }),
    );
  });

  it("order.refunded for subscription payment does NOT delete enrollment or send RefundEmail", async () => {
    const subscriptionMetadata = JSON.stringify({
      metadata: {
        userId: "db-user-456",
        planId: "pro",
      },
    });

    // Update returns a subscription payment (no type=course_purchase)
    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: "payment-002",
        userId: "db-user-456",
        amount: 19000,
        currency: "KRW",
        metadata: subscriptionMetadata,
      },
    ]);

    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.refunded",
      data: {
        id: "order-sub-456",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const { db } = await import("@/db/client");
    const request = createWebhookRequest(JSON.stringify({ type: "order.refunded" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // Payment updated to refunded
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "refunded" }));

    // No enrollment deletion
    expect(db.delete).not.toHaveBeenCalled();

    // No refund email
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("order.refunded when payment not found gracefully returns 200", async () => {
    // Update returns empty array (payment not found)
    mockUpdateReturning.mockResolvedValueOnce([]);

    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.refunded",
      data: {
        id: "order-nonexistent",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const { db } = await import("@/db/client");
    const request = createWebhookRequest(JSON.stringify({ type: "order.refunded" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // No delete, no email
    expect(db.delete).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("order.refunded succeeds even if refund email fails", async () => {
    const courseMetadata = JSON.stringify({
      metadata: {
        userId: "db-user-456",
        courseId: "course-abc",
        courseSlug: "react-mastery",
        type: "course_purchase",
      },
    });

    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: "payment-001",
        userId: "db-user-456",
        amount: 49000,
        currency: "KRW",
        metadata: courseMetadata,
      },
    ]);

    // User found, course found, but email fails
    mockSelectLimit
      .mockResolvedValueOnce([{ id: "db-user-456", email: "jade@test.com", name: "Jade" }])
      .mockResolvedValueOnce([{ title: "React Mastery" }]);
    mockSendEmail.mockRejectedValueOnce(new Error("Email service down"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.refunded",
      data: {
        id: "order-course-789",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const request = createWebhookRequest(JSON.stringify({ type: "order.refunded" }));
    const response = await POST(request);
    const body = await response.json();

    // Webhook still returns 200 despite email failure
    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // Enrollment was still deleted
    expect(mockDeleteWhere).toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 10));
    consoleSpy.mockRestore();
  });

  it("order.refunded with metadata missing courseId logs error and returns 200", async () => {
    const badMetadata = JSON.stringify({
      metadata: {
        userId: "db-user-456",
        type: "course_purchase",
        // courseId is missing
      },
    });

    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: "payment-001",
        userId: "db-user-456",
        amount: 49000,
        currency: "KRW",
        metadata: badMetadata,
      },
    ]);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockVerifyWebhookEvent.mockReturnValue({
      type: "order.refunded",
      data: {
        id: "order-bad-meta",
      },
    });

    const { POST } = await import("@/app/api/payments/webhook/route");
    const { db } = await import("@/db/client");
    const request = createWebhookRequest(JSON.stringify({ type: "order.refunded" }));
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);

    // No enrollment deletion without courseId
    expect(db.delete).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();

    // Error logged about missing courseId
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Missing courseId"));

    consoleSpy.mockRestore();
  });
});
