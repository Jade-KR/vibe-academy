import { describe, expect, it } from "vitest";

import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  magicLinkSchema,
  otpSendSchema,
  otpVerifySchema,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
  socialProviderSchema,
} from "@/shared/lib/validations/auth";

describe("passwordSchema", () => {
  const validPassword = "Abcdef1!";

  it("accepts a valid password", () => {
    expect(passwordSchema.safeParse(validPassword).success).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Ab1!xyz");
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = passwordSchema.safeParse("abcdef1!");
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase letter", () => {
    const result = passwordSchema.safeParse("ABCDEF1!");
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = passwordSchema.safeParse("Abcdefg!");
    expect(result.success).toBe(false);
  });

  it("rejects password without special character", () => {
    const result = passwordSchema.safeParse("Abcdefg1");
    expect(result.success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts a valid email", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    email: "user@example.com",
    password: "Abcdef1!",
    confirmPassword: "Abcdef1!",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(validData).success).toBe(true);
  });

  it("accepts registration with optional name", () => {
    expect(registerSchema.safeParse({ ...validData, name: "John" }).success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _, ...noEmail } = validData;
    expect(registerSchema.safeParse(noEmail).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional rememberMe field", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "mypassword",
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "mypassword" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validData = {
    password: "Abcdef1!",
    confirmPassword: "Abcdef1!",
  };

  it("accepts valid reset data", () => {
    expect(resetPasswordSchema.safeParse(validData).success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("socialProviderSchema", () => {
  it.each(["google", "github", "kakao", "naver", "apple"])(
    "accepts valid provider: %s",
    (provider) => {
      expect(socialProviderSchema.safeParse(provider).success).toBe(true);
    },
  );

  it("rejects invalid provider", () => {
    expect(socialProviderSchema.safeParse("facebook").success).toBe(false);
  });
});

describe("magicLinkSchema", () => {
  it("accepts valid email", () => {
    expect(magicLinkSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(magicLinkSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("otpSendSchema", () => {
  it("accepts valid email", () => {
    expect(otpSendSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(otpSendSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("otpVerifySchema", () => {
  it("accepts valid OTP data", () => {
    const result = otpVerifySchema.safeParse({
      email: "user@example.com",
      otp: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects OTP with wrong length", () => {
    const result = otpVerifySchema.safeParse({
      email: "user@example.com",
      otp: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects OTP with non-digits", () => {
    const result = otpVerifySchema.safeParse({
      email: "user@example.com",
      otp: "12345a",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email with valid OTP", () => {
    const result = otpVerifySchema.safeParse({
      email: "bad",
      otp: "123456",
    });
    expect(result.success).toBe(false);
  });
});
