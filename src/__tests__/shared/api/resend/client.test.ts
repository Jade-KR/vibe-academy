import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mocks ----

const mockSend = vi.fn();

vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
      constructor(public apiKey: string) {}
    },
  };
});

// ---- Tests ----

describe("Resend client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubEnv("RESEND_FROM_EMAIL", "noreply@test.com");
  });

  it("exports a resend instance", async () => {
    const { resend } = await import("@/shared/api/resend/client");
    expect(resend).toBeDefined();
    expect(resend.emails).toBeDefined();
    expect(resend.emails.send).toBeDefined();
  });

  it("sendEmail calls resend.emails.send with correct params", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_123" }, error: null });

    const { sendEmail } = await import("@/shared/api/resend/client");

    const mockReact = { type: "div", props: {} } as unknown as React.ReactElement;
    await sendEmail({
      to: "user@test.com",
      subject: "Test Subject",
      react: mockReact,
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@test.com",
        to: "user@test.com",
        subject: "Test Subject",
        react: mockReact,
      }),
    );
  });

  it("sendEmail returns data on success", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_123" }, error: null });

    const { sendEmail } = await import("@/shared/api/resend/client");

    const result = await sendEmail({
      to: "user@test.com",
      subject: "Test",
      react: { type: "div", props: {} } as unknown as React.ReactElement,
    });

    expect(result).toEqual({ data: { id: "msg_123" } });
  });

  it("sendEmail returns error on Resend API error", async () => {
    const apiError = { statusCode: 422, message: "Invalid email" };
    mockSend.mockResolvedValueOnce({ data: null, error: apiError });

    const { sendEmail } = await import("@/shared/api/resend/client");

    const result = await sendEmail({
      to: "bad@test.com",
      subject: "Test",
      react: { type: "div", props: {} } as unknown as React.ReactElement,
    });

    expect(result).toEqual({ error: apiError });
  });

  it("sendEmail logs error on Resend API error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const apiError = { statusCode: 422, message: "Invalid email" };
    mockSend.mockResolvedValueOnce({ data: null, error: apiError });

    const { sendEmail } = await import("@/shared/api/resend/client");

    await sendEmail({
      to: "bad@test.com",
      subject: "Test",
      react: { type: "div", props: {} } as unknown as React.ReactElement,
    });

    expect(consoleSpy).toHaveBeenCalledWith("[sendEmail] Resend error:", apiError);
    consoleSpy.mockRestore();
  });

  it("sendEmail catches unexpected errors and returns error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const unexpectedError = new Error("Network failure");
    mockSend.mockRejectedValueOnce(unexpectedError);

    const { sendEmail } = await import("@/shared/api/resend/client");

    const result = await sendEmail({
      to: "user@test.com",
      subject: "Test",
      react: { type: "div", props: {} } as unknown as React.ReactElement,
    });

    expect(result).toEqual({ error: unexpectedError });
    expect(consoleSpy).toHaveBeenCalledWith("[sendEmail] Unexpected error:", unexpectedError);
    consoleSpy.mockRestore();
  });
});
