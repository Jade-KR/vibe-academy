# Exploration Results: Admin Members/Revenue/Coupons UI

> Task: task-022
> Explored at: 2026-02-03
> Scope: /admin/users, /admin/analytics (Recharts), /admin/coupons (CRUD)

## What Already Exists

### Admin Infrastructure (from task-018)

- **Layout**: `/Users/jade/projects/vibeAcademy/src/app/[locale]/(admin)/layout.tsx` -- Server component, checks auth+admin role, wraps children in `<AdminShell>`
- **AdminShell**: `/Users/jade/projects/vibeAcademy/src/widgets/admin-sidebar/ui/admin-shell.tsx` -- Collapsible desktop sidebar + mobile Sheet, top header bar, theme/language switcher
- **Admin Nav Config**: `/Users/jade/projects/vibeAcademy/src/shared/config/navigation.ts` -- `adminNav` array with `LayoutDashboard` and `BookOpen` icons. Currently only 2 items: dashboard (`/admin`) and courses (`/admin/courses`). **Needs 3 new entries**: users, analytics, coupons.
- **Icon Map in AdminShell**: Lines 31-34 only map `LayoutDashboard` and `BookOpen`. **Needs new icon imports** for Users, BarChart3, Ticket (or similar).

### Admin API Routes (all exist, fully functional)

1. **GET /api/admin/users** -- `/Users/jade/projects/vibeAcademy/src/app/api/admin/users/route.ts` -- Paginated user list with search (email/name), role filter, enrollment count subquery. Returns `{items, total, page, pageSize, hasMore}`.
2. **GET /api/admin/analytics** -- `/Users/jade/projects/vibeAcademy/src/app/api/admin/analytics/route.ts` -- Period-filtered stats (7d/30d/90d/all). Returns `{period, revenue: {total, count, average}, enrollments, newUsers}`.
3. **GET /api/admin/coupons** -- `/Users/jade/projects/vibeAcademy/src/app/api/admin/coupons/route.ts` -- Paginated coupon list with courseName join. Returns `{items, total, page, pageSize, hasMore}`.
4. **POST /api/admin/coupons** -- Same file. Creates coupon (code uniqueness check, course validation). Uses `createCouponSchema`.
5. **DELETE /api/admin/coupons/[id]** -- `/Users/jade/projects/vibeAcademy/src/app/api/admin/coupons/[id]/route.ts` -- Deletes coupon by UUID.

### Admin Dashboard (exists but basic)

- `/Users/jade/projects/vibeAcademy/src/features/admin/dashboard/ui/admin-dashboard.tsx` -- Shows 4 stats cards (totalRevenue, totalEnrollments, newUsers, paymentCount) with period selector. **No Recharts chart yet**.
- `/Users/jade/projects/vibeAcademy/src/features/admin/dashboard/ui/admin-stats-card.tsx` -- Reusable card with icon, title, value, optional description.
- `/Users/jade/projects/vibeAcademy/src/features/admin/dashboard/model/use-admin-analytics.ts` -- SWR hook returning `AnalyticsData` type.

### DB Schemas

- **users**: `/Users/jade/projects/vibeAcademy/src/db/schema/users.ts` -- id, supabaseUserId, email, name, avatarUrl, role (user|admin), locale, createdAt, updatedAt
- **payments**: `/Users/jade/projects/vibeAcademy/src/db/schema/payments.ts` -- id, userId, polarPaymentId, amount, currency (KRW), status (pending|completed|failed|refunded), description, metadata, createdAt
- **coupons**: `/Users/jade/projects/vibeAcademy/src/db/schema/coupons.ts` -- id, code (unique), discount (int), discountType (fixed|percentage), courseId (FK nullable), maxUses, usedCount (default 0), expiresAt, createdAt
- **enrollments**: `/Users/jade/projects/vibeAcademy/src/db/schema/enrollments.ts` -- id, userId, courseId, paymentId, purchasedAt, expiresAt
- **enums**: `/Users/jade/projects/vibeAcademy/src/db/schema/enums.ts` -- userRoleEnum, paymentStatusEnum, discountTypeEnum, etc.

### Validation Schemas (all exist)

- `/Users/jade/projects/vibeAcademy/src/shared/lib/validations/admin.ts`:
  - `createCouponSchema` -- code (uppercase alphanumeric+hyphens), discount (int>=1), discountType (fixed|percentage), courseId (optional uuid), maxUses (optional int>=1), expiresAt (optional datetime). Refine: percentage max 100.
  - `couponListQuerySchema` -- page, pageSize with coerce
  - `adminUserListQuerySchema` -- page, pageSize, role (user|admin optional), search (optional)
  - `adminAnalyticsQuerySchema` -- period (7d|30d|90d|all, default 30d)

### i18n Keys (both ko and en exist)

All admin i18n keys are already defined under `admin.*`:

- `admin.users.*` -- title, search, email, name, joinedAt, enrolledCourses, manualEnroll, removeEnrollment
- `admin.analytics.*` -- title, daily, monthly, revenue, byCourse, payments, refunds
- `admin.coupons.*` -- title, create, delete, code, discountType, discountFixed, discountPercent, discountAmount, discountRate, validFrom, validUntil, maxUses, usedCount, appliesTo, allCourses, specificCourse

### Dependencies

- **recharts**: `^3.7.0` -- installed in package.json. **Not yet used anywhere in codebase**. No Recharts components exist.
- **date-fns**: NOT installed. Use `Intl.DateTimeFormat` or install if needed.
- **react-hook-form**: `^7.71.1` -- used extensively in course-form, auth forms
- **zod**: `^4.3.6` -- used everywhere

### Shared UI Components Available

From `/Users/jade/projects/vibeAcademy/src/shared/ui/index.ts`:
Button, Input, Card/CardContent/CardHeader/CardTitle, Dialog, DropdownMenu, Form (react-hook-form integration), Badge, Skeleton, Spinner, Label, Separator, Sheet, Tabs, Switch, Checkbox, Textarea, Select, Accordion, Progress, Avatar, LoadingSpinner, ErrorBoundary, SEO.

**No Table component exists.** Need to either build a simple table with HTML or add shadcn/ui Table component.

### Existing Patterns (reference for consistency)

- **Feature structure**: `src/features/admin/{feature-name}/{index.ts, ui/, model/}`
- **SWR hooks**: `useSWR("/api/admin/...")` returning `{data, error, isLoading, mutate}` -- see `use-admin-courses.ts` and `use-admin-analytics.ts`
- **Page files**: Thin wrappers importing from features: `import { Component } from "@/features/admin/..."` then `export default function Page() { return <Component />; }`
- **Translations**: `useTranslations("admin")` then `t("users.title")`, `t("coupons.code")` etc.
- **Delete pattern**: Dialog with confirm/cancel buttons, `toast.success`/`toast.error` via sonner
- **Currency formatting**: `new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount)`

---

## What Needs Building

### 1. Admin Navigation Updates

**File**: `/Users/jade/projects/vibeAcademy/src/shared/config/navigation.ts`

- Add 3 new items to `adminNav`: users (`/admin/users`), analytics (`/admin/analytics`), coupons (`/admin/coupons`)
- Label keys: `admin.users.title`, `admin.analytics.title`, `admin.coupons.title`
- Icons: `Users`, `BarChart3`, `Ticket`

**File**: `/Users/jade/projects/vibeAcademy/src/widgets/admin-sidebar/ui/admin-shell.tsx`

- Add `Users`, `BarChart3`, `Ticket` to lucide imports and `iconMap` (lines 31-34)

### 2. /admin/users -- User Management Page

**New page**: `src/app/[locale]/(admin)/admin/users/page.tsx`
**New feature**: `src/features/admin/users/`

- `index.ts` -- barrel export
- `model/use-admin-users.ts` -- SWR hook for GET /api/admin/users with search, pagination, role filter params
- `ui/user-list.tsx` -- Main component:
  - Search input (email/name), role filter dropdown (all/user/admin)
  - User table/list: avatar, name, email, role badge, joinedAt (formatted date), enrollmentCount
  - Pagination controls (page/pageSize from API)
  - Note: API only supports GET (list). No PATCH/DELETE user endpoints exist. "Manual enroll" and "remove enrollment" i18n keys exist but no API endpoints for those actions yet -- UI can include them as disabled/placeholder.

### 3. /admin/analytics -- Revenue Dashboard with Recharts

**New page**: `src/app/[locale]/(admin)/admin/analytics/page.tsx`
**Extend existing feature**: `src/features/admin/dashboard/` OR create new `src/features/admin/analytics/`

Recommended approach: Create a separate `src/features/admin/analytics/` feature since the dashboard page already exists and the analytics page is a distinct view.

- `index.ts` -- barrel export
- `model/use-admin-analytics.ts` -- Can reuse existing `useAdminAnalytics` from dashboard feature, or extend it
- `ui/analytics-dashboard.tsx` -- Main component:
  - Period selector (7d/30d/90d/all) -- same pattern as admin-dashboard.tsx
  - 4 stats cards (reuse AdminStatsCard from dashboard feature)
  - **Recharts area/bar chart** for revenue visualization
  - Note: Current analytics API returns aggregate numbers only (total, count, average). **No time-series data endpoint exists.** For a proper revenue chart, either:
    - (a) Add a new API endpoint returning daily/monthly revenue breakdown, OR
    - (b) Display aggregate stats with a simple visual representation
  - Given task scope, option (b) is more realistic for the UI task. Can show bar chart comparing revenue/enrollments/users as a summary chart, or a placeholder chart area.

### 4. /admin/coupons -- Coupon CRUD

**New page**: `src/app/[locale]/(admin)/admin/coupons/page.tsx`
**New feature**: `src/features/admin/coupons/`

- `index.ts` -- barrel export
- `model/use-admin-coupons.ts` -- SWR hook for GET /api/admin/coupons with pagination
- `ui/coupon-list.tsx` -- Main component:
  - Header with "Create Coupon" button
  - Coupon table: code, discountType badge, discount value, courseName (or "all courses"), maxUses, usedCount, expiresAt, createdAt, delete action
  - Pagination controls
  - Delete confirmation dialog (following course-list.tsx pattern)
- `ui/coupon-create-dialog.tsx` -- Dialog/form for creating coupons:
  - react-hook-form + zod (createCouponSchema)
  - Fields: code (text, uppercase), discount (number), discountType (select: fixed/percentage), courseId (optional select, needs courses list), maxUses (optional number), expiresAt (optional datetime input)
  - On submit: POST /api/admin/coupons, toast success/error, mutate list

### 5. Table Component (Optional)

No shadcn/ui Table component exists. Options:

- (a) Use plain HTML `<table>` with Tailwind styling (consistent with course-list.tsx which uses div-based grid)
- (b) Add shadcn/ui Table component via `npx shadcn@latest add table`
- Recommended: Follow the div-based grid pattern from course-list.tsx for consistency.

### 6. i18n Keys -- Additional Needed

Some additional keys may be needed:

- `admin.coupons.deleteConfirm` -- "Are you sure you want to delete this coupon?"
- `admin.coupons.created` -- "Coupon created"
- `admin.coupons.deleted` -- "Coupon deleted"
- `admin.coupons.createFailed` -- "Failed to create coupon"
- `admin.coupons.empty` -- "No coupons yet"
- `admin.coupons.noExpiry` -- "No expiry"
- `admin.coupons.unlimited` -- "Unlimited"
- `admin.users.empty` -- "No users found"
- `admin.users.role` -- "Role"
- `admin.users.allRoles` -- "All roles"
- `admin.analytics.noData` -- "No data for this period"
- `admin.analytics.chartTitle` -- "Revenue Overview"
- `common.previous` / `common.next` or `common.page` for pagination

---

## Directly Related Files

| File                                           | Role                                                |
| ---------------------------------------------- | --------------------------------------------------- |
| `src/app/[locale]/(admin)/layout.tsx`          | Admin layout (auth+role check, AdminShell wrapper)  |
| `src/widgets/admin-sidebar/ui/admin-shell.tsx` | Sidebar navigation, needs new icons in iconMap      |
| `src/shared/config/navigation.ts`              | adminNav array, needs 3 new entries                 |
| `src/app/api/admin/users/route.ts`             | Users GET endpoint (paginated, searchable)          |
| `src/app/api/admin/analytics/route.ts`         | Analytics GET endpoint (period-filtered aggregates) |
| `src/app/api/admin/coupons/route.ts`           | Coupons GET+POST endpoints                          |
| `src/app/api/admin/coupons/[id]/route.ts`      | Coupon DELETE endpoint                              |
| `src/shared/lib/validations/admin.ts`          | All Zod schemas for admin APIs                      |
| `src/db/schema/coupons.ts`                     | Coupon table schema                                 |
| `src/db/schema/users.ts`                       | User table schema                                   |
| `src/db/schema/payments.ts`                    | Payments table schema                               |

## Reference Pattern Files

| File                                                    | Pattern                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/admin/courses/ui/course-list.tsx`         | Table UI pattern with grid layout, delete dialog, toast, Badge usage |
| `src/features/admin/courses/model/use-admin-courses.ts` | SWR hook pattern for admin data fetching                             |
| `src/features/admin/dashboard/ui/admin-dashboard.tsx`   | Stats cards + period selector pattern                                |
| `src/features/admin/dashboard/ui/admin-stats-card.tsx`  | Reusable stat card component                                         |
| `src/features/admin/courses/ui/course-form.tsx`         | react-hook-form + zod form pattern                                   |
| `src/app/[locale]/(admin)/admin/courses/page.tsx`       | Thin page wrapper pattern                                            |

## Key Implementation Notes

1. **Recharts 3.x** is installed (`^3.7.0`) but never used. Import from `recharts` directly. Use `<ResponsiveContainer>`, `<AreaChart>` or `<BarChart>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, `<CartesianGrid>`.

2. **Analytics API limitation**: Current `/api/admin/analytics` returns only aggregate stats, not time-series. For a revenue chart, either extend the API to return daily breakdown or build a summary visualization with the aggregate data. A daily revenue breakdown endpoint would need `GROUP BY date_trunc('day', created_at)` on the payments table.

3. **No Table UI component**: Use div-based grid pattern (like course-list.tsx) or add shadcn Table.

4. **Pagination**: The API returns `{page, pageSize, hasMore, total}`. Build a simple prev/next pagination or page number selector.

5. **Icon mapping**: AdminShell uses a string-to-component `iconMap`. Every new icon must be: (a) imported from lucide-react, (b) added to the `iconMap` record, (c) referenced by string name in navigation config.

6. **Form for coupon creation**: Need a course selector dropdown. Can fetch courses via existing `/api/admin/courses` endpoint using `useAdminCourses` hook.
