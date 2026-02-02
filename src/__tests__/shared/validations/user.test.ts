import { describe, it, expect } from "vitest";
import { updateProfileSchema, changePasswordSchema } from "@/shared/lib/validations/user";

describe("updateProfileSchema", () => {
  it("accepts valid name only", () => {
    const result = updateProfileSchema.safeParse({ name: "John Doe" });
    expect(result.success).toBe(true);
  });

  it("accepts valid locale only (ko)", () => {
    const result = updateProfileSchema.safeParse({ locale: "ko" });
    expect(result.success).toBe(true);
  });

  it("accepts valid locale only (en)", () => {
    const result = updateProfileSchema.safeParse({ locale: "en" });
    expect(result.success).toBe(true);
  });

  it("accepts both name and locale", () => {
    const result = updateProfileSchema.safeParse({
      name: "John Doe",
      locale: "en",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (at least one field required)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = updateProfileSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale value", () => {
    const result = updateProfileSchema.safeParse({ locale: "fr" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const validPassword = "NewPass1!";

  it("accepts valid current + new + confirm", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: validPassword,
      confirmNewPassword: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing currentPassword", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: validPassword,
      confirmNewPassword: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak newPassword (too short)", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: "Ab1!",
      confirmNewPassword: "Ab1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak newPassword (no uppercase)", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: "newpass1!",
      confirmNewPassword: "newpass1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched newPassword and confirmNewPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: validPassword,
      confirmNewPassword: "Different1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects same currentPassword and newPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: validPassword,
      newPassword: validPassword,
      confirmNewPassword: validPassword,
    });
    expect(result.success).toBe(false);
  });
});
