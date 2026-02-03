# Exploration Results: 관리자 라우트 그룹 + 강의 CRUD UI

> Task: task-018
> Explored at: 2026-02-03
> Dependencies: task-005 (Admin API Routes), task-006 (Entity layer stubs)

## 1. Admin API Routes (from task-005)

All routes use `requireAdmin()` guard from `@/shared/lib/api/admin-guard`. Response format: `{ success: true, data: T, message?: string }` or `{ success: false, error: { code, message, details? } }`.

### Endpoints

| Method | Route                                | Purpose                   | Validation Schema           |
| ------ | ------------------------------------ | ------------------------- | --------------------------- |
| POST   | `/api/admin/courses`                 | Create course             | `createCourseSchema`        |
| PATCH  | `/api/admin/courses/[id]`            | Update course             | `updateCourseSchema`        |
| DELETE | `/api/admin/courses/[id]`            | Delete course             | UUID param                  |
| POST   | `/api/admin/courses/[id]/chapters`   | Create chapter for course | `createChapterSchema`       |
| PATCH  | `/api/admin/courses/[id]/reorder`    | Reorder chapters+lessons  | `reorderSchema`             |
| PATCH  | `/api/admin/chapters/[id]`           | Update chapter            | `updateChapterSchema`       |
| DELETE | `/api/admin/chapters/[id]`           | Delete chapter            | UUID param                  |
| POST   | `/api/admin/chapters/[id]/lessons`   | Create lesson in chapter  | `createLessonSchema`        |
| PATCH  | `/api/admin/lessons/[id]`            | Update lesson             | `updateLessonSchema`        |
| DELETE | `/api/admin/lessons/[id]`            | Delete lesson             | UUID param                  |
| POST   | `/api/admin/lessons/[id]/upload-url` | Get presigned upload URL  | `uploadUrlSchema`           |
| GET    | `/api/admin/analytics`               | Dashboard stats           | `adminAnalyticsQuerySchema` |
| GET    | `/api/admin/users`                   | User list (paginated)     | `adminUserListQuerySchema`  |
| POST   | `/api/admin/coupons`                 | Create coupon             | `createCouponSchema`        |
| GET    | `/api/admin/coupons`                 | List coupons (paginated)  | `couponListQuerySchema`     |
| DELETE | `/api/admin/coupons/[id]`            | Delete coupon             | UUID param                  |

### MISSING: No GET endpoint for admin course listing

The admin API does NOT have a `GET /api/admin/courses` endpoint. The public `GET /api/courses` only returns published courses. **We need to either:**

1. Add a `GET /api/admin/courses` route that returns ALL courses (including unpublished), OR
2. Fetch course detail by using the public `GET /api/courses/[slug]` for existing courses (won't work for unpublished)

**Recommendation**: Add `GET /api/admin/courses` route returning all courses with chapter/lesson counts. Also need `GET /api/admin/courses/[id]` to fetch a single course with chapters+lessons for the edit form.

### Response Shapes

**POST /api/admin/courses response:**

```ts
{
  (id, title, slug, isPublished, createdAt);
}
```

**PATCH /api/admin/courses/[id] response:**

```ts
{
  (id, title, slug, isPublished, updatedAt);
}
```

**GET /api/admin/analytics response:**

```ts
{
  period: "7d" | "30d" | "90d" | "all",
  revenue: { total: number, count: number, average: number },
  enrollments: number,
  newUsers: number,
}
```

**Reorder schema (PATCH /api/admin/courses/[id]/reorder):**

```ts
{
  chapters: Array<{
    id: string (UUID),
    order: number,
    lessons?: Array<{ id: string (UUID), order: number }>
  }>
}
```

## 2. Validation Schemas (src/shared/lib/validations/admin.ts)

All schemas already exist and are exported from `@/shared/lib/validations`.

**createCourseSchema fields:**

- `title`: string 1-200 (required)
- `slug`: string 1-200, regex `/^[a-z0-9-]+$/` (required)
- `description`: string max 500 (optional)
- `longDescription`: string max 10000 (optional)
- `price`: int >= 0, default 0
- `level`: enum beginner|intermediate|advanced, default beginner
- `category`: string max 100 (optional)
- `thumbnailUrl`: URL (optional)
- `previewVideoUrl`: URL (optional)
- `instructorBio`: string max 2000 (optional)
- `isPublished`: boolean, default false
- `isFree`: boolean, default false

**createChapterSchema:** `{ title: string 1-200, order?: int >= 0 }`
**updateChapterSchema:** `{ title: string 1-200 }`

**createLessonSchema:** `{ title: string 1-200, description?: string max 2000, videoUrl?: string max 500, duration?: int >= 0, isPreview?: boolean (default false), order?: int >= 0 }`
**updateLessonSchema:** `{ title?, description?, videoUrl?, duration?, isPreview? }` (at least one field)

**reorderSchema:** `{ chapters: [{ id: UUID, order: int, lessons?: [{ id: UUID, order: int }] }] }`

## 3. Existing Admin Infrastructure

### Route Groups

Current locale groups:

- `(auth)` - Login, register, etc.
- `(dashboard)` - Protected user dashboard
- `(learn)` - Learning interface
- `(marketing)` - Public pages

**No `(admin)` route group exists yet.** Must be created.

### Middleware Protection

`/admin` is already in `PROTECTED_ROUTES` array in `src/middleware.ts` (line 9). This means:

- Unauthenticated users are redirected to `/login?redirectTo=/admin/...`
- Unverified-email users are redirected to `/verify-email`
- **BUT: middleware does NOT check admin role** - it only checks if user is authenticated
- Admin role check happens at API level via `requireAdmin()` in each API route

**For the admin route group layout**, we need a **client-side or server-side admin guard** that checks `role === "admin"` and redirects non-admin users. The API guard pattern (`requireAdmin`) uses:

```ts
// src/shared/lib/api/admin-guard.ts
const { dbUser } = await getDbUser(); // gets supabase user -> looks up DB user
if (dbUser.role !== "admin") return 403;
```

### Dashboard Layout Pattern (reference)

```tsx
// src/app/[locale]/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6">{children}</main>
    </div>
  );
}
```

## 4. UI Components Available (`@/shared/ui`)

### Form-Related (all shadcn/ui)

- `Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription` - react-hook-form integration
- `Input` - text input
- `Textarea` - multiline text
- `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` - dropdown select
- `Switch` - toggle boolean
- `Checkbox` - checkbox
- `Label` - form label
- `Button` - button with variants (default, secondary, ghost, destructive, outline, link)

### Layout/Display

- `Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter`
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger`
- `Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger`
- `Tabs, TabsList, TabsTrigger, TabsContent`
- `Badge` - status badges
- `Separator`
- `Accordion`
- `Progress`
- `Skeleton` - loading skeletons
- `Spinner, LoadingSpinner` - loading indicators
- `Avatar`
- `DropdownMenu` - dropdown menu

### NOT Available (may need to add)

- **Table** component - NOT in shared/ui. Must be added from shadcn or built manually.
- **AlertDialog** - NOT available. Dialog can be used instead.
- **Tooltip** - NOT available.

## 5. @dnd-kit Installation

Installed and available:

- `@dnd-kit/core`: ^6.3.1
- `@dnd-kit/sortable`: ^10.0.0 (newer API)
- `@dnd-kit/utilities`: ^3.2.2

### @dnd-kit/sortable v10 Exports

```ts
export { SortableContext } from "./components";
export { useSortable, defaultAnimateLayoutChanges, defaultNewIndexGetter } from "./hooks";
export {
  horizontalListSortingStrategy,
  rectSortingStrategy,
  rectSwappingStrategy,
  verticalListSortingStrategy,
} from "./strategies";
export { sortableKeyboardCoordinates } from "./sensors";
export { arrayMove, arraySwap } from "./utilities";
export { hasSortableData } from "./types";
```

## 6. i18n Keys

Both `ko` and `en` translation files have comprehensive admin keys at `admin.*`:

```
admin.title                          -> "관리자" / "Admin"
admin.dashboard.title                -> "관리자 대시보드"
admin.dashboard.totalCourses         -> "전체 강의"
admin.dashboard.totalStudents        -> "전체 수강생"
admin.dashboard.totalRevenue         -> "총 매출"
admin.dashboard.totalEnrollments     -> "총 등록"
admin.courses.title                  -> "강의 관리"
admin.courses.create                 -> "새 강의 만들기"
admin.courses.edit                   -> "강의 수정"
admin.courses.delete                 -> "강의 삭제"
admin.courses.deleteConfirm          -> "강의를 삭제하시겠습니까?..."
admin.courses.published              -> "공개"
admin.courses.unpublished            -> "비공개"
admin.courses.publish                -> "공개하기"
admin.courses.unpublish              -> "비공개하기"
admin.courses.form.title             -> "강의 제목"
admin.courses.form.slug              -> "URL 슬러그"
admin.courses.form.description       -> "강의 설명"
admin.courses.form.shortDescription  -> "짧은 설명"
admin.courses.form.category          -> "카테고리"
admin.courses.form.level             -> "난이도"
admin.courses.form.price             -> "가격"
admin.courses.form.thumbnailUrl      -> "썸네일 URL"
admin.courses.form.previewVideoUrl   -> "미리보기 영상 URL"
admin.chapters.title                 -> "챕터 관리"
admin.chapters.add                   -> "챕터 추가"
admin.chapters.edit                  -> "챕터 수정"
admin.chapters.delete                -> "챕터 삭제"
admin.chapters.reorder               -> "순서 변경"
admin.chapters.form.title            -> "챕터 제목"
admin.lessons.title                  -> "레슨 관리"
admin.lessons.add                    -> "레슨 추가"
admin.lessons.edit                   -> "레슨 수정"
admin.lessons.delete                 -> "레슨 삭제"
admin.lessons.isPreview              -> "미리보기 허용"
admin.lessons.form.title             -> "레슨 제목"
admin.lessons.form.videoUrl          -> "영상 URL"
admin.lessons.form.duration          -> "영상 길이 (초)"
admin.lessons.form.description       -> "레슨 설명 (MDX)"
```

## 7. Existing Patterns

### Form Pattern (react-hook-form + Zod)

Reference: `src/features/settings/profile/ui/profile-form.tsx`

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";

const schema = z.object({ ... });
type Values = z.infer<typeof schema>;

export function MyForm() {
  const t = useTranslations("namespace");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  });

  // Reset with fetched data
  useEffect(() => {
    if (data) form.reset({ ...data });
  }, [data, form]);

  return (
    <Card>
      <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField control={form.control} name="fieldName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### SWR Hook Pattern

Reference: `src/entities/course/api/use-courses.ts`

```tsx
"use client";
import useSWR from "swr";

export function useCourses(params?) {
  const { data, error, isLoading } = useSWR(key);
  return {
    courses: data?.data?.items ?? [],
    error,
    isLoading,
  };
}
```

SWR fetcher is globally configured in `SWRProvider` to call `fetch(url)` and parse JSON.

### Navigation Config Pattern

`src/shared/config/navigation.ts` already has `/admin` in `protectedRoutes`. The `dashboardNav` array defines nav items with `{ key, href, labelKey, icon?, children? }`. A similar `adminNav` array should be created.

### TopBar Reference

`src/widgets/top-bar/ui/top-bar.tsx` uses `dashboardNav` config + lucide icons + Sheet for mobile nav. The admin layout should have a similar sidebar/nav pattern.

## 8. DB Schema Summary

### courses

```
id (UUID PK), title, slug (unique), description?, longDescription?, price (int, default 0),
level (enum: beginner|intermediate|advanced), category?, thumbnailUrl?, previewVideoUrl?,
instructorBio?, isPublished (bool), isFree (bool), polarProductId?, createdAt, updatedAt
```

### chapters

```
id (UUID PK), courseId (FK -> courses ON DELETE CASCADE), title, order (int), createdAt
```

### lessons

```
id (UUID PK), chapterId (FK -> chapters ON DELETE CASCADE), title, description?,
videoUrl?, duration (int)?, isPreview (bool), order (int), createdAt
```

## 9. What Needs Building

### A. Missing API Endpoint (prerequisite)

- **GET /api/admin/courses** - List all courses (incl. unpublished) with chapter/lesson counts
- **GET /api/admin/courses/[id]** - Single course detail with nested chapters+lessons (for edit page)

### B. Admin Route Group

```
src/app/[locale]/(admin)/
  layout.tsx              <- Admin layout with sidebar nav, admin role guard
  admin/
    page.tsx              <- Dashboard (stats cards from analytics API)
    courses/
      page.tsx            <- Course list page
      new/
        page.tsx          <- Create course form
      [id]/
        page.tsx          <- Edit course + curriculum editor
```

### C. Admin Layout (`src/app/[locale]/(admin)/layout.tsx`)

- Server component with Supabase auth check + DB role check
- Sidebar nav with links: Dashboard, Courses, (future: Users, Analytics, Coupons)
- Use lucide icons: LayoutDashboard, BookOpen, Users, BarChart3, Tag
- Responsive: sidebar on desktop, sheet on mobile
- Reference dashboard layout but add sidebar

### D. Admin Dashboard Page

- Fetch from `GET /api/admin/analytics?period=30d`
- Display 4 stat cards: Total Revenue, Total Enrollments, New Users, Total Payments
- Use Card component with lucide icons
- Period selector (7d, 30d, 90d, all)

### E. Course List Page

- Fetch from `GET /api/admin/courses` (needs to be created)
- Display as table or card grid (no Table component exists, use div-based grid or add shadcn Table)
- Show: title, status badge (published/unpublished), level, price, category, created date
- Actions: Edit, Delete, Toggle publish
- "Create" button linking to `/admin/courses/new`
- **Need to add shadcn Table component** or use card-based list

### F. Course Create/Edit Form

- Uses `createCourseSchema` / `updateCourseSchema` from `@/shared/lib/validations`
- Form fields: title, slug (auto-generate from title), description, longDescription, price, level (Select), category (Select), thumbnailUrl, previewVideoUrl, instructorBio, isPublished (Switch), isFree (Switch)
- react-hook-form + zodResolver pattern
- On edit: prefill from fetched course data

### G. Curriculum Editor (chapters/lessons CRUD + DnD)

- Nested structure: chapters contain lessons
- Chapter CRUD: add/edit title/delete via Dialog
- Lesson CRUD: add/edit all fields/delete via Dialog or inline
- DnD reorder using @dnd-kit:
  - `DndContext` + `SortableContext` for chapters
  - Nested `SortableContext` for lessons within each chapter
  - `useSortable` hook per item
  - `arrayMove` utility for local state update
  - On drag end: call `PATCH /api/admin/courses/[id]/reorder` with new order
  - Use `verticalListSortingStrategy`
- GripVertical icon for drag handle

### H. Key Dependencies

| Package               | Version  | Purpose             |
| --------------------- | -------- | ------------------- |
| `@dnd-kit/core`       | ^6.3.1   | DnD foundation      |
| `@dnd-kit/sortable`   | ^10.0.0  | Sortable lists      |
| `@dnd-kit/utilities`  | ^3.2.2   | CSS utilities       |
| `react-hook-form`     | ^7.71.1  | Form state          |
| `@hookform/resolvers` | ^5.2.2   | Zod resolver        |
| `zod`                 | ^4.3.6   | Validation          |
| `swr`                 | ^2.0.0   | Data fetching       |
| `next-intl`           | ^4.7.0   | i18n                |
| `lucide-react`        | ^0.563.0 | Icons               |
| `sonner`              | ^2.0.7   | Toast notifications |

## 10. Recommended Implementation Order

1. **Add missing API routes** (GET courses list, GET single course with curriculum)
2. **Add shadcn Table component** to `@/shared/ui` (optional, could use card-based list)
3. **Create admin layout** with sidebar + role guard
4. **Create admin dashboard page** with analytics cards
5. **Create course list page** with actions
6. **Create course create form** page
7. **Create course edit page** with form + curriculum editor
8. **Build curriculum editor widget** with @dnd-kit DnD
9. **Add i18n keys** if any are missing (most exist already)

## 11. File Map (files to create/modify)

### New Files

```
src/app/[locale]/(admin)/layout.tsx
src/app/[locale]/(admin)/admin/page.tsx
src/app/[locale]/(admin)/admin/courses/page.tsx
src/app/[locale]/(admin)/admin/courses/new/page.tsx
src/app/[locale]/(admin)/admin/courses/[id]/page.tsx
src/widgets/admin-sidebar/index.ts
src/widgets/admin-sidebar/ui/admin-sidebar.tsx
src/features/admin/courses/ui/course-form.tsx
src/features/admin/courses/ui/course-list.tsx
src/features/admin/courses/model/use-admin-courses.ts
src/features/admin/courses/model/use-admin-course.ts
src/features/admin/courses/api/admin-courses.ts
src/features/admin/courses/index.ts
src/features/admin/dashboard/ui/admin-dashboard.tsx
src/features/admin/dashboard/ui/admin-stats-card.tsx
src/features/admin/dashboard/model/use-admin-analytics.ts
src/features/admin/dashboard/index.ts
src/widgets/curriculum-editor/index.ts
src/widgets/curriculum-editor/ui/curriculum-editor.tsx
src/widgets/curriculum-editor/ui/sortable-chapter.tsx
src/widgets/curriculum-editor/ui/sortable-lesson.tsx
src/widgets/curriculum-editor/ui/chapter-dialog.tsx
src/widgets/curriculum-editor/ui/lesson-dialog.tsx
src/widgets/curriculum-editor/model/use-curriculum.ts
```

### Files to Modify

```
src/app/api/admin/courses/route.ts          <- Add GET handler
src/app/api/admin/courses/[id]/route.ts     <- Add GET handler
src/shared/config/navigation.ts             <- Add adminNav array
src/shared/ui/index.ts                      <- Export Table if added
```

## 12. Conventions Reminder

| Item           | Convention                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| Filenames      | kebab-case                                                                              |
| Components     | PascalCase named exports                                                                |
| Form pattern   | react-hook-form + zodResolver + shadcn Form primitives                                  |
| Data fetching  | SWR hooks in entity/feature `api/` or `model/`                                          |
| i18n           | `useTranslations("admin.courses")` for client, `await getTranslations(...)` for server  |
| Icons          | lucide-react                                                                            |
| Links          | `import { Link } from "@/i18n/navigation"`                                              |
| Toast          | sonner `toast.success(...)` / `toast.error(...)`                                        |
| Dark mode      | Semantic tokens: bg-background, text-foreground, text-muted-foreground, bg-card, border |
| "use client"   | Required for components using hooks                                                     |
| Barrel exports | index.ts in each slice, export only public API                                          |
