import { describe, it, expect } from "vitest";
import { courseListQuerySchema, reviewListQuerySchema } from "@/shared/lib/validations/course";

describe("courseListQuerySchema", () => {
  it("accepts empty object", () => {
    const result = courseListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts with category", () => {
    const result = courseListQuerySchema.safeParse({ category: "programming" });
    expect(result.success).toBe(true);
  });
});

describe("reviewListQuerySchema", () => {
  it("accepts empty object with defaults (page=1, pageSize=10)", () => {
    const result = reviewListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it("accepts string coercion for page and pageSize", () => {
    const result = reviewListQuerySchema.safeParse({ page: "2", pageSize: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(5);
    }
  });

  it("rejects page < 1", () => {
    const result = reviewListQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 50", () => {
    const result = reviewListQuerySchema.safeParse({ pageSize: 51 });
    expect(result.success).toBe(false);
  });
});
