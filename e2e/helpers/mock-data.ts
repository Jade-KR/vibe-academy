/** Shared mock data for E2E tests */

export const TEST_USER = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null as string | null,
  locale: "ko",
  createdAt: "2025-01-01T00:00:00.000Z",
};

export const TEST_CREDENTIALS = {
  email: "test@example.com",
  password: "TestPassword123!",
};

export const REGISTER_PASSWORD = "NewPassword123!";

export const TEST_SUBSCRIPTION = {
  id: "sub-test-id",
  polarSubscriptionId: "polar_sub_123",
  planId: "pro",
  status: "active" as const,
  currentPeriodStart: "2025-01-01T00:00:00.000Z",
  currentPeriodEnd: "2025-02-01T00:00:00.000Z",
};

/** API success response wrapper */
export function successResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

/** API error response wrapper */
export function errorResponse(code: string, message: string) {
  return {
    success: false as const,
    error: { code, message },
  };
}
