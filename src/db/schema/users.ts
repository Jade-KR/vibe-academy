import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseUserId: uuid("supabase_user_id").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  locale: varchar("locale", { length: 10 }).default("ko"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
