# Review: Task-013 -- Learn Page 3-Column Layout

**Reviewer**: Automated Code Review
**Branch**: `feature/task-013`
**Date**: 2026-02-03
**Attempt**: 1

---

## Score: 7.1 / 10

## Result: FAIL

---

## Aspect Scores

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness (logic, types, edge cases) | 30% | 7.0 | 2.10 |
| Security (auth, validation, injection) | 20% | 7.5 | 1.50 |
| Architecture (FSD compliance, separation of concerns) | 20% | 8.5 | 1.70 |
| Code quality (naming, DRY, readability) | 15% | 7.0 | 1.05 |
| Test coverage | 15% | 5.0 | 0.75 |

**Weighted Total: 7.1**

---

## Must-Fix Issues

### 1. No tests for any new code (Test Coverage: -3.0 impact)

**Files affected**: All new files
**Severity**: High

No unit tests were written for any of the 10 new files:

- No `src/__tests__/features/progress/find-previous-lesson.test.ts` -- the sibling `find-next-lesson.test.ts` exists with 7 tests. The `findPreviousLesson` utility is pure logic and trivially testable.
- No `src/__tests__/widgets/learn-layout/` directory at all -- no tests for `LearnLayout`, `CurriculumSidebar`, `LessonContent`, `MobileLearnTabs`, or `LessonMdxRenderer`.
- No `src/__tests__/entities/progress/use-learn-lesson.test.ts` for the new SWR hook.

The SPEC (Phase 5) explicitly states: "Run checks: pnpm typecheck, pnpm lint, pnpm build." Testing is implied by the project's existing test culture where every feature and widget has corresponding tests.

**Required action**: At minimum, add:
1. Unit tests for `findPreviousLesson` (mirror `find-next-lesson.test.ts` pattern)
2. Basic render tests for the main widget components (`LearnLayout`, `CurriculumSidebar`, `LessonContent`)
3. Hook test for `useLearnLesson`

---

### 2. Unsafe type assertion in `useLearnLesson` hook

**File**: `src/entities/progress/api/use-learn-lesson.ts:37`
**Severity**: High

```typescript
const lesson = (data?.data as LearnLessonData) ?? null;
```

This uses `as` type assertion, bypassing TypeScript's type checking. If the API returns a different shape than `LearnLessonData`, the code silently accepts it and downstream components will encounter runtime errors. The SWR `useSWR` call on line 33-35 also lacks a generic type parameter for the fetcher response.

**Required action**: Either:
- Add a generic type to `useSWR<ApiResponse<LearnLessonData>>()` (matching the project's `ApiResponse` pattern), or
- Add runtime validation (e.g., Zod parse) of the API response

---

### 3. Hardcoded English strings in error states

**File**: `src/widgets/learn-layout/ui/lesson-content.tsx:102`
**File**: `src/widgets/learn-layout/ui/lesson-content.tsx:103`
**File**: `src/widgets/learn-layout/ui/learn-layout.tsx:107`
**Severity**: High

```typescript
// lesson-content.tsx:102
<p className="text-lg font-medium text-foreground">Could not load lesson</p>
// ...
<Button ...>Retry</Button>
```

```typescript
// learn-layout.tsx:107
<Button onClick={() => window.location.reload()} variant="outline">
  Retry
</Button>
```

The SPEC requires: "i18n: all strings from learn.* namespace (already complete in ko/en)." These hardcoded English strings break i18n compliance. The `t` function is already available in both components.

**Required action**: Replace with `t("errorLoadingLesson")` and `t("retry")` (or equivalent i18n keys).

---

### 4. Wrong error message for non-403 errors

**File**: `src/widgets/learn-layout/ui/learn-layout.tsx:105`
**Severity**: Medium-High

```typescript
if (error && error.status !== 403) {
  return (
    <div ...>
      <p ...>{t("notEnrolled")}</p>  // <-- Wrong message!
```

When a non-403 error occurs (e.g., 500 server error, network failure), the UI displays "notEnrolled" message. This is semantically incorrect -- a 500 error is not an enrollment issue. This confuses users.

**Required action**: Use a generic error message like `t("errorLoadingCourse")` or `t("unexpectedError")` for non-403 errors.

---

### 5. Identical aria-labels for toggle open/close states

**File**: `src/widgets/learn-layout/ui/learn-layout.tsx:123`
**Severity**: Medium

```typescript
aria-label={leftOpen ? t("sidebar.curriculum") : t("sidebar.curriculum")}
```

The ternary returns the same value for both states. An open panel toggle and a closed panel toggle should have different aria-labels (e.g., "Hide curriculum" vs "Show curriculum") so screen reader users understand the current state and the action the button will perform.

**Required action**: Use distinct i18n keys like `t("hideCurriculum")` / `t("showCurriculum")`, or at minimum use `aria-expanded={leftOpen}` on the button.

---

## Should-Fix Issues

### 6. MDX XSS surface area via `dangerouslySetInnerHTML`

**File**: `src/widgets/learn-layout/ui/lesson-mdx-renderer.tsx`
**Severity**: Medium

The `LessonMdxRenderer` uses `next-mdx-remote`'s `serialize` + `MDXRemote` to render user-facing MDX content. While `next-mdx-remote` provides some sandboxing by not allowing raw JavaScript execution in MDX, the lesson descriptions come from the API (which originates from database content). If an admin or content creator injects malicious content, MDX custom components could potentially execute code.

The mitigation is that `getMDXComponents()` from `@/widgets/blog` constrains which components are available, limiting the attack surface. However, there is no explicit sanitization of the `source` string before passing it to `serialize`.

**Recommended action**: Add a brief comment documenting the trust assumption (i.e., lesson descriptions are admin-authored), and consider adding `rehype-sanitize` as an additional rehype plugin for defense-in-depth.

---

### 7. `getMDXComponents()` called on every render

**File**: `src/widgets/learn-layout/ui/lesson-mdx-renderer.tsx:64`
**Severity**: Low-Medium

```typescript
<MDXRemote {...mdxSource} components={getMDXComponents()} />
```

`getMDXComponents()` is called on every render, creating a new object reference each time. This forces `MDXRemote` to re-render all MDX content even when only the components object reference changed. This should be memoized or hoisted outside the component.

**Recommended action**: Use `useMemo` to memoize the result:
```typescript
const components = useMemo(() => getMDXComponents(), []);
```
Or hoist to module scope if `getMDXComponents` is pure.

---

### 8. Panel toggle uses conditional rendering instead of CSS visibility

**File**: `src/widgets/learn-layout/ui/learn-layout.tsx:134-143, 157-161`
**Severity**: Low-Medium

The panels use `{leftOpen && <CurriculumSidebar ... />}` which completely unmounts/remounts the component tree. This means:
- Accordion expansion state in CurriculumSidebar is lost when toggling
- Scroll position in discussion panel is lost
- Any in-progress discussion comment is lost
- The `transition-all duration-200` CSS class on the sidebar has no effect since the element is conditionally rendered (not transitioning width from 0 to 240px)

**Recommended action**: Keep panels in the DOM and use CSS to hide/collapse them:
```typescript
<CurriculumSidebar
  className={cn(
    "hidden lg:flex shrink-0 transition-all duration-200",
    leftOpen ? "w-[240px]" : "w-0 overflow-hidden"
  )}
/>
```

---

### 9. `handleCompleteAndNext` does not handle errors

**File**: `src/widgets/learn-layout/ui/lesson-content.tsx:76-81`
**Severity**: Low-Medium

```typescript
const handleCompleteAndNext = useCallback(async () => {
  await manualComplete();
  if (nextLesson) {
    router.push(`/learn/${courseSlug}/${nextLesson.lessonId}`);
  }
}, [manualComplete, nextLesson, courseSlug, router]);
```

If `manualComplete()` throws an error, the promise rejection is unhandled. The button's `onClick` will fire an unhandled promise rejection. While `useProgressSaver` likely has internal error handling, the navigation should not proceed if completion fails.

**Recommended action**: Wrap in try-catch:
```typescript
const handleCompleteAndNext = useCallback(async () => {
  try {
    await manualComplete();
    if (nextLesson) {
      router.push(`/learn/${courseSlug}/${nextLesson.lessonId}`);
    }
  } catch {
    // manualComplete handles its own errors; navigation simply skipped
  }
}, [manualComplete, nextLesson, courseSlug, router]);
```

---

### 10. MDX error state shows raw source without sanitization

**File**: `src/widgets/learn-layout/ui/lesson-mdx-renderer.tsx:48`
**Severity**: Low-Medium

```typescript
if (error) {
  return <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">{source}</div>;
}
```

When MDX serialization fails, the raw source string is rendered directly into the DOM via React's text interpolation. While React escapes text content by default (so this is not an XSS vector), displaying raw MDX/Markdown to users is a poor UX. Users see syntax like `## heading` or `\`\`\`code\`\`\`` as plain text.

**Recommended action**: Show a generic "Could not render lesson description" message (i18n'd), not the raw source.

---

## Nice-to-Have

### 11. `useProgressSaver` re-initializes on every lesson change

The `useProgressSaver` hook receives `initialPosition` and `initialCompleted` as props derived from `currentLesson`. When `currentLesson` changes (e.g., on lesson navigation), the hook reinitializes. Verify that the hook handles this transition cleanly without stale closure issues.

### 12. Consider `aria-expanded` on panel toggle buttons

In addition to fixing the identical aria-labels (Must-Fix #5), adding `aria-expanded={leftOpen}` / `aria-expanded={rightOpen}` would provide better screen reader support for the toggle state.

### 13. Mobile sheet `onOpenChange` could use the boolean parameter

```typescript
<Sheet open={activeTab === "curriculum"} onOpenChange={() => handleClose()}>
```

The `onOpenChange` callback receives a boolean `open` parameter. Ignoring it and always closing works for this use case, but passing it through would be more robust: `onOpenChange={(open) => { if (!open) handleClose(); }}`.

### 14. Loading skeleton for learn-layout has no animation

The top-level loading skeleton in `learn-layout.tsx` uses `<Skeleton>` components but the video area skeleton is missing. The skeleton renders a `<Skeleton className="aspect-video w-full" />` in the center which is fine, but the three-column skeleton layout is only visible on desktop (`hidden lg:flex`) -- on mobile, users see just the center skeleton without any indication that side panels exist.

### 15. `findPreviousLesson` and `findNextLesson` could share flatten logic

Both utilities have identical chapter-flattening code. A shared `flattenChapterLessons` helper could reduce duplication. Not a blocker but worth considering as the codebase grows.

---

## Summary

The implementation follows the SPEC's architectural requirements well. FSD layer boundaries are respected (entities for data hooks, features for business logic, widgets for UI composition). The code uses proper patterns: dynamic imports for heavy dependencies (VideoPlayer, MDX renderer), conditional SWR fetching, CSS breakpoint approach over JS `useMediaQuery`, and locale-aware navigation.

**Key strengths**:
- Clean separation of concerns between layout orchestrator, sidebar, content, and mobile tabs
- Good use of dynamic imports to reduce initial bundle size
- Proper MDX serialization with cancellation pattern in useEffect
- Accordion-based curriculum with auto-expanded current chapter
- Mobile bottom sheet approach is well-designed with reused components

**Key weaknesses**:
- **Zero test coverage** for all new code (10 files) -- this is the primary failure point
- Hardcoded English strings violating i18n requirement
- Unsafe type assertion in SWR hook
- Incorrect error message for non-403 errors
- Panel toggle removes components from DOM (losing state and breaking CSS transitions)
- Identical aria-labels on toggle buttons

The score of 7.1 falls below the 8.0 threshold primarily due to the complete absence of tests and several correctness issues that need addressing.

---

## Discovered Conventions

### New Patterns (to propagate)
- Dynamic import pattern for heavy client widgets: `const X = dynamic(() => import("path").then(m => m.X), { ssr: false, loading: () => <Skeleton /> })`
- MDX client-side serialization with cancellation: `useEffect` with `cancelled` flag for async `serialize()` calls
- Mobile/desktop responsive via CSS classes (`hidden lg:flex` / `lg:hidden`) instead of `useMediaQuery` to avoid hydration mismatches
- Route group `(learn)` with minimal layout for full-viewport experiences (no header/footer)

### Anti-patterns Found (to avoid in future)
- Hardcoded English strings in components that have `useTranslations` already imported (-1.0 score impact)
- `as` type assertion on API response data without runtime validation (-0.5 score impact)
- Conditional rendering `{open && <Panel />}` for toggleable panels loses component state -- use CSS visibility instead (-0.5 score impact)
- Identical aria-label for both open/close states of a toggle button (-0.3 score impact)

### Reusable Utilities Created
- `src/features/progress/lib/find-previous-lesson.ts`: `findPreviousLesson()` -- mirrors `findNextLesson()` for backward navigation
- `src/entities/progress/api/use-learn-lesson.ts`: `useLearnLesson()` -- SWR hook for lesson detail with presigned video URL
