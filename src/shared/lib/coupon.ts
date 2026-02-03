export interface CouponInput {
  discount: number;
  discountType: "fixed" | "percentage";
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  courseId: string | null;
}

export interface CouponResult {
  finalPrice: number;
  discountAmount: number;
}

export interface CouponValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Apply a coupon discount to a price.
 * - Fixed: subtract discount from price, floor at 0
 * - Percentage: subtract (price * discount / 100), floor at 0
 * Does NOT check usability (expiry, usage limits) -- use validateCouponUsability for that.
 */
export function applyCoupon(
  price: number,
  coupon: Pick<CouponInput, "discount" | "discountType">,
): CouponResult {
  let discountAmount: number;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((price * coupon.discount) / 100);
  } else {
    discountAmount = coupon.discount;
  }
  const finalPrice = Math.max(0, price - discountAmount);
  return { finalPrice, discountAmount: price - finalPrice };
}

/**
 * Check whether a coupon can be used.
 * Checks: expiry, usage count, course scope.
 */
export function validateCouponUsability(
  coupon: CouponInput,
  courseId?: string,
  now: Date = new Date(),
): CouponValidation {
  // Check expiry
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
    return { valid: false, reason: "Coupon has expired" };
  }
  // Check usage limit
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }
  // Check course scope
  if (coupon.courseId !== null && courseId !== coupon.courseId) {
    return { valid: false, reason: "Coupon is not valid for this course" };
  }
  return { valid: true };
}
