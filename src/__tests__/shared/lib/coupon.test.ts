import { describe, it, expect } from "vitest";
import { applyCoupon, validateCouponUsability } from "@/shared/lib/coupon";
import type { CouponInput } from "@/shared/lib/coupon";

describe("applyCoupon", () => {
  it("applies fixed discount", () => {
    const result = applyCoupon(50000, { discount: 10000, discountType: "fixed" });
    expect(result.finalPrice).toBe(40000);
    expect(result.discountAmount).toBe(10000);
  });

  it("applies percentage discount (20%)", () => {
    const result = applyCoupon(50000, { discount: 20, discountType: "percentage" });
    expect(result.finalPrice).toBe(40000);
    expect(result.discountAmount).toBe(10000);
  });

  it("applies 100% percentage discount for free", () => {
    const result = applyCoupon(50000, { discount: 100, discountType: "percentage" });
    expect(result.finalPrice).toBe(0);
    expect(result.discountAmount).toBe(50000);
  });

  it("floors at 0 when fixed discount exceeds price", () => {
    const result = applyCoupon(5000, { discount: 10000, discountType: "fixed" });
    expect(result.finalPrice).toBe(0);
    expect(result.discountAmount).toBe(5000);
  });

  it("handles 0 discount", () => {
    const result = applyCoupon(50000, { discount: 0, discountType: "fixed" });
    expect(result.finalPrice).toBe(50000);
    expect(result.discountAmount).toBe(0);
  });

  it("rounds percentage discount to nearest integer", () => {
    const result = applyCoupon(33333, { discount: 10, discountType: "percentage" });
    expect(result.finalPrice).toBe(30000);
    expect(result.discountAmount).toBe(3333);
  });
});

describe("validateCouponUsability", () => {
  const baseCoupon: CouponInput = {
    discount: 10,
    discountType: "percentage",
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    courseId: null,
  };

  it("returns valid for coupon with no restrictions", () => {
    const result = validateCouponUsability(baseCoupon);
    expect(result).toEqual({ valid: true });
  });

  it("returns invalid for expired coupon", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const coupon: CouponInput = { ...baseCoupon, expiresAt: yesterday };
    const result = validateCouponUsability(coupon);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Coupon has expired");
  });

  it("returns valid for coupon not yet expired", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const coupon: CouponInput = { ...baseCoupon, expiresAt: tomorrow };
    const result = validateCouponUsability(coupon);
    expect(result).toEqual({ valid: true });
  });

  it("returns invalid when usage limit reached", () => {
    const coupon: CouponInput = { ...baseCoupon, maxUses: 10, usedCount: 10 };
    const result = validateCouponUsability(coupon);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Coupon usage limit reached");
  });

  it("returns valid when usage limit not reached", () => {
    const coupon: CouponInput = { ...baseCoupon, maxUses: 10, usedCount: 9 };
    const result = validateCouponUsability(coupon);
    expect(result).toEqual({ valid: true });
  });

  it("returns invalid for wrong course", () => {
    const coupon: CouponInput = { ...baseCoupon, courseId: "course-a" };
    const result = validateCouponUsability(coupon, "course-b");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Coupon is not valid for this course");
  });

  it("returns valid for correct course", () => {
    const coupon: CouponInput = { ...baseCoupon, courseId: "course-a" };
    const result = validateCouponUsability(coupon, "course-a");
    expect(result).toEqual({ valid: true });
  });

  it("returns valid when coupon has no course restriction", () => {
    const coupon: CouponInput = { ...baseCoupon, courseId: null };
    const result = validateCouponUsability(coupon, "any-course");
    expect(result).toEqual({ valid: true });
  });

  it("returns invalid when exactly at expiry time", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const coupon: CouponInput = { ...baseCoupon, expiresAt: new Date("2026-01-15T12:00:00Z") };
    const result = validateCouponUsability(coupon, undefined, now);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Coupon has expired");
  });
});
