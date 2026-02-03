import { describe, it, expect } from "vitest";
import {
  courseCheckoutSchema,
  progressUpdateSchema,
  createDiscussionSchema,
  updateDiscussionSchema,
  createCommentSchema,
  updateCommentSchema,
  createReviewSchema,
  updateReviewSchema,
  discussionListQuerySchema,
} from "@/shared/lib/validations/lecture";

describe("courseCheckoutSchema", () => {
  it("accepts empty object (couponCode is optional)", () => {
    const result = courseCheckoutSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid couponCode string", () => {
    const result = courseCheckoutSchema.safeParse({ couponCode: "SAVE20" });
    expect(result.success).toBe(true);
  });

  it("accepts object with couponCode: undefined", () => {
    const result = courseCheckoutSchema.safeParse({ couponCode: undefined });
    expect(result.success).toBe(true);
  });
});

describe("progressUpdateSchema", () => {
  it("accepts { completed: true }", () => {
    const result = progressUpdateSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it("accepts { position: 120 }", () => {
    const result = progressUpdateSchema.safeParse({ position: 120 });
    expect(result.success).toBe(true);
  });

  it("accepts both completed and position", () => {
    const result = progressUpdateSchema.safeParse({ completed: true, position: 120 });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (at least one required)", () => {
    const result = progressUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects negative position", () => {
    const result = progressUpdateSchema.safeParse({ position: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer position", () => {
    const result = progressUpdateSchema.safeParse({ position: 12.5 });
    expect(result.success).toBe(false);
  });
});

describe("createDiscussionSchema", () => {
  it("accepts valid title and content", () => {
    const result = createDiscussionSchema.safeParse({
      title: "Question",
      content: "Details about the question",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createDiscussionSchema.safeParse({
      title: "",
      content: "Details",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createDiscussionSchema.safeParse({
      title: "x".repeat(201),
      content: "Details",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = createDiscussionSchema.safeParse({
      title: "Question",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 5000 characters", () => {
    const result = createDiscussionSchema.safeParse({
      title: "Question",
      content: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const result = createDiscussionSchema.safeParse({
      content: "Details",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = createDiscussionSchema.safeParse({
      title: "Question",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateDiscussionSchema", () => {
  it("accepts only title", () => {
    const result = updateDiscussionSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts only content", () => {
    const result = updateDiscussionSchema.safeParse({ content: "Updated content" });
    expect(result.success).toBe(true);
  });

  it("accepts both fields", () => {
    const result = updateDiscussionSchema.safeParse({
      title: "Updated",
      content: "Updated content",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (at least one required)", () => {
    const result = updateDiscussionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = updateDiscussionSchema.safeParse({ title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects content over 5000 characters", () => {
    const result = updateDiscussionSchema.safeParse({ content: "x".repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe("createCommentSchema", () => {
  it("accepts valid content", () => {
    const result = createCommentSchema.safeParse({ content: "A comment" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = createCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects content over 2000 characters", () => {
    const result = createCommentSchema.safeParse({ content: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("updateCommentSchema", () => {
  it("accepts valid content", () => {
    const result = updateCommentSchema.safeParse({ content: "Updated" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = updateCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects content over 2000 characters", () => {
    const result = updateCommentSchema.safeParse({ content: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("createReviewSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid review", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 5,
      content: "x".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional title", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 5,
      title: "Great course",
      content: "x".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid courseId (non-uuid)", () => {
    const result = createReviewSchema.safeParse({
      courseId: "not-a-uuid",
      rating: 5,
      content: "x".repeat(20),
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating < 1", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 0,
      content: "x".repeat(20),
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating > 5", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 6,
      content: "x".repeat(20),
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 3.5,
      content: "x".repeat(20),
    });
    expect(result.success).toBe(false);
  });

  it("rejects content < 20 characters", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 5,
      content: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content > 1000 characters", () => {
    const result = createReviewSchema.safeParse({
      courseId: validUuid,
      rating: 5,
      content: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateReviewSchema", () => {
  it("accepts only rating", () => {
    const result = updateReviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts only content", () => {
    const result = updateReviewSchema.safeParse({ content: "x".repeat(20) });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (at least one required)", () => {
    const result = updateReviewSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects rating < 1", () => {
    const result = updateReviewSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating > 5", () => {
    const result = updateReviewSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects content < 20 characters", () => {
    const result = updateReviewSchema.safeParse({ content: "short" });
    expect(result.success).toBe(false);
  });
});

describe("discussionListQuerySchema", () => {
  it("accepts empty object with defaults (page=1, pageSize=20)", () => {
    const result = discussionListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("accepts string coercion for page and pageSize", () => {
    const result = discussionListQuerySchema.safeParse({ page: "2", pageSize: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it("rejects page < 1", () => {
    const result = discussionListQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 50", () => {
    const result = discussionListQuerySchema.safeParse({ pageSize: 51 });
    expect(result.success).toBe(false);
  });
});
