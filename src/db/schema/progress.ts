import { pgTable, uuid, boolean, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { lessons } from "./lessons";

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lessonId: uuid("lesson_id")
      .references(() => lessons.id, { onDelete: "cascade" })
      .notNull(),
    completed: boolean("completed").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("progress_user_lesson_unique").on(table.userId, table.lessonId),
    index("progress_user_id_idx").on(table.userId),
    index("progress_lesson_id_idx").on(table.lessonId),
  ],
);

export type Progress = InferSelectModel<typeof progress>;
export type NewProgress = InferInsertModel<typeof progress>;
