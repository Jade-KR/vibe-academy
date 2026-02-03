export interface RefundEligibilityInput {
  purchasedAt: Date;
  lessonsWatched: number;
  now?: Date;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  reason?: string;
}

const REFUND_WINDOW_DAYS = 7;
const MAX_LESSONS_FOR_REFUND = 5;

/**
 * Determine if an enrollment is eligible for refund.
 * Rules: purchased within 7 days AND watched fewer than 5 lessons.
 */
export function isRefundEligible(input: RefundEligibilityInput): RefundEligibilityResult {
  const now = input.now ?? new Date();
  const msSincePurchase = now.getTime() - input.purchasedAt.getTime();
  const daysSincePurchase = msSincePurchase / (1000 * 60 * 60 * 24);

  const withinWindow = daysSincePurchase <= REFUND_WINDOW_DAYS;
  const belowLessonLimit = input.lessonsWatched < MAX_LESSONS_FOR_REFUND;

  if (!withinWindow && !belowLessonLimit) {
    return { eligible: false, reason: "Refund window expired and lesson limit exceeded" };
  }
  if (!withinWindow) {
    return { eligible: false, reason: "Refund window expired" };
  }
  if (!belowLessonLimit) {
    return { eligible: false, reason: "Lesson watch limit exceeded" };
  }
  return { eligible: true };
}
