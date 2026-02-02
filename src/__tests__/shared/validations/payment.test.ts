import { describe, expect, it } from "vitest";

import { checkoutSchema, subscriptionActionSchema } from "@/shared/lib/validations/payment";

describe("checkoutSchema", () => {
  it("accepts valid pro monthly checkout", () => {
    const result = checkoutSchema.safeParse({
      planId: "pro",
      interval: "monthly",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid enterprise yearly checkout", () => {
    const result = checkoutSchema.safeParse({
      planId: "enterprise",
      interval: "yearly",
    });
    expect(result.success).toBe(true);
  });

  it("rejects free planId", () => {
    const result = checkoutSchema.safeParse({
      planId: "free",
      interval: "monthly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid interval", () => {
    const result = checkoutSchema.safeParse({
      planId: "pro",
      interval: "weekly",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional successUrl and cancelUrl", () => {
    const result = checkoutSchema.safeParse({
      planId: "pro",
      interval: "monthly",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL format for successUrl", () => {
    const result = checkoutSchema.safeParse({
      planId: "pro",
      interval: "monthly",
      successUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("subscriptionActionSchema", () => {
  it("accepts cancel action", () => {
    const result = subscriptionActionSchema.safeParse({ action: "cancel" });
    expect(result.success).toBe(true);
  });

  it("accepts resume action", () => {
    const result = subscriptionActionSchema.safeParse({ action: "resume" });
    expect(result.success).toBe(true);
  });

  it("accepts change_plan with planId and interval", () => {
    const result = subscriptionActionSchema.safeParse({
      action: "change_plan",
      planId: "enterprise",
      interval: "yearly",
    });
    expect(result.success).toBe(true);
  });

  it("rejects change_plan without planId", () => {
    const result = subscriptionActionSchema.safeParse({
      action: "change_plan",
      interval: "yearly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects change_plan without interval", () => {
    const result = subscriptionActionSchema.safeParse({
      action: "change_plan",
      planId: "pro",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = subscriptionActionSchema.safeParse({ action: "delete" });
    expect(result.success).toBe(false);
  });
});
