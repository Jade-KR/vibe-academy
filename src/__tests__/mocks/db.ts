import { vi } from "vitest";

/**
 * Creates a chainable mock for Drizzle DB operations.
 *
 * Supports patterns like:
 *   db.select({...}).from(users).where(eq(...))
 *   db.update(users).set({...}).where(eq(...)).returning({...})
 *   db.insert(users).values({...}).returning()
 */
export function createMockDb() {
  let selectResult: unknown[] = [];
  let updateResult: unknown[] = [];
  let insertResult: unknown[] = [];

  const returning = vi.fn().mockImplementation(() => updateResult);

  const where = vi.fn().mockImplementation(() => ({
    returning,
  }));

  // For select: .from().where() returns the result directly
  const selectFrom = vi.fn().mockImplementation(() => ({
    where: vi.fn().mockImplementation(() => selectResult),
  }));

  const set = vi.fn().mockImplementation(() => ({
    where,
  }));

  const values = vi.fn().mockImplementation(() => ({
    returning: vi.fn().mockImplementation(() => insertResult),
  }));

  const db = {
    select: vi.fn().mockImplementation(() => ({
      from: selectFrom,
    })),
    update: vi.fn().mockImplementation(() => ({
      set,
    })),
    insert: vi.fn().mockImplementation(() => ({
      values,
    })),
    _setSelectResult(result: unknown[]) {
      selectResult = result;
    },
    _setUpdateResult(result: unknown[]) {
      updateResult = result;
    },
    _setInsertResult(result: unknown[]) {
      insertResult = result;
    },
  };

  return db;
}
