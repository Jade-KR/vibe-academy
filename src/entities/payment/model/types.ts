import type { Payment } from "@/db/schema";

/**
 * Payment status enum - must match DB enum values exactly.
 * Source of truth: src/db/schema/enums.ts paymentStatusEnum
 */
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

/**
 * Payment record as returned by API.
 * Re-exports DB Payment type directly.
 */
export type PaymentRecord = Payment;

/**
 * Query params for listing payments.
 */
export interface PaymentListParams {
  page?: number;
  pageSize?: number;
  status?: PaymentStatus;
}
