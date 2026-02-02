import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest } from "../../helpers/api";

// ---- Mocks ----

const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
};

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
  createAdminClient: vi.fn(),
}));

// Mock Polar client
const mockSubscriptionsUpdate = vi.fn();
vi.mock("@/shared/api/polar/client", () => ({
  polar: {
    subscriptions: {
      update: mockSubscriptionsUpdate,
    },
  },
}));

// Drizzle mock chain
const mockSelectWhereResult = vi.fn();
const mockSelectWhere = vi.fn().mockImplementation(() => mockSelectWhereResult());
const mockSelectFrom = vi.fn().mockImplementation(() => ({
  where: mockSelectWhere,
}));

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn().mockImplementation(() => ({
  returning: mockReturning,
}));
const mockUpdateSet = vi.fn().mockImplementation(() => ({
  where: mockUpdateWhere,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: mockSelectFrom,
    })),
    update: vi.fn().mockImplementation(() => ({
      set: mockUpdateSet,
    })),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
}));

// ---- Test data ----

const TEST_SUPABASE_USER = {
  id: "supabase-user-123",
  email: "test@example.com",
};

const TEST_DB_USER = {
  id: "db-user-456",
};

const TEST_SUBSCRIPTION = {
  id: "sub-789",
  planId: "pro",
  status: "active",
  polarSubscriptionId: "polar-sub-abc",
  polarCustomerId: "polar-cust-def",
  currentPeriodStart: new Date("2026-01-01").toISOString(),
  currentPeriodEnd: new Date("2026-02-01").toISOString(),
  cancelAtPeriodEnd: false,
  createdAt: new Date("2026-01-01").toISOString(),
  updatedAt: new Date("2026-01-01").toISOString(),
};

// ---- GET Tests ----

describe("GET /api/payments/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { GET } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 with free plan default when no subscription exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    // First call: user lookup returns user, second call: subscription lookup returns empty
    let callCount = 0;
    mockSelectWhereResult.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [TEST_DB_USER];
      return []; // no subscription
    });

    const { GET } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.planId).toBe("free");
    expect(body.data.status).toBe("active");
  });

  it("returns 200 with subscription data when subscription exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    let callCount = 0;
    mockSelectWhereResult.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [TEST_DB_USER];
      return [TEST_SUBSCRIPTION];
    });

    const { GET } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("GET");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.planId).toBe("pro");
    expect(body.data.polarSubscriptionId).toBe("polar-sub-abc");
  });
});

// ---- POST Tests ----

describe("POST /api/payments/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", { action: "cancel" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when body is empty", async () => {
    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", {});
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when no active subscription for cancel action", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    let callCount = 0;
    mockSelectWhereResult.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [TEST_DB_USER];
      return []; // no subscription
    });

    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", { action: "cancel" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 200 on successful cancel action", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    let callCount = 0;
    mockSelectWhereResult.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [TEST_DB_USER];
      return [TEST_SUBSCRIPTION];
    });

    mockSubscriptionsUpdate.mockResolvedValue({});
    mockReturning.mockResolvedValue([{ ...TEST_SUBSCRIPTION, cancelAtPeriodEnd: true }]);

    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", { action: "cancel" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.cancelAtPeriodEnd).toBe(true);
  });

  it("returns 200 on successful resume action", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    let callCount = 0;
    mockSelectWhereResult.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [TEST_DB_USER];
      return [{ ...TEST_SUBSCRIPTION, cancelAtPeriodEnd: true }];
    });

    mockSubscriptionsUpdate.mockResolvedValue({});
    mockReturning.mockResolvedValue([{ ...TEST_SUBSCRIPTION, cancelAtPeriodEnd: false }]);

    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", { action: "resume" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.cancelAtPeriodEnd).toBe(false);
  });

  it("returns 400 when change_plan action is missing planId", async () => {
    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", { action: "change_plan" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 on successful change_plan action", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID;
    process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID = "polar-product-enterprise";

    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    let callCount = 0;
    mockSelectWhereResult.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return [TEST_DB_USER];
      return [TEST_SUBSCRIPTION];
    });

    mockSubscriptionsUpdate.mockResolvedValue({});
    mockReturning.mockResolvedValue([{ ...TEST_SUBSCRIPTION, planId: "enterprise" }]);

    vi.resetModules();

    vi.doMock("@/shared/api/supabase", () => ({
      createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
      createAdminClient: vi.fn(),
    }));
    vi.doMock("@/shared/api/polar/client", () => ({
      polar: {
        subscriptions: {
          update: mockSubscriptionsUpdate,
        },
      },
    }));
    vi.doMock("@/db/client", () => ({
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => mockSelectWhereResult()),
          })),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              returning: mockReturning,
            })),
          })),
        })),
      },
    }));
    vi.doMock("drizzle-orm", () => ({
      eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
    }));

    const { POST } = await import("@/app/api/payments/subscription/route");
    const request = createMockRequest("POST", {
      action: "change_plan",
      planId: "enterprise",
      interval: "monthly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.planId).toBe("enterprise");

    process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID = originalEnv;
  });
});
