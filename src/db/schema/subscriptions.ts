import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { subscriptionStatusEnum } from "./enums";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    polarSubscriptionId: varchar("polar_subscription_id", { length: 255 }).unique(),
    polarCustomerId: varchar("polar_customer_id", { length: 255 }),
    planId: varchar("plan_id", { length: 50 }).notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("subscriptions_user_id_idx").on(table.userId)],
);

// Type exports
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
