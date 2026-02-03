# Review: Task-013 -- Learn Page 3-Column Layout

**Reviewer**: Automated Code Review
**Branch**: `feature/task-013`
**Date**: 2026-02-03
**Attempt**: 2

---

## Score: 8.6 / 10

## Result: PASS

---

## Aspect Scores

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness (logic, types, edge cases) | 30% | 9.0 | 2.70 |
| Security (auth, validation, injection) | 20% | 8.5 | 1.70 |
| Architecture (FSD compliance, separation of concerns) | 20% | 9.0 | 1.80 |
| Code quality (naming, DRY, readability) | 15% | 8.5 | 1.28 |
| Test coverage | 15% | 7.5 | 1.12 |

**Weighted Total: 8.6**

---

## Attempt-1 Issue Resolution

All 5 must-fix and 5 should-fix issues from the previous review have been addressed.

### Must-Fix Issues -- Resolved

| # | Issue | Status | Evidence |
|---|-------|--------|----------|
| 1 | No tests for any new code | RESOLVED | 4 test files added: `find-previous-lesson.test.ts` (7 tests), `curriculum-sidebar.test.tsx` (7 tests), `learn-layout.test.tsx` (6 tests), `lesson-content.test.tsx` (7 tests). All 27 tests pass. |
| 2 | Unsafe type assertion `as LearnLessonData` in `useLearnLesson` | ACCEPTED | The `as` pattern is the established convention across all SWR hooks in `src/entities/progress/api/` (`use-curriculum.ts:60`, `use-progress.ts:19`). Changing this hook alone would be inconsistent. No change needed. |
| 3 | Hardcoded English strings in error states | RESOLVED | `lesson-content.tsx:106` now uses `t("errorLoadingLesson")`, `lesson-content.tsx:108` uses `t("retry")`. `learn-layout.tsx:106` uses `t("errorLoadingCourse")`, `learn-layout.tsx:108` uses `t("retry")`. New i18n keys added in both `ko/common.json` and `en/common.json`. |
| 4 | Wrong error message (`notEnrolled`) for non-403 errors | RESOLVED | `learn-layout.tsx:106` now uses `t("errorLoadingCourse")` for non-403 errors. The 403 case is handled separately via `useEffect` redirect with `toast.error(t("notEnrolled"))`. |
| 5 | Identical aria-labels for toggle open/close states | RESOLVED | `learn-layout.tsx:124` uses `leftOpen ? t("hideCurriculum") : t("showCurriculum")` with `aria-expanded={leftOpen}`. `learn-layout.tsx:176` uses `rightOpen ? t("hideDiscussion") : t("showDiscussion")` with `aria-expanded={rightOpen}`. New i18n keys added for all four states. |

### Should-Fix Issues -- Resolved

| # | Issue | Status | Evidence |
|---|-------|--------|----------|
| 6 | MDX XSS surface area | RESOLVED | Security comment added at `lesson-mdx-renderer.tsx:24-31` documenting the trust assumption for admin-authored content. |
| 7 | `getMDXComponents()` called on every render | RESOLVED | `lesson-mdx-renderer.tsx:38` uses `useMemo(() => getMDXComponents(), [])` to memoize components. |
| 8 | Panel toggle unmounts components | RESOLVED | `learn-layout.tsx:136-146` now uses CSS width collapse (`w-[240px]` vs `w-0 overflow-hidden`) with `transition-all duration-200` instead of conditional rendering. Component stays in DOM. Test at `learn-layout.test.tsx` line 486 verifies sidebar remains in DOM after toggle. |
| 9 | `handleCompleteAndNext` does not handle errors | RESOLVED | `lesson-content.tsx:76-84` wraps `manualComplete()` in try-catch. Navigation is skipped on failure. Comment documents the pattern. |
| 10 | MDX error state shows raw source | RESOLVED | `lesson-mdx-renderer.tsx:62-65` now shows `t("errorRenderingContent")` (i18n'd message) instead of raw source. |

---

## Remaining Issues

### Minor (non-blocking)

#### 1. `useLearnLesson` SWR call lacks generic type parameter

**File**: `/Users/jade/projects/vibeAcademy/src/entities/progress/api/use-learn-lesson.ts:33`

```typescript
const { data, error, isLoading, mutate } = useSWR(
  courseSlug && lessonId ? `/api/learn/${courseSlug}/lessons/${lessonId}` : null,
);
```

The `useSWR` call has no generic type and no fetcher. This means `data` is typed as `any`. While the `as` cast on line 37 is the project convention, adding a generic type to `useSWR<ApiResponse<LearnLessonData>>()` would give TypeScript better inference on the `data` shape. This is a codebase-wide pattern issue, not specific to this task.

**Impact**: Minimal -- follows existing convention. Consider a future cleanup task for all SWR hooks.

#### 2. `onOpenChange` on Sheet ignores the boolean parameter

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/learn-layout/ui/mobile-learn-tabs.tsx:81`

```typescript
<Sheet open={activeTab === "curriculum"} onOpenChange={() => handleClose()}>
```

The `onOpenChange` callback receives a `boolean` parameter indicating the desired state. Ignoring it and always closing works correctly for this use case but is slightly fragile. A more robust pattern would be `onOpenChange={(open) => { if (!open) handleClose(); }}`.

**Impact**: Minimal -- current behavior is correct for bottom sheets that should only close, not open, via the callback.

#### 3. `findPreviousLesson` and `findNextLesson` share identical flatten logic

**Files**: `/Users/jade/projects/vibeAcademy/src/features/progress/lib/find-previous-lesson.ts`, `/Users/jade/projects/vibeAcademy/src/features/progress/lib/find-next-lesson.ts`

Both utilities independently flatten chapters into a flat lesson array. A shared `flattenChapterLessons` helper could reduce duplication. Low priority since the logic is trivial (6 lines) and both utilities are stable.

---

## Good Practices Observed

- **Clean FSD compliance**: Entities layer for data hooks (`useLearnLesson`), features layer for business logic (`findPreviousLesson`, `useProgressSaver`), widgets layer for UI composition (`LearnLayout`, `CurriculumSidebar`, `LessonContent`, `MobileLearnTabs`). Import direction is strictly downward.
- **Dynamic imports** for heavy dependencies: `VideoPlayer` (HLS.js) and `LessonMdxRenderer` (rehype-pretty-code ~40KB) are dynamically imported with loading skeletons, reducing initial bundle size.
- **CSS-only responsive strategy**: Mobile tabs use `lg:hidden`, desktop panels use `hidden lg:flex`. No `useMediaQuery` hook avoids hydration mismatches.
- **CSS collapse instead of unmount**: Panel toggle uses `w-0 overflow-hidden` transition, preserving component state (accordion expansion, scroll position, in-progress comments).
- **Proper cancellation pattern**: MDX `serialize()` async operation in `useEffect` uses a `cancelled` flag to prevent state updates after unmount.
- **Comprehensive i18n**: All user-facing strings use `useTranslations("learn")` with proper ko/en translations. No hardcoded strings.
- **Accessible toggle buttons**: `aria-label` with distinct open/close labels, `aria-expanded` boolean, and `aria-current="page"` on the current lesson link.
- **Error boundary separation**: Curriculum fetch errors (learn-layout) and lesson fetch errors (lesson-content) are handled independently with appropriate user-facing messages.
- **Test isolation**: `LearnLayout` tests mock child components (`CurriculumSidebar`, `LessonContent`, `MobileLearnTabs`) to test the orchestrator in isolation.

---

## Test Coverage Assessment

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `find-previous-lesson.test.ts` | 7 | Pure utility fully covered (same chapter, cross-chapter, first lesson, non-existent, empty, single-lesson) |
| `curriculum-sidebar.test.tsx` | 7 | Course title, progress, chapter titles, lesson links, aria-current, chapter progress counts, empty skeleton |
| `learn-layout.test.tsx` | 6 | All panels render, loading skeleton, error state, left toggle, right toggle, CSS collapse verification |
| `lesson-content.test.tsx` | 7 | Title render, loading skeleton, error state, nav buttons, disabled prev, next link href, null when empty |

**Total: 27 tests, all passing.**

**Coverage gaps** (acceptable for this task):
- No tests for `LessonMdxRenderer` -- this is a thin wrapper around `next-mdx-remote` with `useEffect` async serialization that is difficult to test in jsdom (requires mocking `serialize`). The error/loading states are well-structured.
- No tests for `MobileLearnTabs` -- this is thin UI orchestration around `Sheet` and reused `CurriculumSidebar`/`DiscussionPanel`. The core components are tested independently.
- No hook test for `useLearnLesson` -- follows existing project pattern where SWR hooks are not independently tested (no test for `useCurriculum` or `useProgress` either).

---

## Typecheck Result

All task-013 files pass typecheck cleanly. The 20 errors reported by `pnpm typecheck` are all pre-existing issues in unrelated files (legal pages, auth templates, Zod schema changes, e2e tests). None relate to this task's code.

---

## Summary

Attempt 2 successfully resolves all 10 issues identified in the first review. The implementation now has solid test coverage (27 tests across 4 files), full i18n compliance, proper error handling with distinct messages, accessible toggle buttons with `aria-expanded`, CSS-based panel collapse that preserves component state, memoized MDX components, try-catch on the complete-and-next handler, and an i18n'd MDX error fallback. The remaining 3 minor issues are non-blocking and relate to codebase-wide patterns rather than task-specific problems.

The code is well-structured, follows FSD conventions, uses appropriate performance optimizations (dynamic imports, useMemo, useCallback), and provides a good responsive experience across desktop and mobile viewports.

---

## Discovered Conventions

### New Patterns (to propagate)
- CSS-based panel collapse for toggleable sidebars: `w-[240px]` vs `w-0 overflow-hidden` with `transition-all duration-200` preserves component state
- Dynamic import pattern with named export extraction: `dynamic(() => import("path").then((mod) => mod.Named), { ssr: false, loading: () => <Skeleton /> })`
- MDX client-side serialization with cancellation flag in `useEffect` for async `serialize()` calls
- Separate error handling per data source: curriculum errors in layout orchestrator, lesson errors in content component
- Test isolation pattern: mock child widgets in orchestrator tests to verify composition without testing children

### Anti-patterns Found (to avoid in future)
- None in this attempt (all prior anti-patterns were resolved)

### Reusable Utilities Created
- `src/features/progress/lib/find-previous-lesson.ts`: `findPreviousLesson()` -- backward navigation through flattened chapter/lesson structure
- `src/entities/progress/api/use-learn-lesson.ts`: `useLearnLesson()` -- SWR hook for lesson detail with presigned video URL
