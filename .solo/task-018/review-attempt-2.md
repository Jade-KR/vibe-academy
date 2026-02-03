# Review: task-018 - Admin Route Group + Course CRUD UI

**Reviewer**: Solo Workflow Reviewer
**Date**: 2026-02-03
**Branch**: `feature/task-018` (2 commits: `e4dc7a1`, `976915b`)
**Files changed**: 32 files, +2,636 lines / -12 lines
**Attempt**: 2

---

## Previous Review Issues Resolution

| # | Previous Issue | Status | Evidence |
|---|---------------|--------|----------|
| 1 | ~30+ hardcoded English strings need i18n | RESOLVED | All strings now use `t()` calls. Translation keys added to both `ko/common.json` and `en/common.json`. Verified in `course-form.tsx`, `course-list.tsx`, `sortable-chapter.tsx`, `sortable-lesson.tsx`, `curriculum-editor.tsx`, `[id]/page.tsx`, `use-curriculum.ts`. |
| 2 | Zero test coverage | RESOLVED | 3 test files added: `course-form.test.tsx` (4 tests), `course-list.test.tsx` (4 tests), `curriculum-editor.test.tsx` (4 tests). All 12 tests pass. |
| 3 | `updateLesson` param type `Record<string, unknown>` | RESOLVED | `UpdateLessonData` interface created in `use-curriculum.ts` (lines 7-13) with proper typed fields: `title?`, `description?`, `videoUrl?`, `duration?`, `isPreview?`. Used as parameter type on line 106. |

---

## Scores

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness (logic, types, edge cases) | 30% | 8.5 | 2.55 |
| Security (auth, admin guard, input validation) | 20% | 8.5 | 1.70 |
| Architecture (FSD compliance, separation of concerns) | 20% | 9.0 | 1.80 |
| Code quality (naming, DRY, readability, i18n) | 15% | 8.0 | 1.20 |
| Test coverage | 15% | 7.0 | 1.05 |

**Total Score: 8.3 / 10**

**Verdict: PASS** (threshold 8.0)

---

## Aspect 1: Correctness (8.5/10)

### Good
- Admin layout role guard (`layout.tsx` lines 19-28) correctly queries `users.role` from DB and redirects non-admins server-side, preventing any content flash.
- GET `/api/admin/courses` correctly uses subquery for chapter/lesson counts, avoiding N+1.
- GET `/api/admin/courses/[id]` efficiently groups lessons via `Map` for O(1) lookups, with proper `inArray` guard for empty `chapterIds`.
- DnD chapter/lesson reorder uses ID prefixes (`chapter-`, `lesson-`) to distinguish drag types.
- Optimistic DnD updates with rollback on API error via `onMutate()` in the reorder catch block.
- `CourseForm` properly handles both create and edit modes with dual schema validation.
- Auto-slug generation from title with `slugTouched` ref to prevent overwriting manual edits.
- Edit page error state now uses `t("courses.notFound")` (previously hardcoded).
- Tab labels now use `t("courses.details")` and `t("chapters.title")` (previously hardcoded).
- Edit mode `onSuccess` now guards with `if (courseId)` (line 165-167) instead of non-null assertion `courseId!`.

### Minor Issues

1. **`zodResolver(createCourseSchema) as any`** (`course-form.tsx` line 57, `lesson-dialog.tsx` line 41) -- the `as any` cast suppresses a type incompatibility between react-hook-form and zod v4. The comment on line 55-56 documents this as a known upstream issue, which is acceptable.

2. **`apiFetch` fallback string is hardcoded English** (`use-curriculum.ts` line 27): `"An unexpected error occurred"` inside `apiFetch()`. This is a fallback for the error thrown, which is then caught by each caller that displays `t("chapters.addFailed")` etc. The hardcoded string would only surface if the error is displayed directly outside these try/catch blocks. Low impact since all callers wrap it properly.

3. **Lesson reorder has a redundant guard** (`curriculum-editor.tsx` line 149): `if (!chapter.lessons.some((l) => l.id === overLessonId)) return;` -- This check is already covered by `newIndex === -1` on line 145. Not harmful but dead code.

4. **`course.level` is displayed raw** (`course-list.tsx` line 132): The level column shows the raw string value (e.g., "beginner") rather than a translated label. It should use the same level translation keys available in `courses.form.levelBeginner` etc. Low impact since this is admin-facing.

---

## Aspect 2: Security (8.5/10)

### Good
- **Admin layout guard** is server-side in `(admin)/layout.tsx`, preventing non-admin users from ever seeing admin content.
- **Both new GET API endpoints** correctly use `requireAdmin()` guard.
- **UUID validation** via `parseUuid(id)` in the `[id]` route prevents SQL injection via ID parameter.
- **Zod validation** for form submissions on both client and server side.
- **Existing PATCH/DELETE endpoints** maintain `requireAdmin()` guards.
- All action buttons have `sr-only` labels for accessibility.

### Minor Issues

1. **No CSRF protection on state-changing fetches** -- The `fetch()` calls for POST/PATCH/DELETE do not include any CSRF token. Mitigated by `SameSite` cookies and Supabase auth cookies. This is a pre-existing architectural pattern, not specific to this task.

---

## Aspect 3: Architecture (9.0/10)

### Good
- **FSD compliance**: Clean layer hierarchy -- app pages are thin wrappers, features contain business logic hooks and UI, widgets are self-contained blocks.
- **Barrel exports**: Every new slice has proper `index.ts` barrel files.
- **Separation of concerns**: `useCurriculum` hook encapsulates all CRUD operations cleanly with `apiFetch` helper. Dialog components are separated from the main editor.
- **Dynamic import**: `CurriculumEditor` is loaded via `next/dynamic` in the edit page, keeping @dnd-kit out of the initial bundle.
- **Navigation config**: `adminNav` follows the same `NavItem[]` pattern as existing `dashboardNav`.
- **Import direction**: All imports flow downward correctly (app -> widgets/features -> shared).
- **Proper typed interfaces**: `UpdateLessonData`, `AdminCourseSummary`, `AnalyticsData`, `UseCurriculumOptions` all have proper TypeScript interfaces.
- **`SidebarContent` extraction** for reuse between desktop sidebar and mobile Sheet.

### Minor Issues

1. **Widget-to-widget imports**: `AdminShell` imports from `@/widgets/theme-toggle` and `@/widgets/language-switcher`. This is same-layer coupling but follows the pre-existing codebase pattern.

---

## Aspect 4: Code Quality (8.0/10)

### Good
- **All visible strings use i18n translation keys** -- the major issue from attempt 1 is fully resolved. Translation keys exist in both `ko/common.json` and `en/common.json`.
- **Consistent naming**: kebab-case files, PascalCase components.
- **Clean DnD state management** with separate dialog state objects and a single `DndContext`.
- **`formatDuration`** and `formatPrice` utility functions are well-placed and clear.
- **Proper error handling pattern**: try/catch with translated toast messages throughout.
- **`useCallback` memoization** on all `useCurriculum` operations with correct dependency arrays.

### Minor Issues

1. **`zodResolver(...) as any`** cast in two places -- documented with comment, but still a type safety gap. Acceptable given the upstream issue between react-hook-form and zod v4.

2. **Edit mode uses `createCourseSchema` as form resolver then re-validates with `updateCourseSchema`** in `onSubmit` (line 148). This dual-validation pattern works because the form pre-fills all fields, but it is a logic smell. Could be cleaner with a conditional resolver.

3. **`editData as Record<keyof UpdateInput, unknown>`** cast in `course-form.tsx` lines 142/144 -- necessary due to the dynamic key iteration pattern but could be replaced with a more type-safe approach.

---

## Aspect 5: Test Coverage (7.0/10)

### Good
- **3 test files** with **12 passing tests** covering the three main UI components.
- Tests properly verify:
  - `CourseForm`: create mode renders all fields, edit mode renders edit title, isFree toggle, publish toggle
  - `CourseList`: loading skeletons, empty state, course rows with titles/badges/status, create button
  - `CurriculumEditor`: empty state, add chapter button, chapters with titles, lesson rendering, lesson count badges
- **Proper mocking** of next-intl, i18n/navigation, @dnd-kit, and SWR data hooks.
- **Tests validate i18n integration** by checking that translation keys (not hardcoded strings) appear in rendered output.

### Gaps

1. **No tests for API route handlers** (GET `/api/admin/courses` and GET `/api/admin/courses/[id]`). These contain meaningful logic (subquery counts, Map-based lesson grouping) that would benefit from testing.

2. **No interaction tests** -- no tests for form submission, delete confirmation, toggle publish, or DnD operations. The current tests only cover rendering states.

3. **No hook tests** for `useCurriculum`, `useAdminCourses`, or `useAdminCourse`. The `useCurriculum` hook contains significant business logic (7 CRUD operations with error handling).

4. **`formatDuration` and `formatPrice` utility functions** are not directly tested.

The test coverage is adequate for passing but falls short of comprehensive. The rendering tests verify i18n compliance and component structure, which was the critical gap from attempt 1.

---

## Summary

### Resolved from Attempt 1
- All 30+ hardcoded strings now use i18n translation keys (must-fix #1)
- 12 tests added across 3 test files (must-fix #2)
- `UpdateLessonData` interface replaces `Record<string, unknown>` (must-fix #3)
- Non-null assertion `courseId!` replaced with guard `if (courseId)` (should-fix #6)
- `"Course not found"` now uses `t("courses.notFound")` (should-fix from attempt 1)
- `"Details"` tab label now uses `t("courses.details")` (should-fix #7)

### Remaining Suggestions (non-blocking)

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | `course-form.tsx:57` | `zodResolver(createCourseSchema) as any` | Minor type safety (documented) |
| 2 | `use-curriculum.ts:27` | Hardcoded English in `apiFetch` error throw | Low (always caught by translated callers) |
| 3 | `curriculum-editor.tsx:149` | Redundant guard (dead code) | Cosmetic |
| 4 | `course-list.tsx:132` | Level displayed as raw string instead of translated | Low (admin-facing) |

---

## Discovered Conventions

### New Patterns (to propagate)
- Admin guard pattern: server-side role check in layout.tsx with Supabase auth + Drizzle DB query, redirect non-admins before any content renders
- DnD ID prefix convention: `chapter-{uuid}` and `lesson-{uuid}` for distinguishing sortable item types in a single DndContext
- `apiFetch` helper in `use-curriculum.ts` centralizes fetch + error throw for CRUD hooks with consistent error handling
- Dynamic import for heavy client-only dependencies (@dnd-kit) via `next/dynamic` with Skeleton loading fallback
- `SidebarContent` component extraction for reuse across desktop sidebar and mobile Sheet
- Dialog state management via typed state objects: `{ open, mode, id?, initialData? }` pattern for create/edit dialogs
- `UpdateLessonData` typed interface for partial update payloads (prefer explicit interface over `Record<string, unknown>`)

### Anti-patterns Found (to avoid in future)
- `zodResolver(...) as any` cast to suppress react-hook-form + zod v4 type mismatch (track upstream fix, -0.3 to code quality)
- Dual schema validation: form uses `createCourseSchema` resolver but edit onSubmit re-validates with `updateCourseSchema` (-0.2 to code quality)
- Hardcoded English string in `apiFetch` error fallback -- all user-facing error messages should be translatable (-0.1 to code quality)

### Reusable Utilities Created
- `src/widgets/curriculum-editor/model/use-curriculum.ts`: `apiFetch()` helper, `useCurriculum()` hook with 7 CRUD + reorder operations, `UpdateLessonData` interface
- `src/features/admin/courses/ui/course-form.tsx`: `slugify()` utility for URL-safe slug generation
- `src/widgets/curriculum-editor/ui/sortable-lesson.tsx`: `formatDuration()` for seconds-to-mm:ss conversion
- `src/features/admin/courses/ui/course-list.tsx`: `formatPrice()` for KRW currency formatting
- `src/widgets/admin-sidebar/ui/admin-shell.tsx`: `SidebarNavItem` and `SidebarContent` reusable sub-components, `iconMap` pattern for dynamic icon resolution

---

*Solo Workflow Plugin v2.6 - Review attempt 2*
