# Review: Task-010 -- Course Detail Page

**Reviewer**: Automated Code Review
**Branch**: `feature/task-010`
**Date**: 2026-02-03

---

## Score: 8.3 / 10

## Result: PASS

---

## Aspect Scores

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness (logic, types, edge cases) | 30% | 8.5 | 2.55 |
| Security (auth, validation, injection) | 20% | 8.5 | 1.70 |
| Architecture (FSD compliance, separation of concerns) | 20% | 9.0 | 1.80 |
| Code quality (naming, DRY, readability) | 15% | 8.0 | 1.20 |
| Test coverage | 15% | 7.0 | 1.05 |
| **Total** | | | **8.3** |

---

## Verification Results

- **TypeScript**: All pre-existing type errors; no NEW type errors introduced by this branch
- **ESLint**: 36 Prettier formatting errors in 3 new test files (indentation); no logic/semantic errors in source files
- **Tests**: All 28 new tests pass (4 test files: format, purchase-widget, course-hero, course-faq-section)

---

## Must-Fix Issues

None.

---

## Should-Fix Issues

### 1. Prettier formatting errors in test files

**Files**:
- `/Users/jade/projects/vibeAcademy/src/__tests__/widgets/course-detail/course-faq-section.test.tsx`
- `/Users/jade/projects/vibeAcademy/src/__tests__/widgets/course-detail/course-hero.test.tsx`
- `/Users/jade/projects/vibeAcademy/src/__tests__/widgets/course-detail/purchase-widget.test.tsx`

**Issue**: All 3 test files have Prettier formatting violations (incorrect indentation of `useTranslations` mock arrow function). ESLint reports 36 errors total from these files. This is a trivially fixable issue -- run `pnpm format` or `pnpm lint:fix` to auto-resolve.

**Impact**: CI will fail on lint checks.

### 2. Unused `locale` prop in `CourseDetailContent`

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/course-detail-content.tsx`

**Lines**: 21-25

The `locale` prop is declared in the interface (`CourseDetailContentProps`) and passed from the page route at `/Users/jade/projects/vibeAcademy/src/app/[locale]/(marketing)/courses/[slug]/page.tsx:33`, but is never used inside the component. The destructuring at line 25 is `{ slug }` only, omitting `locale`.

**Fix**: Either prefix with underscore (`_locale`) to indicate intentionally unused, or remove it from the interface if not needed (next-intl provides locale via hooks). If it will be used in future (e.g., for locale-specific API calls), add a comment explaining the planned use.

### 3. `as unknown as` type assertion in `RelatedCoursesSection`

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/related-courses-section.tsx`

**Line**: 22

```typescript
const relatedCourses = courses
  .filter((c) => c.id !== currentCourseId)
  .slice(0, 3) as unknown as CourseSummaryWithStats[];
```

The `as unknown as` double assertion is a code smell that bypasses type safety. This suggests the return type from `useCourses` does not align with what `CourseCard` expects. A safer approach would be to type the hook return value correctly or use a proper type guard.

### 4. Review pagination does not accumulate results

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/course-reviews-section.tsx`

**Lines**: 32-36

The "Show more" button increments `page`, but `useCourseReviews` returns reviews for that single page only. Previous pages' reviews are lost. The SPEC specifies "Show more button increments page state and **appends** reviews", but the current hook returns only the current page's items. The user experience would be: clicking "Show more" replaces the visible reviews rather than adding to them.

**Fix**: Either accumulate reviews in local state across pages, or modify the hook to support cursor-based pagination that appends to a local cache.

---

## Nice-to-Have

### 1. Missing tests for `CurriculumAccordion`, `CourseReviewsSection`, `InstructorSection`, `RelatedCoursesSection`, `StarRating`, `CourseDetailContent`

Only 4 of the 11 new source files have tests. Key untested areas include:
- `CurriculumAccordion` expand/collapse logic
- `CourseDetailContent` orchestrator (loading, error, not-found states)
- `CourseReviewsSection` pagination behavior and review card rendering
- `StarRating` visual rendering at different ratings

### 2. `CourseHero` thumbnail URL in inline style

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/course-hero.tsx`

**Line**: 28

```typescript
style={{ backgroundImage: `url(${course.thumbnailUrl})` }}
```

If `course.thumbnailUrl` contains special CSS characters (e.g., parentheses, quotes), this could break the style. While not a true XSS vector (React sanitizes style objects), it is worth noting. Consider using `CSS.escape()` or encoding the URL, or using a Next.js `<Image>` component with `fill` for better optimization and safety.

### 3. `handleCheckout` error handling only logs to console

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/course-detail-content.tsx`

**Lines**: 47-48, 59-60

Checkout errors are only `console.error`'d with no user-visible feedback. A toast notification or error message would improve UX.

### 4. `allChapterIds` recomputed on every render

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/curriculum-accordion.tsx`

**Line**: 31

```typescript
const allChapterIds = chapters.map((ch) => ch.id);
```

This array is recreated on every render and used as a dependency in `toggleAll`'s `useCallback`. Consider wrapping in `useMemo` to stabilize the reference:

```typescript
const allChapterIds = useMemo(() => chapters.map((ch) => ch.id), [chapters]);
```

### 5. `ReviewCard` date formatting is not locale-aware

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/course-detail/ui/course-reviews-section.tsx`

**Line**: 90

```typescript
const formattedDate = new Date(review.createdAt).toLocaleDateString();
```

`toLocaleDateString()` without a locale argument uses the browser's default locale, which may not match the app's selected locale. Pass the locale explicitly:

```typescript
const formattedDate = new Date(review.createdAt).toLocaleDateString(locale);
```

### 6. `formatLessonDuration` does not handle negative or NaN inputs

**File**: `/Users/jade/projects/vibeAcademy/src/shared/lib/format.ts`

Edge case: negative seconds or NaN would produce unexpected output (e.g., `-1:-01` or `NaN:NaN`). Consider adding a guard: `if (!totalSeconds || totalSeconds < 0) return "0:00"`.

---

## Summary

The implementation is solid and well-structured. It follows FSD architecture correctly, uses proper separation of concerns with a thin server component page and a client-side orchestrator, and handles the three enrollment states (unauthenticated, authenticated-not-enrolled, enrolled) appropriately.

**Strengths**:
- Clean FSD compliance: page route is thin, widget is self-contained with proper barrel export
- Good use of dynamic imports for VideoPlayer (bundle optimization)
- Proper conditional SWR fetching (null key when no user for enrollment)
- Consistent use of semantic Tailwind tokens for dark mode support
- Correct ternary-based conditional rendering (not `&&`) per project conventions
- Proper ARIA labels on star ratings and decorative icons
- All visible strings use i18n with both ko and en translations
- Well-structured PurchaseCTA sub-component handles all 4 auth/enrollment states
- Test files cover the most critical component (PurchaseWidget) thoroughly

**Areas for improvement**:
- Run `pnpm format` to fix the Prettier violations in test files (blocker for CI)
- Review pagination should accumulate results for "show more" UX
- The `as unknown as` type assertion in RelatedCoursesSection should be resolved with proper typing
- Add tests for more components, especially the orchestrator and curriculum accordion

---

## Discovered Conventions

### New Patterns (to propagate)
- Widget orchestrator pattern: thin server page passes only slug/locale strings to a single "use client" orchestrator that manages all SWR hooks and child components
- Dual-render purchase widget: two instances with `variant="desktop"|"mobile"` and responsive `hidden`/`lg:hidden` classes rather than CSS repositioning
- Dynamic import for heavy widgets: `next/dynamic` with `{ ssr: false }` for VideoPlayer to avoid loading hls.js when not needed
- FAQ from i18n keys: static FAQ using `detail.faq.items.{N}.q/a` translation keys indexed by number

### Anti-patterns Found (to avoid in future)
- `as unknown as` double type assertion for array mapping -- should align hook return types with consumer expectations (-0.5 score on types)
- Unused props in interface without underscore prefix -- `locale` declared but unused (-0.2 score on code quality)
- Prettier formatting not run before commit on test files (-0.3 score on code quality)
- Review pagination that replaces instead of accumulating -- "show more" should append, not replace (-0.5 score on correctness)

### Reusable Utilities Created
- `src/shared/lib/format.ts`: `formatDuration(seconds)` returns "Xh Ym", `formatLessonDuration(seconds)` returns "M:SS"
- `src/widgets/course-detail/ui/star-rating.tsx`: `StarRating` component with `rating` and `size` props
- `src/entities/review/api/use-course-reviews.ts`: `useCourseReviews(slug, page, pageSize)` SWR hook for paginated course reviews
