import { relations } from "drizzle-orm";

// Re-export enums
export { subscriptionStatusEnum, paymentStatusEnum } from "./enums";

// Re-export tables
export { users } from "./users";
export { subscriptions } from "./subscriptions";
export { payments } from "./payments";

// Re-export types
export type { User, NewUser } from "./users";
export type { Subscription, NewSubscription } from "./subscriptions";
export type { Payment, NewPayment } from "./payments";

// --- Relations (defined here to avoid circular imports) ---

import { users } from "./users";
import { subscriptions } from "./subscriptions";
import { payments } from "./payments";

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
