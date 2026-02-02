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
const mockCheckoutCreate = vi.fn();
vi.mock("@/shared/api/polar/client", () => ({
  polar: {
    checkouts: {
      create: mockCheckoutCreate,
    },
  },
}));

// Drizzle mock chain
const mockWhereResult = vi.fn();
const mockWhere = vi.fn().mockImplementation(() => mockWhereResult());
const mockFrom = vi.fn().mockImplementation(() => ({
  where: mockWhere,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: mockFrom,
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
  email: "test@example.com",
};

// ---- Tests ----

describe("POST /api/payments/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {
      planId: "pro",
      interval: "monthly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when body is empty", async () => {
    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {});
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it('returns 400 when planId is "free"', async () => {
    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {
      planId: "free",
      interval: "monthly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when interval is invalid", async () => {
    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {
      planId: "pro",
      interval: "weekly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when plan has no polarProductId", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    // Mock getPlanById to return a plan without polarProductId
    // Since getPlanById reads from PRICING_PLANS which gets env vars,
    // in test the env vars are undefined, so polarProductId will be undefined.
    // We test with a valid planId ("pro") but the plan config won't have polarProductId in test env.

    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {
      planId: "pro",
      interval: "monthly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 500 when Polar API fails", async () => {
    // Set env var so polarProductId is available
    const originalEnv = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID;
    process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID = "polar-product-pro";

    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockWhereResult.mockReturnValue([TEST_DB_USER]);
    mockCheckoutCreate.mockRejectedValue(new Error("Polar API error"));

    // Need to re-import to pick up env change - use dynamic import with cache bust
    vi.resetModules();

    // Re-setup mocks after resetModules
    vi.doMock("@/shared/api/supabase", () => ({
      createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
      createAdminClient: vi.fn(),
    }));
    vi.doMock("@/shared/api/polar/client", () => ({
      polar: { checkouts: { create: mockCheckoutCreate } },
    }));
    vi.doMock("@/db/client", () => ({
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => mockWhereResult()),
          })),
        })),
      },
    }));
    vi.doMock("drizzle-orm", () => ({
      eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
    }));

    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {
      planId: "pro",
      interval: "monthly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");

    process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID = originalEnv;
  });

  it("returns 200 with checkoutUrl on success", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID;
    process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID = "polar-product-pro";

    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });
    mockWhereResult.mockReturnValue([TEST_DB_USER]);
    mockCheckoutCreate.mockResolvedValue({
      url: "https://checkout.polar.sh/session-123",
    });

    vi.resetModules();

    vi.doMock("@/shared/api/supabase", () => ({
      createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
      createAdminClient: vi.fn(),
    }));
    vi.doMock("@/shared/api/polar/client", () => ({
      polar: { checkouts: { create: mockCheckoutCreate } },
    }));
    vi.doMock("@/db/client", () => ({
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => mockWhereResult()),
          })),
        })),
      },
    }));
    vi.doMock("drizzle-orm", () => ({
      eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
    }));

    const { POST } = await import("@/app/api/payments/checkout/route");
    const request = createMockRequest("POST", {
      planId: "pro",
      interval: "monthly",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.checkoutUrl).toBe("https://checkout.polar.sh/session-123");

    process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID = originalEnv;
  });
});
