import { describe, expect, it } from "vitest";

import { isActiveRoute } from "@/shared/lib/is-active-route";

describe("isActiveRoute", () => {
  it("matches exact path when exact is true", () => {
    expect(isActiveRoute("/settings", "/settings", true)).toBe(true);
  });

  it("does not match sub-path when exact is true", () => {
    expect(isActiveRoute("/settings/profile", "/settings", true)).toBe(false);
  });

  it("matches prefix by default (no exact flag)", () => {
    expect(isActiveRoute("/blog/my-post", "/blog")).toBe(true);
  });

  it('treats "/" as exact-only (does not match everything)', () => {
    expect(isActiveRoute("/dashboard", "/")).toBe(false);
    expect(isActiveRoute("/", "/")).toBe(true);
  });

  it('treats "/dashboard" as exact-only', () => {
    expect(isActiveRoute("/dashboard/settings", "/dashboard")).toBe(false);
    expect(isActiveRoute("/dashboard", "/dashboard")).toBe(true);
  });

  it("returns false for non-matching path", () => {
    expect(isActiveRoute("/about", "/blog")).toBe(false);
  });
});
