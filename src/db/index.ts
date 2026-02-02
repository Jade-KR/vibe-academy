// Drizzle client
export { db } from "./client";

// Schema (tables, enums, relations)
export {
  // Tables
  users,
  subscriptions,
  payments,
  // Enums
  subscriptionStatusEnum,
  paymentStatusEnum,
  // Relations
  usersRelations,
  subscriptionsRelations,
  paymentsRelations,
} from "./schema";

// Types
export type { User, NewUser, Subscription, NewSubscription, Payment, NewPayment } from "./schema";
