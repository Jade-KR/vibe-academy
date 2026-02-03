# Review: Task-022 -- Admin User Management + Revenue Dashboard + Coupon Management UI

**Reviewer**: Claude Opus 4.5
**Date**: 2026-02-03
**Branch**: feature/task-022
**Files changed**: 18 files (+1,047, -6)

---

## Overall Score: 8.2 / 10

**Verdict: PASS**

---

## Aspect Scores

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness | 30% | 8.5 | 2.55 |
| Security | 20% | 8.0 | 1.60 |
| Architecture | 20% | 9.0 | 1.80 |
| Code quality | 15% | 8.0 | 1.20 |
| Test coverage | 15% | 7.0 | 1.05 |
| **Total** | **100%** | | **8.20** |

---

## 1. Comments

**Score: 7.5/10**

Good:
- JSX comments are used to label sections within render blocks (e.g., `{/* Header */}`, `{/* Filter bar */}`, `{/* Loading state */}`)
- The `zodResolver` cast has an explanatory comment explaining the upstream type mismatch reason (line 46-48 in `coupon-create-dialog.tsx`)
- Cleanup timer has a descriptive comment in `user-list.tsx` (line 53)

Suggestions:
- The `formatCurrency` function is duplicated in `analytics-dashboard.tsx` (line 16) and `revenue-chart.tsx` (line 11) and `coupon-list.tsx` (line 22). A brief comment acknowledging the intentional duplication (or preferably extracting to shared) would help future maintainers.
- `getInitials` helper in `user-list.tsx` (line 20) has no documentation -- adding a brief JSDoc would be valuable since it handles a null-name edge case.

---

## 2. Tests

**Score: 7.0/10**

Good:
- This is an admin panel feature with medium priority, so lowered test expectations are reasonable per the review instructions.

Issues:
- **No tests were added for any of the 3 new features** (users, analytics, coupons). The existing codebase has tests for comparable admin features (`course-list.test.tsx`, `course-form.test.tsx`), establishing a clear pattern that should be followed.
- At minimum, basic render tests for loading/empty/data states should exist for `UserList`, `CouponList`, and `AnalyticsDashboard`, following the exact same mock pattern as `course-list.test.tsx`.

Impact: Since the note says "test coverage expectations are lower than core features, but basic tests should exist," the complete absence of tests is notable but not a blocker for an admin UI feature.

---

## 3. Errors

**Score: 8.5/10**

Good:
- `coupon-create-dialog.tsx`: Proper try-catch with toast error messages on both API error and network error (lines 59-85)
- `coupon-list.tsx`: Delete handler has try-catch with toast feedback and proper `finally` block for cleanup (lines 44-61)
- Both use the standard response format check (`json.success`) before proceeding
- Loading states with skeletons prevent rendering issues during data fetch
- Empty states handle zero-result scenarios gracefully

Suggestions:
- **`coupon-create-dialog.tsx` line 69**: The `fetch` call does not check `res.ok` before calling `res.json()`. If the server returns a non-JSON response (e.g., 500 HTML error page), `res.json()` will throw and land in the catch block, which is acceptable but less informative. Consider checking `res.ok` first for cleaner error handling.
- **`coupon-list.tsx` line 49**: Same pattern -- no `res.ok` check before `res.json()`.

---

## 4. Types

**Score: 8.0/10**

Good:
- `AdminUserSummary` and `AdminCouponSummary` interfaces are well-defined with proper nullable types (`string | null` for optional fields)
- `CouponFormValues` is inferred from the Zod schema using `z.infer<typeof createCouponSchema>`, maintaining a single source of truth
- `ActivityChartProps` and `RevenueChartProps` interfaces are explicit and clean
- The `UseAdminUsersParams` interface properly types optional parameters
- The `zodResolver` cast to `any` is properly documented with an eslint-disable comment explaining the known upstream issue

Issues:
- **SWR hook return types use type assertions** (`as AdminCouponSummary[]`, `as number`, `as boolean`) in `use-admin-coupons.ts` (lines 15-23) and `use-admin-users.ts` (lines 31-39). These assertions bypass type safety. A generic SWR response type or a runtime validation would be safer, but this is consistent with the existing codebase pattern.
- `user-list.tsx` line 4-5: `useTranslations` and `useLocale` are imported from separate lines of `next-intl` -- minor, but could be consolidated into one import statement.

---

## 5. Code

**Score: 8.5/10**

Good:
- **DRY**: Reuses `useAdminAnalytics` and `AdminStatsCard` from `@/features/admin/dashboard` instead of reimplementing
- **Single responsibility**: Each file has a clear, focused purpose. Chart components are split into separate files (`revenue-chart.tsx`, `activity-chart.tsx`) for clean dynamic import boundaries
- **Debounce pattern**: Well-implemented with `useRef` + `useCallback` + cleanup effect in `user-list.tsx`
- **Consistent patterns**: Pagination, loading skeletons, empty states, and grid table patterns are consistent across all three features and match the existing `course-list.tsx` pattern
- **Dynamic imports**: Recharts is loaded via `next/dynamic` with `ssr: false` to avoid SSR issues and reduce initial bundle size (analytics-dashboard.tsx lines 11-12)
- **Form reset on dialog close**: `handleOpenChange` properly resets the form when the dialog closes (coupon-create-dialog.tsx lines 88-93)

Issues:
- **`formatCurrency` is duplicated** in three files: `analytics-dashboard.tsx`, `revenue-chart.tsx`, and `coupon-list.tsx` (as `formatPrice`). This should be extracted to `@/shared/lib/format.ts` or similar. Not a blocker but violates DRY.
- **`cn()` import is unused in practice**: In `analytics-dashboard.tsx` line 8, `cn` is imported and used only once at line 57 wrapping a single static string `cn("min-w-[48px]")`. This is unnecessary -- a plain string would suffice.

---

## 6. Security

**Score: 8.0/10**

Good:
- All API calls go through existing authenticated admin API routes (no direct DB access)
- Coupon code is uppercased on input (line 118 in coupon-create-dialog.tsx), which helps normalize input
- Delete operations use a confirmation dialog preventing accidental deletion
- No sensitive data is exposed in client-side code
- Form validation is handled by Zod schema before submission

Suggestions:
- **`user-list.tsx` line 140**: The `<img src={user.avatarUrl}>` renders a user-provided URL directly. While this is an admin-only page and the URL comes from the API, using `next/image` with configured domains would add an extra layer of safety and performance (noted as a lint warning too: `@next/next/no-img-element`).
- Rate limiting on the search input is handled by debouncing (good), but there is no client-side sanitization of the search query beyond what the API provides.

---

## 7. Convention Compliance

**Skipped** -- `.solo/conventions.md` does not exist.

---

## Detailed Findings

### Positive Highlights

1. **Excellent FSD adherence**: All new code follows the Feature-Sliced Design pattern precisely. Features are in `src/features/admin/{users,analytics,coupons}/`, pages are thin wrappers in `src/app/`, and shared components come from `@/shared/ui`.

2. **Proper i18n coverage**: All user-facing text uses translation keys. Both `ko` and `en` locale files are updated. The `tCommon("page", { current, total })` pattern with ICU message format parameters is well-done.

3. **Responsive design**: All three features degrade gracefully on mobile with `hidden md:grid` / `md:hidden` patterns, single-column stacking, and inline badges for compact mobile display.

4. **Smart code reuse**: The analytics dashboard reuses `useAdminAnalytics` and `AdminStatsCard` from the existing dashboard feature, and the coupon form reuses `useAdminCourses` from the courses feature.

5. **Performance-conscious**: Recharts is dynamically imported with SSR disabled, preventing bundle bloat on initial page load.

### Issues Found

| # | Severity | File | Line | Issue |
|---|----------|------|------|-------|
| 1 | Low | `user-list.tsx` | 140 | Uses `<img>` instead of `next/image` (lint warning, minor security/perf) |
| 2 | Low | `analytics-dashboard.tsx`, `revenue-chart.tsx`, `coupon-list.tsx` | various | `formatCurrency`/`formatPrice` duplicated across 3 files |
| 3 | Low | `analytics-dashboard.tsx` | 8, 57 | `cn()` import is unnecessary -- wraps a single static class string |
| 4 | Info | `coupon-create-dialog.tsx` | 69 | No `res.ok` check before `res.json()` |
| 5 | Info | `coupon-list.tsx` | 49 | No `res.ok` check before `res.json()` |
| 6 | Info | N/A | N/A | No unit tests added for the 3 new feature components |
| 7 | Info | `user-list.tsx` | 101-102 | Role filter options "User" and "Admin" are hardcoded in English, not using i18n keys |

### TypeScript / Lint Status

- **typecheck**: Pre-existing errors only (in `.next/dev/types`, test files, validations). No new TypeScript errors introduced by this task.
- **lint**: One new warning in `src/features/admin/users/ui/user-list.tsx` line 140 (`@next/next/no-img-element`). All other errors/warnings are pre-existing.

---

## Discovered Conventions

### New Patterns (to propagate)
- Admin list pages use div-based grid tables with `hidden md:grid` responsive pattern: header row hidden on mobile, data rows stack to single column
- Pagination follows a shared pattern: prev/next Buttons with `tCommon("previous")` / `tCommon("next")` and `tCommon("page", { current, total })` page indicator
- SWR hooks for admin features return `{ items, total, page, pageSize, hasMore, error, isLoading, mutate }` with type assertions from `data?.data?.{field}`
- Heavy chart libraries (Recharts) should be loaded via `next/dynamic` with `ssr: false` and split into separate files for clean code-split boundaries
- Dialog forms use `handleOpenChange` pattern that resets form on close to clear stale state

### Anti-patterns Found (to avoid in future)
- Duplicated `formatCurrency` utility across multiple files instead of extracting to `@/shared/lib/format.ts` (-0.3 code quality)
- Role filter options hardcoded in English ("User", "Admin") instead of using i18n keys (-0.2 correctness)
- Using `cn()` to wrap a single static class string provides no value (-0.1 code quality)

### Reusable Utilities Created
- `src/features/admin/users/model/use-admin-users.ts`: `useAdminUsers(params)` -- SWR hook for paginated user search with role filter
- `src/features/admin/coupons/model/use-admin-coupons.ts`: `useAdminCoupons(page, pageSize)` -- SWR hook for paginated coupon list
- `src/features/admin/analytics/ui/revenue-chart.tsx`: Themed Recharts BarChart for currency data with KRW formatting
- `src/features/admin/analytics/ui/activity-chart.tsx`: Themed Recharts BarChart for count-based metrics

---

*Solo Workflow Plugin v2.6 - Auto review passed*
