import { describe, expect, it } from "vitest";

import { cn } from "@/shared/lib/cn";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional classes via object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
