import { pgTable, uuid, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { paymentStatusEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    polarPaymentId: varchar("polar_payment_id", { length: 255 }).unique(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("KRW").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    description: text("description"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("payments_user_id_idx").on(table.userId)],
);

// Type exports
export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;
