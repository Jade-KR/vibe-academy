# Task-022: Admin User Management + Revenue Dashboard + Coupon Management UI

> Created: 2026-02-03
> Based on: exploration.md
> Estimated time: 5 hours

## Summary

Build three new admin pages: user management (search/filter/paginate), analytics dashboard (stat cards + Recharts bar chart), and coupon CRUD (list + create dialog + delete). All APIs already exist. Admin layout/shell from task-018 needs nav entries and icon mappings added.

## Applied Skills

### Scan Results

3 skills found (project: 3)

### Selected Skills

| Skill                       | Location | Reason                                                                                |
| --------------------------- | -------- | ------------------------------------------------------------------------------------- |
| vercel-react-best-practices | project  | SWR hooks, client component patterns, re-render optimization for list/form components |
| web-design-guidelines       | project  | Table layout, responsive grid, accessible dialog/form patterns                        |

### Excluded Skills

| Skill                            | Reason                                     |
| -------------------------------- | ------------------------------------------ |
| supabase-postgres-best-practices | No DB/query work -- all APIs already exist |

---

## Requirements

### Functional Requirements

- [ ] Admin sidebar shows 3 new nav items: Users, Analytics, Coupons
- [ ] `/admin/users` -- paginated user list with search (email/name) and role filter (all/user/admin)
- [ ] `/admin/analytics` -- stat cards (revenue, enrollments, users, payments) with period selector + Recharts bar chart
- [ ] `/admin/coupons` -- paginated coupon list with create dialog and delete confirmation
- [ ] All text uses i18n keys from `admin.*` namespace

### Non-functional Requirements

- [ ] Responsive: mobile stacks to single column, desktop uses grid
- [ ] Loading skeletons for all data-fetching states
- [ ] Empty states for zero-result scenarios
- [ ] Toast notifications for create/delete actions (sonner)

---

## Architecture

### New Files Overview

```
src/shared/config/navigation.ts           -- ADD 3 entries to adminNav
src/widgets/admin-sidebar/ui/admin-shell.tsx -- ADD 3 icons to iconMap

src/features/admin/users/
  index.ts                                 -- barrel export
  model/use-admin-users.ts                 -- SWR hook (search, role, page params)
  ui/user-list.tsx                         -- main page component

src/features/admin/analytics/
  index.ts                                 -- barrel export
  ui/analytics-dashboard.tsx               -- stat cards + Recharts chart

src/features/admin/coupons/
  index.ts                                 -- barrel export
  model/use-admin-coupons.ts               -- SWR hook (page params)
  ui/coupon-list.tsx                       -- list + pagination + delete dialog
  ui/coupon-create-dialog.tsx              -- react-hook-form + zod dialog

src/app/[locale]/(admin)/admin/users/page.tsx
src/app/[locale]/(admin)/admin/analytics/page.tsx
src/app/[locale]/(admin)/admin/coupons/page.tsx

public/locales/ko/common.json             -- ADD missing i18n keys
public/locales/en/common.json             -- ADD missing i18n keys
```

### Component Relationships

```
AdminShell (sidebar)
  |-- adminNav (3 new items: users, analytics, coupons)
  |-- iconMap (3 new icons: Users, BarChart3, Ticket)

/admin/users/page.tsx
  └── UserList (from features/admin/users)
        ├── useAdminUsers(search, role, page) -- SWR
        ├── Search Input + Role Select filter bar
        ├── Div-based grid table (avatar, name, email, role badge, joinedAt, enrollmentCount)
        ├── Pagination (prev/next buttons)
        └── Loading skeletons + empty state

/admin/analytics/page.tsx
  └── AnalyticsDashboard (from features/admin/analytics)
        ├── useAdminAnalytics(period) -- reuse from dashboard feature
        ├── Period selector (7d/30d/90d/all)
        ├── 4x AdminStatsCard -- reuse from dashboard feature
        └── Recharts BarChart (revenue, enrollments, users, payments as 4 bars)

/admin/coupons/page.tsx
  └── CouponList (from features/admin/coupons)
        ├── useAdminCoupons(page) -- SWR
        ├── Header with CouponCreateDialog trigger button
        ├── Div-based grid table (code, type badge, discount, courseName, maxUses, usedCount, expiresAt, delete)
        ├── Pagination (prev/next buttons)
        ├── Delete confirmation dialog
        └── CouponCreateDialog
              ├── react-hook-form + zodResolver(createCouponSchema)
              ├── Fields: code, discount, discountType, courseId (select), maxUses, expiresAt
              └── useAdminCourses() for course selector dropdown
```

---

## Implementation Plan

### Phase 1: Navigation + Infrastructure (30 min)

**Goal**: Wire up sidebar navigation so all 3 new pages are reachable.

**Files to modify**:

1. **`/Users/jade/projects/vibeAcademy/src/shared/config/navigation.ts`**
   - Add 3 items to `adminNav` array after existing `admin-courses` entry:
     ```ts
     { key: "admin-users", href: "/admin/users", labelKey: "admin.users.title", icon: "Users" },
     { key: "admin-analytics", href: "/admin/analytics", labelKey: "admin.analytics.title", icon: "BarChart3" },
     { key: "admin-coupons", href: "/admin/coupons", labelKey: "admin.coupons.title", icon: "Ticket" },
     ```

2. **`/Users/jade/projects/vibeAcademy/src/widgets/admin-sidebar/ui/admin-shell.tsx`**
   - Add imports: `Users, BarChart3, Ticket` from `lucide-react`
   - Add to `iconMap`: `Users`, `BarChart3`, `Ticket`

3. **i18n keys** -- Add missing keys to both `ko/common.json` and `en/common.json`:
   ```
   admin.users.role          -> "역할" / "Role"
   admin.users.allRoles      -> "전체" / "All"
   admin.users.empty         -> "등록된 회원이 없습니다" / "No users found"
   admin.coupons.deleteConfirm -> "이 쿠폰을 삭제하시겠습니까?" / "Are you sure you want to delete this coupon?"
   admin.coupons.created     -> "쿠폰이 생성되었습니다" / "Coupon created"
   admin.coupons.deleted     -> "쿠폰이 삭제되었습니다" / "Coupon deleted"
   admin.coupons.createFailed -> "쿠폰 생성에 실패했습니다" / "Failed to create coupon"
   admin.coupons.empty       -> "등록된 쿠폰이 없습니다" / "No coupons yet"
   admin.coupons.noExpiry    -> "만료 없음" / "No expiry"
   admin.coupons.unlimited   -> "무제한" / "Unlimited"
   admin.analytics.summary   -> "요약" / "Summary"
   admin.analytics.noData    -> "데이터가 없습니다" / "No data"
   common.previous           -> "이전" / "Previous"
   common.page               -> "{current} / {total}" / "{current} / {total}"
   ```

**Verification**: Dev server loads, sidebar shows 5 items (dashboard, courses, users, analytics, coupons). Clicking each navigates without error (404 page is fine at this stage).

---

### Phase 2: User Management Page (1.5 hours)

**Goal**: Searchable, filterable, paginated user list.

**New files**:

1. **`/Users/jade/projects/vibeAcademy/src/features/admin/users/model/use-admin-users.ts`**
   - SWR hook signature: `useAdminUsers(params: { search?: string; role?: string; page?: number; pageSize?: number })`
   - Build query string from params, skip empty values
   - SWR key: `/api/admin/users?page=1&pageSize=20&search=...&role=...`
   - Return: `{ users, total, page, pageSize, hasMore, error, isLoading, mutate }`
   - Type: `AdminUserSummary { id, email, name, avatarUrl, role, createdAt, enrollmentCount }`

2. **`/Users/jade/projects/vibeAcademy/src/features/admin/users/ui/user-list.tsx`**
   - `"use client"` component
   - State: `search` (string, debounced 300ms with useRef/setTimeout), `role` (string | undefined), `page` (number, default 1)
   - Reset page to 1 when search or role changes
   - **Filter bar**: `<Input>` for search (placeholder = `t("users.search")`), `<Select>` for role filter (all / user / admin)
   - **Grid table** (same div-based pattern as `course-list.tsx`):
     - Header row (hidden on mobile): Name, Email, Role, Joined, Enrolled Courses
     - Data rows: Avatar (32x32 circle, fallback initials via `<div>`), name, email, role `<Badge>`, formatted date (`Intl.DateTimeFormat`), enrollment count
     - Mobile: stack layout showing name + email + role badge
   - **Pagination**: prev/next `<Button>` with disabled states, page indicator `common.page`
   - **Loading**: 5 skeleton rows
   - **Empty state**: `t("users.empty")`
   - No delete/edit actions (no API endpoints exist for user mutation)

3. **`/Users/jade/projects/vibeAcademy/src/features/admin/users/index.ts`**
   - Export `UserList`, `useAdminUsers`, `AdminUserSummary`

4. **`/Users/jade/projects/vibeAcademy/src/app/[locale]/(admin)/admin/users/page.tsx`**
   - Thin wrapper: `import { UserList } from "@/features/admin/users"; export default function AdminUsersPage() { return <UserList />; }`

**Key patterns**:

- Debounce search input to avoid excessive API calls. Use a local `inputValue` state for immediate UI, and a `debouncedSearch` state that updates after 300ms delay. The SWR hook uses `debouncedSearch`.
- Date formatting: `new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(createdAt))`. Get locale from next-intl `useLocale()`.

**Verification**: Navigate to `/admin/users`. Type in search box -- list filters after 300ms. Change role dropdown -- list filters. Click next/prev -- pagination works.

---

### Phase 3: Analytics Dashboard with Recharts (1.5 hours)

**Goal**: Stat cards + bar chart showing aggregate data visually.

**New files**:

1. **`/Users/jade/projects/vibeAcademy/src/features/admin/analytics/ui/analytics-dashboard.tsx`**
   - `"use client"` component
   - Reuse `useAdminAnalytics` from `@/features/admin/dashboard` (already exported)
   - Reuse `AdminStatsCard` from `@/features/admin/dashboard` (already exported)
   - State: `period` (default "30d")
   - **Layout**:
     - Title + period selector (same pattern as `admin-dashboard.tsx`)
     - 4x stat cards in responsive grid (same as dashboard, but also include `description` prop for average payment)
     - **Recharts BarChart** inside a `<Card>`:
       - Title: `t("analytics.summary")`
       - Data: Transform analytics aggregates into chart data array:
         ```ts
         const chartData = [
           { name: t("analytics.revenue"), value: analytics.revenue.total },
           { name: t("analytics.payments"), value: analytics.revenue.count },
           { name: t("dashboard.totalEnrollments"), value: analytics.enrollments },
           { name: t("dashboard.totalStudents"), value: analytics.newUsers },
         ];
         ```
       - Note: Since all values are on very different scales (revenue in KRW thousands vs counts in single digits), use **two separate charts** or normalize. Better approach: **Show revenue in its own BarChart, and counts (payments, enrollments, users) in a second BarChart.** This avoids the scale problem.
       - **Chart 1** - Revenue: Single bar showing total revenue. Use `<BarChart>` with `<Bar>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, `<CartesianGrid>`. Format Y-axis and tooltip with KRW currency formatter.
       - **Chart 2** - Activity: Three bars (payments, enrollments, new users) side by side. Simple integer Y-axis.
       - Both wrapped in `<ResponsiveContainer width="100%" height={300}>`.
       - Use `hsl(var(--primary))` for bar fill to respect theme. Secondary bars use `hsl(var(--muted-foreground))`.
   - **Loading**: Skeleton for cards + skeleton rectangle for chart area
   - **Empty/zero state**: If all values are 0, show `t("analytics.noData")` in chart area

2. **`/Users/jade/projects/vibeAcademy/src/features/admin/analytics/index.ts`**
   - Export `AnalyticsDashboard`

3. **`/Users/jade/projects/vibeAcademy/src/app/[locale]/(admin)/admin/analytics/page.tsx`**
   - Thin wrapper importing `AnalyticsDashboard`

**Recharts import pattern** (Recharts 3.x):

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
```

**Recharts + dark mode**: Use CSS variables for colors. The Tooltip needs explicit `contentStyle` for dark mode:

```tsx
<Tooltip
  contentStyle={{
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
  }}
  labelStyle={{ color: "hsl(var(--foreground))" }}
/>
```

**bundle-dynamic-imports** (from vercel-react skill): Since Recharts is a heavy library (~200KB), wrap the chart section with `next/dynamic`:

```tsx
import dynamic from "next/dynamic";
const RevenueChart = dynamic(() => import("./revenue-chart"), { ssr: false });
```

This means the chart components should be in separate files:

- `ui/revenue-chart.tsx` -- Revenue bar chart (default export)
- `ui/activity-chart.tsx` -- Activity bar chart (default export)

Both accept `data` and `isLoading` props, keeping the dynamic import boundary clean.

**Verification**: Navigate to `/admin/analytics`. Period buttons toggle data. Charts render with correct data. Dark mode shows proper chart colors.

---

### Phase 4: Coupon Management (1.5 hours)

**Goal**: Coupon list with create dialog and delete confirmation.

**New files**:

1. **`/Users/jade/projects/vibeAcademy/src/features/admin/coupons/model/use-admin-coupons.ts`**
   - SWR hook: `useAdminCoupons(page: number = 1, pageSize: number = 20)`
   - SWR key: `/api/admin/coupons?page=${page}&pageSize=${pageSize}`
   - Return: `{ coupons, total, page, pageSize, hasMore, error, isLoading, mutate }`
   - Type: `AdminCouponSummary { id, code, discount, discountType, courseId, courseName, maxUses, usedCount, expiresAt, createdAt }`

2. **`/Users/jade/projects/vibeAcademy/src/features/admin/coupons/ui/coupon-list.tsx`**
   - `"use client"` component
   - State: `page`, `deleteId`, `deleting`
   - **Header**: Title + `<CouponCreateDialog>` trigger button (Plus icon + `t("coupons.create")`)
   - **Grid table** (div-based, same pattern as `course-list.tsx`):
     - Header row: Code, Type, Discount, Applies To, Max Uses, Used, Expires, Actions
     - Data rows:
       - code: monospace font (`font-mono`)
       - discountType: `<Badge>` with `t("coupons.discountFixed")` or `t("coupons.discountPercent")`
       - discount: formatted as currency (fixed) or `{discount}%` (percentage)
       - courseName: `courseName ?? t("coupons.allCourses")`
       - maxUses: `maxUses ?? t("coupons.unlimited")`
       - usedCount: number
       - expiresAt: formatted date or `t("coupons.noExpiry")`
       - Actions: delete button (Trash2 icon)
     - Mobile: stack layout with key info (code, discount, courseName)
   - **Delete handler**: `DELETE /api/admin/coupons/${id}`, toast success/error, `mutate()`
   - **Delete dialog**: Same pattern as `course-list.tsx` -- `Dialog` with confirm/cancel
   - **Pagination**: prev/next with page indicator
   - **Loading/empty states**: Same pattern as user list

3. **`/Users/jade/projects/vibeAcademy/src/features/admin/coupons/ui/coupon-create-dialog.tsx`**
   - `"use client"` component
   - Props: `{ onSuccess: () => void }` (called after successful creation to trigger `mutate`)
   - State: `open` (dialog visibility)
   - **Form**: `react-hook-form` + `zodResolver(createCouponSchema)`
   - Default values: `{ code: "", discount: 0, discountType: "fixed", courseId: null, maxUses: null, expiresAt: null }`
   - **Fields**:
     - code: `<Input>` with uppercase transform (`onChange` converts to uppercase)
     - discount: `<Input type="number" min={1}>`
     - discountType: `<Select>` with fixed/percentage options
     - courseId: `<Select>` with "All courses" default + course options from `useAdminCourses()`. Only show course title. Value is course UUID or empty string for null.
     - maxUses: `<Input type="number" min={1}>` (optional, leave empty for unlimited)
     - expiresAt: `<Input type="datetime-local">` (optional)
   - **Submit**: `POST /api/admin/coupons`, handle success/error with toast, close dialog, call `onSuccess`, reset form
   - Use `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` pattern from `course-form.tsx`

4. **`/Users/jade/projects/vibeAcademy/src/features/admin/coupons/index.ts`**
   - Export `CouponList`, `useAdminCoupons`, `AdminCouponSummary`

5. **`/Users/jade/projects/vibeAcademy/src/app/[locale]/(admin)/admin/coupons/page.tsx`**
   - Thin wrapper importing `CouponList`

**Key patterns for coupon form**:

- The `zodResolver` type mismatch with `react-hook-form` + `zod v4` requires casting: `resolver: zodResolver(createCouponSchema) as any` (same pattern as `course-form.tsx`)
- Convert empty optional fields to `null` before submit (courseId, maxUses, expiresAt)
- Reset form on dialog close to clear stale state

**Verification**: Navigate to `/admin/coupons`. Click "Create Coupon" -- dialog opens with form. Fill in fields, submit -- coupon appears in list. Click delete -- confirmation dialog, confirm -- coupon removed. Pagination works.

---

## i18n Keys to Add

### Korean (`public/locales/ko/common.json`)

Add inside `admin.users`:

```json
"role": "역할",
"allRoles": "전체",
"empty": "등록된 회원이 없습니다"
```

Add inside `admin.coupons`:

```json
"deleteConfirm": "이 쿠폰을 삭제하시겠습니까?",
"created": "쿠폰이 생성되었습니다",
"deleted": "쿠폰이 삭제되었습니다",
"createFailed": "쿠폰 생성에 실패했습니다",
"empty": "등록된 쿠폰이 없습니다",
"noExpiry": "만료 없음",
"unlimited": "무제한"
```

Add inside `admin.analytics`:

```json
"summary": "요약",
"noData": "데이터가 없습니다"
```

Add inside `common`:

```json
"previous": "이전",
"page": "{current} / {total}"
```

### English (`public/locales/en/common.json`)

Mirror structure with English values: "Role", "All", "No users found", "Are you sure you want to delete this coupon?", "Coupon created", "Coupon deleted", "Failed to create coupon", "No coupons yet", "No expiry", "Unlimited", "Summary", "No data", "Previous", "{current} / {total}".

---

## Risks

| Risk                                     | Impact | Mitigation                                                           |
| ---------------------------------------- | ------ | -------------------------------------------------------------------- |
| Recharts SSR issues                      | Medium | Use `next/dynamic` with `ssr: false`                                 |
| Recharts dark mode colors                | Low    | Use CSS variables `hsl(var(--...))`                                  |
| Analytics API has no time-series data    | Low    | Use aggregate data in summary bar charts instead of line/area charts |
| zod v4 + react-hook-form type mismatch   | Low    | Cast zodResolver as any (existing pattern in codebase)               |
| Search input causing excessive API calls | Low    | Debounce 300ms                                                       |

---

## Completion Criteria

- [ ] All 3 admin pages render without errors
- [ ] Sidebar navigation updated with 3 new items + icons
- [ ] User list: search, role filter, pagination all functional
- [ ] Analytics: stat cards + Recharts charts render with period switching
- [ ] Coupons: list with pagination, create dialog with form validation, delete with confirmation
- [ ] i18n: all text uses translation keys, both ko and en
- [ ] Responsive: mobile layout degrades gracefully (stacked columns)
- [ ] Loading states: skeletons shown during data fetch
- [ ] Dark mode: charts and all UI elements respect theme
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No lint errors (`pnpm lint`)
