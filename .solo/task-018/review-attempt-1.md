# Review: task-018 - Admin Route Group + Course CRUD UI

**Reviewer**: Solo Workflow Reviewer
**Date**: 2026-02-03
**Branch**: `feature/task-018` (1 commit: `e4dc7a1`)
**Files changed**: 27 files, +2,178 lines / -8 lines

---

## Scores

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness (logic, types, edge cases) | 30% | 7.5 | 2.25 |
| Security (auth, admin guard, CSRF, input validation) | 20% | 8.5 | 1.70 |
| Architecture (FSD compliance, separation of concerns) | 20% | 8.5 | 1.70 |
| Code quality (naming, DRY, readability) | 15% | 7.0 | 1.05 |
| Test coverage | 15% | 2.0 | 0.30 |

**Total Score: 7.0 / 10**

**Verdict: FAIL** (threshold 8.0)

---

## Aspect 1: Correctness (7.5/10)

### Good
- Admin layout role guard (`layout.tsx` lines 25-32) correctly queries `users.role` from DB and redirects non-admins server-side, preventing any content flash.
- GET `/api/admin/courses` correctly uses subquery for chapter/lesson counts, avoiding N+1.
- GET `/api/admin/courses/[id]` efficiently groups lessons via `Map` for O(1) lookups, with proper `inArray` guard for empty `chapterIds`.
- DnD chapter/lesson reorder uses ID prefixes (`chapter-`, `lesson-`) to distinguish drag types.
- Optimistic DnD updates with rollback on API error (via `onMutate()` in the `reorder` catch block).
- `CourseForm` properly handles both create and edit modes with separate validation schemas.
- Auto-slug generation from title with `slugTouched` ref to prevent overwriting manual edits.

### Issues

1. **`CourseForm` uses `createCourseSchema` as resolver for both create and edit modes** (`course-form.tsx` line 55). The edit mode then re-validates with `updateCourseSchema` inside `onSubmit` (line 145). This means client-side form validation will show errors based on the `createCourseSchema` rules (all required fields) even in edit mode, but submission re-validates with the more lenient `updateCourseSchema`. This is confusing but not broken since the form pre-fills all fields anyway. A minor logic smell.

2. **`zodResolver(createCourseSchema) as any`** (`course-form.tsx` line 55, `lesson-dialog.tsx` line 41) -- the `as any` cast suppresses a type incompatibility. This is explicitly `eslint-disable`d but is an indicator that the resolver type and schema type are misaligned. Should be investigated to see if proper typing is achievable.

3. **Edit page error state shows hardcoded English** (`[id]/page.tsx` line 42): `"Course not found"` is not translated.

4. **Tab label "Details" is hardcoded** (`[id]/page.tsx` line 52): `<TabsTrigger value="details">Details</TabsTrigger>` should use a translation key.

5. **Lesson reorder has a redundant guard check** (`curriculum-editor.tsx` lines 128-139): After finding the chapter containing `activeLessonId`, the code checks `if (!chapter.lessons.some((l) => l.id === overLessonId)) return;` on line 139. This check is already implied by `newIndex === -1` on line 136, so it is dead code. Not harmful but unnecessary.

6. **`useEffect` with `form` in dependency array** (`course-form.tsx` line 91, line 99): `form` object from `useForm` is stable by default in react-hook-form, so this is not harmful, but it can cause linter warnings in some configurations.

---

## Aspect 2: Security (8.5/10)

### Good
- **Admin layout guard** is server-side in the `(admin)/layout.tsx`, preventing non-admin users from ever seeing admin content.
- **Both new GET API endpoints** (`/api/admin/courses` and `/api/admin/courses/[id]`) correctly use `requireAdmin()` guard.
- **UUID validation** via `parseUuid(id)` in the `[id]` route prevents SQL injection via ID parameter.
- **Zod validation** for form submissions on both client and server side.
- **Existing PATCH/DELETE endpoints** maintain `requireAdmin()` guards.

### Issues

1. **No CSRF protection on state-changing fetches** -- The `fetch()` calls for POST/PATCH/DELETE in `course-form.tsx`, `course-list.tsx`, and `use-curriculum.ts` do not include any CSRF token. This is mitigated by the fact that cookies are `SameSite` by default in modern browsers and the API uses Supabase auth cookies, but explicit CSRF protection would be ideal. This is a pre-existing architectural pattern, not introduced by this task.

---

## Aspect 3: Architecture (8.5/10)

### Good
- **FSD compliance**: Clean layer hierarchy -- app pages are thin wrappers, features contain business logic hooks and UI, widgets are self-contained blocks.
- **Barrel exports**: Every new slice has proper `index.ts` barrel files.
- **Separation of concerns**: `useCurriculum` hook encapsulates all CRUD operations cleanly with `apiFetch` helper. Dialog components are separated from the main editor.
- **Dynamic import**: `CurriculumEditor` is loaded via `next/dynamic` in the edit page, keeping @dnd-kit out of the initial bundle.
- **Navigation config**: `adminNav` follows the same `NavItem[]` pattern as existing `dashboardNav`.
- **Import direction**: All imports flow downward correctly (app -> widgets/features -> shared).

### Issues

1. **`AdminShell` imports from `@/widgets/theme-toggle` and `@/widgets/language-switcher`** -- widget-to-widget imports within the same layer. This is acceptable in FSD if both are in the same layer, but it creates a coupling between widgets. The existing codebase appears to follow this pattern already.

---

## Aspect 4: Code Quality (7.0/10)

### Good
- **Consistent naming**: kebab-case files, PascalCase components.
- **Good use of `SidebarContent` extraction** in `admin-shell.tsx` for reuse between desktop and mobile nav.
- **Clean DnD state management** with separate dialog state objects and a single `DndContext`.
- **`formatDuration`** and `formatPrice` utility functions are well-placed and clear.

### Issues

1. **Numerous hardcoded English strings not using i18n translation keys** -- AC #10 requires all visible strings to use translation keys. Found in:
   - `course-form.tsx` line 247: `"Instructor Bio"` (should be `t("courses.form.instructorBio")`)
   - `course-form.tsx` line 367: `"Free Course"` (should be `t("courses.form.isFree")`)
   - `course-form.tsx` line 369: `"This course is free"` / `"This course is paid"` (should be translated)
   - `course-form.tsx` line 135: `"Course created"` toast
   - `course-form.tsx` line 161: `"Course updated"` toast
   - `course-form.tsx` line 132: `"Failed to create course"` fallback
   - `course-form.tsx` lines 291-293: `"Beginner"`, `"Intermediate"`, `"Advanced"` select items
   - `course-list.tsx` line 95: `"No courses yet"`
   - `course-list.tsx` line 111-114: `"Status"`, `"Ch."`, `"Ls."`, `"Actions"` table headers
   - `course-list.tsx` line 139: `"Free"` badge
   - `curriculum-editor.tsx` line 198: `"No chapters yet"`
   - `curriculum-editor.tsx` lines 303-305: `"Are you sure?"` delete confirmation messages
   - `sortable-chapter.tsx` line 71: `"lessons"` in badge
   - `sortable-chapter.tsx` line 94: `"No lessons yet"`
   - `sortable-lesson.tsx` line 62: `"Preview"` badge text
   - `use-curriculum.ts` -- all toast messages (lines 31, 47, 60, 85, 101, 115, 133)
   - `[id]/page.tsx` line 42: `"Course not found"`
   - `[id]/page.tsx` line 52: `"Details"` tab label

   This is a significant compliance gap with the SPEC AC #10 requirement: "All text uses `useTranslations('admin.*')`, keys exist."

2. **`updateLesson` uses `Record<string, unknown>`** (`use-curriculum.ts` line 95) -- this is a loose type that should be a proper interface matching the lesson update fields. The same type weakness appears in `course-form.tsx` `onSubmit` (lines 117, 119, 139 with `Record<string, unknown>` casts).

3. **Non-null assertion** (`course-form.tsx` line 162): `onSuccess?.(courseId!)` -- the `!` asserts `courseId` is non-null, but in edit mode it should always be present since the component requires it. Still, it would be cleaner to guard this.

---

## Aspect 5: Test Coverage (2.0/10)

### Critical Gap

**No tests were written for any of the 27 files changed.** The `src/__tests__/` directory has no admin-related tests. Given that this task introduces:
- 2 new API endpoints (GET handlers)
- Complex form logic with dual-mode validation
- DnD reordering with optimistic updates
- Admin role guard
- 10+ new client components

The complete absence of tests is a major deficiency. At minimum, the following should be tested:
- Admin layout role guard behavior
- GET `/api/admin/courses` and GET `/api/admin/courses/[id]` responses
- `CourseForm` create and edit submission flows
- `CourseList` rendering and action handlers
- `useCurriculum` hook operations
- `formatDuration` and `formatPrice` utility functions

---

## Summary of Issues to Fix

### Must Fix (blocking pass)

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | Multiple files | ~30+ hardcoded English strings need i18n translation keys | AC #10 violated |
| 2 | No test files | Zero test coverage for all new code | AC not met |
| 3 | `use-curriculum.ts:95` | `updateLesson` param type is `Record<string, unknown>` | Type safety |

### Should Fix

| # | File | Issue | Impact |
|---|------|-------|--------|
| 4 | `course-form.tsx:55` | `zodResolver(createCourseSchema) as any` | Type safety |
| 5 | `course-form.tsx:145` | Edit mode re-validates with different schema in onSubmit | Logic smell |
| 6 | `course-form.tsx:162` | Non-null assertion `courseId!` | Safety |
| 7 | `[id]/page.tsx:52` | "Details" tab label hardcoded | i18n |

---

## Discovered Conventions

### New Patterns (to propagate)
- Admin guard pattern: server-side role check in layout.tsx with Supabase auth + Drizzle DB query
- DnD ID prefix convention: `chapter-{uuid}` and `lesson-{uuid}` for distinguishing sortable item types
- `apiFetch` helper in `use-curriculum.ts` centralizes fetch + error pattern for CRUD hooks
- Dynamic import for heavy client-only dependencies (@dnd-kit) via `next/dynamic`
- `SidebarContent` component extraction for reuse across desktop sidebar and mobile Sheet

### Anti-patterns Found (to avoid in future)
- 30+ hardcoded English strings in admin components instead of i18n keys (-3.0 to code quality score)
- `Record<string, unknown>` used as function parameter type instead of proper interface (-0.5 to correctness)
- `as any` cast on zodResolver to suppress type mismatch (-0.3 to correctness)
- Zero test coverage for 2,100+ lines of new code (-8.0 to test coverage score)

### Reusable Utilities Created
- `src/widgets/curriculum-editor/model/use-curriculum.ts`: `apiFetch()` helper, `useCurriculum()` hook with CRUD + reorder operations
- `src/features/admin/courses/ui/course-form.tsx`: `slugify()` utility for URL-safe slug generation
- `src/widgets/curriculum-editor/ui/sortable-lesson.tsx`: `formatDuration()` for seconds-to-mm:ss conversion
- `src/features/admin/courses/ui/course-list.tsx`: `formatPrice()` for KRW currency formatting

---

*Solo Workflow Plugin v2.6 - Review attempt 1*
