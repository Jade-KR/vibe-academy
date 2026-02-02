import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---- Mocks ----

const mockSendEmail = vi.fn().mockResolvedValue({ data: { id: "msg_123" } });
vi.mock("@/shared/api/resend", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/shared/api/resend/templates/welcome", () => ({
  WelcomeEmail: vi.fn((props: Record<string, unknown>) => ({
    type: "WelcomeEmail",
    props,
  })),
}));

const mockSignUp = vi.fn();
vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { signUp: mockSignUp },
  }),
  createAdminClient: vi.fn().mockReturnValue({
    auth: { admin: { deleteUser: vi.fn() } },
  }),
}));

const mockInsertReturning = vi.fn();
vi.mock("@/db/client", () => ({
  db: {
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => ({
        returning: mockInsertReturning,
      })),
    })),
  },
}));

vi.mock("@/shared/lib/validations", () => ({
  registerSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (data.email && data.password) {
        return {
          success: true,
          data: {
            email: data.email,
            password: data.password,
            name: data.name ?? null,
          },
        };
      }
      return { success: false, error: { issues: [] } };
    }),
  },
}));

vi.mock("@/shared/lib/api", () => ({
  successResponse: vi
    .fn()
    .mockImplementation(
      (data, message, status) =>
        new Response(JSON.stringify({ success: true, data, message }), { status }),
    ),
  errorResponse: vi
    .fn()
    .mockImplementation(
      (code, message, status) =>
        new Response(JSON.stringify({ success: false, error: { code, message } }), { status }),
    ),
  zodErrorResponse: vi.fn().mockImplementation(
    () =>
      new Response(JSON.stringify({ success: false, error: { code: "VALIDATION_ERROR" } }), {
        status: 400,
      }),
  ),
}));

vi.mock("@/shared/config/site", () => ({
  siteConfig: {
    name: "vibePack",
    url: "http://localhost:3000",
  },
}));

// ---- Helpers ----

function createRegisterRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---- Tests ----

describe("POST /api/auth/register - welcome email", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSignUp.mockResolvedValue({
      data: { user: { id: "supabase-user-123" } },
      error: null,
    });

    mockInsertReturning.mockResolvedValue([
      {
        id: "db-user-456",
        email: "jade@test.com",
        name: "Jade",
        supabaseUserId: "supabase-user-123",
      },
    ]);
  });

  it("sends welcome email after successful registration", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const request = createRegisterRequest({
      email: "jade@test.com",
      password: "password123",
      name: "Jade",
    });
    const response = await POST(request);

    expect(response.status).toBe(201);

    // Give the fire-and-forget call a tick to resolve
    await new Promise((r) => setTimeout(r, 10));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jade@test.com",
        subject: expect.stringContaining("Welcome"),
      }),
    );
  });

  it("registration succeeds even if welcome email fails", async () => {
    mockSendEmail.mockRejectedValueOnce(new Error("Email send failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("@/app/api/auth/register/route");
    const request = createRegisterRequest({
      email: "jade@test.com",
      password: "password123",
      name: "Jade",
    });
    const response = await POST(request);

    expect(response.status).toBe(201);

    // Give the fire-and-forget promise a tick to settle
    await new Promise((r) => setTimeout(r, 10));

    consoleSpy.mockRestore();
  });

  it("welcome email receives correct props", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const request = createRegisterRequest({
      email: "jade@test.com",
      password: "password123",
      name: "Jade",
    });
    await POST(request);

    // Give the fire-and-forget call a tick to resolve
    await new Promise((r) => setTimeout(r, 10));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jade@test.com",
        react: expect.objectContaining({
          props: expect.objectContaining({
            name: "Jade",
            loginUrl: expect.stringContaining("/login"),
          }),
        }),
      }),
    );
  });
});
