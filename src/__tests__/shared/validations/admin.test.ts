import { describe, it, expect } from "vitest";
import {
  createCourseSchema,
  updateCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderSchema,
  createCouponSchema,
  couponListQuerySchema,
  adminUserListQuerySchema,
  adminAnalyticsQuerySchema,
  uploadUrlSchema,
} from "@/shared/lib/validations/admin";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createCourseSchema", () => {
  it("accepts minimal valid input (defaults applied)", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "my-course" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(0);
      expect(result.data.level).toBe("beginner");
      expect(result.data.isPublished).toBe(false);
      expect(result.data.isFree).toBe(false);
    }
  });

  it("accepts full valid with all optional fields", () => {
    const result = createCourseSchema.safeParse({
      title: "React Course",
      slug: "react-101",
      description: "A course about React",
      longDescription: "A longer description",
      price: 50000,
      level: "intermediate",
      category: "programming",
      thumbnailUrl: "https://example.com/thumb.png",
      previewVideoUrl: "https://example.com/video.mp4",
      instructorBio: "Expert developer",
      isPublished: true,
      isFree: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createCourseSchema.safeParse({ title: "", slug: "my-course" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createCourseSchema.safeParse({ title: "x".repeat(201), slug: "my-course" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces or uppercase", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "My Course" });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special chars", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "my@course" });
    expect(result.success).toBe(false);
  });

  it("accepts slug with hyphens and numbers", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "react-101" });
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "t", price: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer price", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "t", price: 9.99 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid level", () => {
    const result = createCourseSchema.safeParse({ title: "T", slug: "t", level: "expert" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid thumbnailUrl (non-URL string)", () => {
    const result = createCourseSchema.safeParse({
      title: "T",
      slug: "t",
      thumbnailUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCourseSchema", () => {
  it("accepts single field update", () => {
    const result = updateCourseSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts nullable fields", () => {
    const result = updateCourseSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (at least one field required)", () => {
    const result = updateCourseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug format", () => {
    const result = updateCourseSchema.safeParse({ slug: "Invalid Slug!" });
    expect(result.success).toBe(false);
  });
});

describe("createChapterSchema", () => {
  it("accepts valid title", () => {
    const result = createChapterSchema.safeParse({ title: "Chapter 1" });
    expect(result.success).toBe(true);
  });

  it("accepts with optional order", () => {
    const result = createChapterSchema.safeParse({ title: "Chapter 1", order: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createChapterSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createChapterSchema.safeParse({ title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe("updateChapterSchema", () => {
  it("accepts valid title", () => {
    const result = updateChapterSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = updateChapterSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("createLessonSchema", () => {
  it("accepts minimal valid input", () => {
    const result = createLessonSchema.safeParse({ title: "Lesson 1" });
    expect(result.success).toBe(true);
  });

  it("accepts full input with all optional fields", () => {
    const result = createLessonSchema.safeParse({
      title: "Lesson 1",
      description: "A lesson",
      videoUrl: "https://example.com/video.mp4",
      duration: 300,
      isPreview: true,
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createLessonSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration", () => {
    const result = createLessonSchema.safeParse({ title: "T", duration: -1 });
    expect(result.success).toBe(false);
  });
});

describe("updateLessonSchema", () => {
  it("accepts single field update", () => {
    const result = updateLessonSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts nullable fields", () => {
    const result = updateLessonSchema.safeParse({ videoUrl: null });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (at least one required)", () => {
    const result = updateLessonSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("reorderSchema", () => {
  it("accepts valid reorder with lessons", () => {
    const result = reorderSchema.safeParse({
      chapters: [
        {
          id: validUuid,
          order: 0,
          lessons: [{ id: validUuid, order: 0 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts chapters without lessons array", () => {
    const result = reorderSchema.safeParse({
      chapters: [{ id: validUuid, order: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-uuid chapter id", () => {
    const result = reorderSchema.safeParse({
      chapters: [{ id: "not-a-uuid", order: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative order", () => {
    const result = reorderSchema.safeParse({
      chapters: [{ id: validUuid, order: -1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("createCouponSchema", () => {
  it("accepts valid percentage coupon", () => {
    const result = createCouponSchema.safeParse({
      code: "SAVE20",
      discount: 20,
      discountType: "percentage",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid fixed coupon with optional fields", () => {
    const result = createCouponSchema.safeParse({
      code: "FLAT1000",
      discount: 1000,
      discountType: "fixed",
      courseId: validUuid,
      maxUses: 100,
      expiresAt: "2026-12-31T23:59:59Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects lowercase code", () => {
    const result = createCouponSchema.safeParse({
      code: "save20",
      discount: 20,
      discountType: "percentage",
    });
    expect(result.success).toBe(false);
  });

  it("rejects code with spaces", () => {
    const result = createCouponSchema.safeParse({
      code: "SAVE 20",
      discount: 20,
      discountType: "percentage",
    });
    expect(result.success).toBe(false);
  });

  it("accepts code with hyphens and underscores", () => {
    const result = createCouponSchema.safeParse({
      code: "SAVE_20-OFF",
      discount: 20,
      discountType: "percentage",
    });
    expect(result.success).toBe(true);
  });

  it("rejects discount < 1", () => {
    const result = createCouponSchema.safeParse({
      code: "SAVE",
      discount: 0,
      discountType: "fixed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects percentage discount > 100", () => {
    const result = createCouponSchema.safeParse({
      code: "OVER",
      discount: 101,
      discountType: "percentage",
    });
    expect(result.success).toBe(false);
  });

  it("allows fixed discount > 100 (no percentage cap for fixed)", () => {
    const result = createCouponSchema.safeParse({
      code: "BIGFIX",
      discount: 50000,
      discountType: "fixed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid discountType", () => {
    const result = createCouponSchema.safeParse({
      code: "CODE",
      discount: 10,
      discountType: "bogo",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional nullable courseId, maxUses, expiresAt", () => {
    const result = createCouponSchema.safeParse({
      code: "NULL",
      discount: 10,
      discountType: "fixed",
      courseId: null,
      maxUses: null,
      expiresAt: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("couponListQuerySchema", () => {
  it("accepts empty object with defaults (page=1, pageSize=20)", () => {
    const result = couponListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("rejects page < 1", () => {
    const result = couponListQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 100", () => {
    const result = couponListQuerySchema.safeParse({ pageSize: 101 });
    expect(result.success).toBe(false);
  });
});

describe("adminUserListQuerySchema", () => {
  it("accepts empty object with defaults", () => {
    const result = adminUserListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("accepts with role filter", () => {
    const result = adminUserListQuerySchema.safeParse({ role: "admin" });
    expect(result.success).toBe(true);
  });

  it("accepts with search", () => {
    const result = adminUserListQuerySchema.safeParse({ search: "john" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = adminUserListQuerySchema.safeParse({ role: "superadmin" });
    expect(result.success).toBe(false);
  });
});

describe("adminAnalyticsQuerySchema", () => {
  it.each(["7d", "30d", "90d", "all"])("accepts valid period: %s", (period) => {
    const result = adminAnalyticsQuerySchema.safeParse({ period });
    expect(result.success).toBe(true);
  });

  it("defaults to 30d", () => {
    const result = adminAnalyticsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.period).toBe("30d");
    }
  });

  it("rejects invalid period", () => {
    const result = adminAnalyticsQuerySchema.safeParse({ period: "1y" });
    expect(result.success).toBe(false);
  });
});

describe("uploadUrlSchema", () => {
  it("accepts valid objectKey", () => {
    const result = uploadUrlSchema.safeParse({ objectKey: "courses/thumbnails/img.png" });
    expect(result.success).toBe(true);
  });

  it("accepts with contentType", () => {
    const result = uploadUrlSchema.safeParse({
      objectKey: "courses/thumbnails/img.png",
      contentType: "image/png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty objectKey", () => {
    const result = uploadUrlSchema.safeParse({ objectKey: "" });
    expect(result.success).toBe(false);
  });

  it("rejects objectKey with invalid chars (spaces)", () => {
    const result = uploadUrlSchema.safeParse({ objectKey: "my file.png" });
    expect(result.success).toBe(false);
  });

  it("rejects objectKey with @ symbol", () => {
    const result = uploadUrlSchema.safeParse({ objectKey: "user@file.png" });
    expect(result.success).toBe(false);
  });

  it("rejects objectKey over 500 characters", () => {
    const result = uploadUrlSchema.safeParse({ objectKey: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});
