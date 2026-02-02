import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

describe("useSocialLogin", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href setter
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("sets window.location.href to social login API endpoint", async () => {
    const { useSocialLogin } = await import(
      "@/features/auth/social-login/model/use-social-login"
    );
    const { result } = renderHook(() => useSocialLogin());

    act(() => {
      result.current.handleSocialLogin("google");
    });

    expect(window.location.href).toBe("/api/auth/social/google");
  });

  it.each(["google", "github", "kakao", "naver", "apple"] as const)(
    "works for provider: %s",
    async (provider) => {
      const { useSocialLogin } = await import(
        "@/features/auth/social-login/model/use-social-login"
      );
      const { result } = renderHook(() => useSocialLogin());

      act(() => {
        result.current.handleSocialLogin(provider);
      });

      expect(window.location.href).toBe(`/api/auth/social/${provider}`);
    },
  );
});
