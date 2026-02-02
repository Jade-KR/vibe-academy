import { describe, expect, it } from "vitest";
import { ZodError, ZodIssueCode } from "zod";

import { errorResponse, successResponse, zodErrorResponse } from "@/shared/lib/api/response";

describe("successResponse", () => {
  it("returns 200 by default with data", async () => {
    const res = successResponse({ id: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: 1 } });
  });

  it("returns custom status code", async () => {
    const res = successResponse(null, undefined, 201);
    expect(res.status).toBe(201);
  });

  it("includes message when provided", async () => {
    const res = successResponse({ ok: true }, "Created");
    const body = await res.json();
    expect(body.message).toBe("Created");
  });

  it("does not include message when not provided", async () => {
    const res = successResponse({ ok: true });
    const body = await res.json();
    expect(body.message).toBeUndefined();
  });
});

describe("errorResponse", () => {
  it("returns correct error structure", async () => {
    const res = errorResponse("NOT_FOUND", "Resource not found", 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Resource not found" },
    });
  });

  it("includes details when provided", async () => {
    const details = { email: ["Required"] };
    const res = errorResponse("VALIDATION_ERROR", "Invalid", 400, details);
    const body = await res.json();
    expect(body.error.details).toEqual(details);
  });

  it("does not include details when not provided", async () => {
    const res = errorResponse("SERVER_ERROR", "Something broke", 500);
    const body = await res.json();
    expect(body.error.details).toBeUndefined();
  });
});

describe("zodErrorResponse", () => {
  it("formats Zod issues into details with 400 status", async () => {
    const zodError = new ZodError([
      {
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        path: ["email"],
        message: "Required",
      },
      {
        code: ZodIssueCode.too_small,
        minimum: 8,
        type: "string",
        inclusive: true,
        path: ["password"],
        message: "Too short",
      },
    ]);

    const res = zodErrorResponse(zodError);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({
      email: ["Required"],
      password: ["Too short"],
    });
  });

  it("groups multiple issues for the same path", async () => {
    const zodError = new ZodError([
      {
        code: ZodIssueCode.too_small,
        minimum: 8,
        type: "string",
        inclusive: true,
        path: ["password"],
        message: "Too short",
      },
      {
        code: ZodIssueCode.invalid_string,
        validation: "regex",
        path: ["password"],
        message: "Must contain uppercase",
      },
    ]);

    const res = zodErrorResponse(zodError);
    const body = await res.json();
    expect(body.error.details?.password).toEqual(["Too short", "Must contain uppercase"]);
  });
});
