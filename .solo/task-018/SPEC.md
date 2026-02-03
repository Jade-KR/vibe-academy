# Task-018: Admin Route Group + Course CRUD UI

> Created: 2026-02-03
> Based on: exploration.md
> Dependencies: task-005 (Admin API Routes), task-006 (Entity layer stubs)
> Estimated time: 8-10 hours

## Objective

Build the `(admin)` route group with a full admin dashboard and course management interface. This includes admin-only layout with role guard, dashboard analytics cards, course CRUD pages (list/create/edit), and a curriculum editor with drag-and-drop chapter/lesson reordering using @dnd-kit.

## Applied Skills

### Scan Results

3 skills found (project: 3, user: 0, default: 0)

### Selected Skills

| Skill                       | Location | Reason                                                                                            |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| vercel-react-best-practices | project  | Forms, SWR data fetching, component composition, bundle optimization with dynamic imports for DnD |
| web-design-guidelines       | project  | Admin UI layout, accessibility, responsive sidebar pattern                                        |

### Excluded Skills

| Skill                            | Reason                                                       |
| -------------------------------- | ------------------------------------------------------------ |
| supabase-postgres-best-practices | No DB schema changes; API routes already exist from task-005 |

---

## Architecture

### Route Structure

```
src/app/[locale]/(admin)/
  layout.tsx                          # Server component: admin role guard + admin shell
  admin/
    page.tsx                          # Dashboard with analytics stat cards
    courses/
      page.tsx                        # Course list (all statuses)
      new/
        page.tsx                      # Course creation form
      [id]/
        page.tsx                      # Course edit + curriculum editor
```

### Component Architecture

```
(admin)/layout.tsx  [SERVER]
  -> AdminShell (client) [sidebar nav + mobile sheet + top bar]
       |
       +-- /admin (page)
       |     -> AdminDashboard (client) [SWR: GET /api/admin/analytics]
       |          -> AdminStatsCard x4
       |
       +-- /admin/courses (page)
       |     -> CourseList (client) [SWR: GET /api/admin/courses]
       |          -> course row items with actions (edit, delete, toggle publish)
       |
       +-- /admin/courses/new (page)
       |     -> CourseForm (client) [react-hook-form + createCourseSchema]
       |          -> POST /api/admin/courses -> redirect to edit page
       |
       +-- /admin/courses/[id] (page)
             -> Tabs: "Details" | "Curriculum"
             -> Tab 1: CourseForm (client) [react-hook-form + updateCourseSchema]
             |    -> PATCH /api/admin/courses/[id]
             -> Tab 2: CurriculumEditor (client) [@dnd-kit sortable]
                  -> SortableChapter (per chapter, contains nested SortableContext)
                       -> SortableLesson (per lesson)
                  -> ChapterDialog (add/edit chapter title)
                  -> LessonDialog (add/edit lesson fields)
```

### Data Flow

```
Client Component
  -> SWR hook (e.g., useAdminCourses)
       -> GET /api/admin/courses
            -> requireAdmin() guard
            -> Drizzle query
            -> successResponse(data)
       <- { success: true, data: [...] }
  <- parsed into typed state

Form Submission
  -> react-hook-form onSubmit
       -> fetch(url, { method, body: JSON })
       -> mutate() SWR cache
       -> toast.success() or toast.error()
```

### Admin Role Guard (Layout Level)

The middleware at `src/middleware.ts` already protects `/admin` for authentication, but does NOT check admin role. The layout performs the role check server-side:

```
(admin)/layout.tsx (server component):
  1. createServerClient() -> supabase.auth.getUser()
  2. db.select({ role }).from(users).where(eq(supabaseUserId, user.id))
  3. if role !== "admin" -> redirect to /dashboard
  4. Render <AdminShell>{children}</AdminShell>
```

This avoids a client-side flash for non-admin users. The `AdminShell` client component handles the sidebar, mobile nav, and theme.

---

## Implementation Plan

### Phase 1: Missing API Endpoints (1 hour)

**Goal**: Add GET endpoints that the UI requires.

**1.1 Add GET handler to `src/app/api/admin/courses/route.ts`**

Add a `GET` export to the existing file (currently only has `POST`).

- Guard: `requireAdmin()`
- Query: Select all courses ordered by `createdAt DESC`
- Include computed fields via subquery: `chapterCount`, `lessonCount`
- Return: `successResponse({ items: Course[], total: number })`
- No pagination needed initially (admin typically has < 100 courses), but include total count

SQL approach:

```ts
const result = await db
  .select({
    id: courses.id,
    title: courses.title,
    slug: courses.slug,
    description: courses.description,
    price: courses.price,
    level: courses.level,
    category: courses.category,
    isPublished: courses.isPublished,
    isFree: courses.isFree,
    createdAt: courses.createdAt,
    chapterCount: sql<number>`(SELECT cast(count(*) as integer) FROM chapters WHERE chapters.course_id = courses.id)`,
    lessonCount: sql<number>`(SELECT cast(count(*) as integer) FROM lessons l JOIN chapters c ON l.chapter_id = c.id WHERE c.course_id = courses.id)`,
  })
  .from(courses)
  .orderBy(desc(courses.createdAt));
```

**1.2 Add GET handler to `src/app/api/admin/courses/[id]/route.ts`**

Add a `GET` export to the existing file (currently has `PATCH` + `DELETE`).

- Guard: `requireAdmin()` + `parseUuid(id)`
- Query: Select course by ID, then select chapters (ordered by `order`), then select lessons per chapter (ordered by `order`)
- Return nested structure matching `CourseDetail` type:

```ts
{
  ...course,
  chapters: [
    { ...chapter, lessons: [...] },
    ...
  ]
}
```

Use `Promise.all` for parallel chapter+lesson fetching (per `async-parallel` from vercel-react-best-practices):

```ts
const course = await db.select().from(courses).where(eq(courses.id, validId)).limit(1);
const courseChapters = await db
  .select()
  .from(chapters)
  .where(eq(chapters.courseId, validId))
  .orderBy(asc(chapters.order));
const chapterIds = courseChapters.map((c) => c.id);
const allLessons =
  chapterIds.length > 0
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.chapterId, chapterIds))
        .orderBy(asc(lessons.order))
    : [];
// Group lessons by chapterId using Map (per js-index-maps)
```

**Verification**:

```bash
curl -H "Cookie: ..." http://localhost:3000/api/admin/courses
curl -H "Cookie: ..." http://localhost:3000/api/admin/courses/<uuid>
```

---

### Phase 2: Admin Layout + Navigation Config (1.5 hours)

**Goal**: Admin route group shell with sidebar, role guard, and responsive navigation.

**2.1 Add `adminNav` to `src/shared/config/navigation.ts`**

```ts
export const adminNav: NavItem[] = [
  {
    key: "admin-dashboard",
    href: "/admin",
    labelKey: "admin.dashboard.title",
    icon: "LayoutDashboard",
  },
  {
    key: "admin-courses",
    href: "/admin/courses",
    labelKey: "admin.courses.title",
    icon: "BookOpen",
  },
] as const;
```

Future items (Users, Coupons, Analytics) can be added later without structural changes.

**2.2 Create admin layout: `src/app/[locale]/(admin)/layout.tsx`**

Server component responsibilities:

- Authenticate via Supabase server client
- Look up DB user role
- Redirect non-admin to `/{locale}/dashboard`
- Render `<AdminShell>` client component wrapping `{children}`

```tsx
import { redirect } from "@/i18n/navigation";
import { createServerClient } from "@/shared/api/supabase";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { AdminShell } from "@/widgets/admin-sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/login", locale });

  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.supabaseUserId, user.id));

  if (!dbUser || dbUser.role !== "admin") {
    redirect({ href: "/dashboard", locale });
  }

  return <AdminShell>{children}</AdminShell>;
}
```

**2.3 Create `src/widgets/admin-sidebar/` widget**

Files:

- `src/widgets/admin-sidebar/index.ts` -- barrel export
- `src/widgets/admin-sidebar/ui/admin-shell.tsx` -- "use client" component

`AdminShell` component:

- Desktop: fixed left sidebar (w-64) + main content area
- Mobile: Sheet-based slide-out nav (triggered by hamburger)
- Sidebar contents: logo link to /admin, nav items from `adminNav`, "Back to dashboard" link, theme toggle, language switcher
- Uses `usePathname()` from `@/i18n/navigation` for active route highlighting
- Uses `isActiveRoute()` utility from `@/shared/lib/is-active-route`
- Icon map: `LayoutDashboard`, `BookOpen`, `ArrowLeft` (back to dashboard)
- Semantic dark mode tokens: `bg-card` for sidebar, `bg-background` for main, `border` for divider

---

### Phase 3: Admin Dashboard Page (1 hour)

**Goal**: Dashboard with summary statistics cards.

**3.1 Create SWR hook: `src/features/admin/dashboard/model/use-admin-analytics.ts`**

```ts
"use client";
import useSWR from "swr";

interface AnalyticsData {
  period: string;
  revenue: { total: number; count: number; average: number };
  enrollments: number;
  newUsers: number;
}

export function useAdminAnalytics(period: string = "30d") {
  const { data, error, isLoading } = useSWR(`/api/admin/analytics?period=${period}`);
  return {
    analytics: (data?.data as AnalyticsData) ?? null,
    error,
    isLoading,
  };
}
```

**3.2 Create stats card: `src/features/admin/dashboard/ui/admin-stats-card.tsx`**

Reusable card component accepting: `title`, `value`, `icon`, `description?`. Uses `Card` from `@/shared/ui`. Format numbers with `Intl.NumberFormat` for locale-aware display.

**3.3 Create dashboard page: `src/features/admin/dashboard/ui/admin-dashboard.tsx`**

- "use client"
- `useAdminAnalytics(period)` with period state (default "30d")
- Period selector: group of 4 buttons (7d, 30d, 90d, all) using Button variant toggle pattern
- 4 stat cards in responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4):
  - Total Revenue (DollarSign icon) - formatted as KRW
  - Total Enrollments (Users icon)
  - New Users (UserPlus icon)
  - Total Payments (CreditCard icon)
- Loading state: 4 Skeleton cards

**3.4 Create page route: `src/app/[locale]/(admin)/admin/page.tsx`**

Thin server page component that renders `<AdminDashboard />`.

**3.5 Barrel export: `src/features/admin/dashboard/index.ts`**

**Verification**: Navigate to `/admin` as admin user, see 4 stat cards with data.

---

### Phase 4: Course List Page (1.5 hours)

**Goal**: Table-style course listing with actions.

**4.1 Create SWR hook: `src/features/admin/courses/model/use-admin-courses.ts`**

```ts
"use client";
import useSWR from "swr";

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  level: string;
  category: string | null;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
  chapterCount: number;
  lessonCount: number;
}

export function useAdminCourses() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/courses");
  return {
    courses: (data?.data?.items as AdminCourseSummary[]) ?? [],
    total: (data?.data?.total as number) ?? 0,
    error,
    isLoading,
    mutate,
  };
}
```

**4.2 Create course detail hook: `src/features/admin/courses/model/use-admin-course.ts`**

```ts
"use client";
import useSWR from "swr";
import type { CourseDetail } from "@/entities/course";

export function useAdminCourse(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/admin/courses/${id}` : null);
  return {
    course: (data?.data as CourseDetail) ?? null,
    error,
    isLoading,
    mutate,
  };
}
```

**4.3 Create course list: `src/features/admin/courses/ui/course-list.tsx`**

- "use client"
- Uses `useAdminCourses()` hook
- Div-based table layout (no shadcn Table component needed):
  - Header row: Title, Level, Price, Status, Chapters, Lessons, Actions
  - Data rows with alternating bg via `even:bg-muted/50`
- Status column: `<Badge>` with variant -- green for published ("admin.courses.published"), gray for unpublished ("admin.courses.unpublished")
- Actions per row:
  - Edit button (Pencil icon) -> navigate to `/admin/courses/[id]`
  - Toggle publish (Eye/EyeOff icon) -> PATCH /api/admin/courses/[id] with `{ isPublished: !current }` then `mutate()`
  - Delete button (Trash2 icon) -> confirmation Dialog -> DELETE /api/admin/courses/[id] then `mutate()`
- Empty state when no courses
- Loading state: Skeleton rows
- Top: page title + "Create" Button linking to `/admin/courses/new`
- Uses `toast.success()` / `toast.error()` from sonner for feedback
- Price display: `Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" })`, or "Free" badge if `isFree`

**4.4 Create page route: `src/app/[locale]/(admin)/admin/courses/page.tsx`**

Thin server page rendering `<CourseList />`.

**Verification**: Navigate to `/admin/courses`, see all courses in table with action buttons.

---

### Phase 5: Course Form (Create + Edit) (1.5 hours)

**Goal**: Shared course form component for creation and editing.

**5.1 Create `src/features/admin/courses/ui/course-form.tsx`**

Shared form used by both create and edit pages. Props:

```ts
interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string; // required for edit mode
  initialData?: Partial<CourseFormValues>; // prefilled for edit
  onSuccess?: (courseId: string) => void;
}
```

Form fields (using react-hook-form + zodResolver + createCourseSchema for create, updateCourseSchema for edit):

| Field           | Component           | Notes                                                         |
| --------------- | ------------------- | ------------------------------------------------------------- |
| title           | Input               | Required, max 200                                             |
| slug            | Input               | Auto-generate from title (slugify), editable, regex validated |
| description     | Textarea            | Short description, max 500                                    |
| longDescription | Textarea            | Detailed description, max 10000, larger height                |
| price           | Input type="number" | Integer >= 0                                                  |
| level           | Select              | beginner / intermediate / advanced                            |
| category        | Input               | Free text, max 100                                            |
| thumbnailUrl    | Input               | URL input                                                     |
| previewVideoUrl | Input               | URL input                                                     |
| instructorBio   | Textarea            | Max 2000                                                      |
| isPublished     | Switch              | Publish toggle                                                |
| isFree          | Switch              | Free course toggle                                            |

Auto-slug generation: on title blur or change, generate slug via:

```ts
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
```

Only auto-generate if user hasn't manually edited the slug field (track with a `slugTouched` ref).

On submit:

- Create: POST /api/admin/courses -> redirect to /admin/courses/[newId]
- Edit: PATCH /api/admin/courses/[id] -> toast success, mutate SWR cache
- Error handling: toast.error with message from API response

Layout: Two-column on desktop (lg:grid-cols-2), single column on mobile. Group related fields:

- Column 1: title, slug, description, longDescription, instructorBio
- Column 2: price, level, category, thumbnailUrl, previewVideoUrl, isPublished, isFree

**5.2 Create page: `src/app/[locale]/(admin)/admin/courses/new/page.tsx`**

```tsx
"use client";
import { useRouter } from "@/i18n/navigation";
import { CourseForm } from "@/features/admin/courses";

export default function AdminCourseNewPage() {
  const router = useRouter();
  return <CourseForm mode="create" onSuccess={(id) => router.push(`/admin/courses/${id}`)} />;
}
```

Note: This page needs "use client" because it uses `useRouter`. Alternatively, the page could be a thin server component passing a redirect callback, but since CourseForm itself is a client component, keeping the page as client is simpler and avoids unnecessary serialization.

**5.3 Create page: `src/app/[locale]/(admin)/admin/courses/[id]/page.tsx`**

- "use client" (or thin server wrapper)
- Fetch course via `useAdminCourse(id)` where `id` comes from route params
- Render `<Tabs>` with two tabs: "Details" and "Curriculum"
- Tab "Details": `<CourseForm mode="edit" courseId={id} initialData={course} />`
- Tab "Curriculum": `<CurriculumEditor courseId={id} chapters={course.chapters} />`
- Loading: Skeleton layout
- Error: error message display

Route params access: use `useParams()` from `next/navigation` to get `id`.

**Verification**: Create a new course at `/admin/courses/new`, get redirected to edit page. Edit fields and save.

---

### Phase 6: Curriculum Editor with DnD (2.5 hours)

**Goal**: Drag-and-drop curriculum management with chapter/lesson CRUD.

This is the most complex phase. Use `next/dynamic` for the curriculum editor to avoid loading @dnd-kit in the initial bundle (per `bundle-dynamic-imports` from vercel-react-best-practices).

**6.1 Create `src/widgets/curriculum-editor/ui/curriculum-editor.tsx`**

Main component. Props:

```ts
interface CurriculumEditorProps {
  courseId: string;
  chapters: (Chapter & { lessons: Lesson[] })[];
  onMutate: () => void; // trigger SWR revalidation
}
```

State management:

- Local `chapters` state initialized from props, updated optimistically on DnD
- Use `useEffect` to sync when props change (after server revalidation)

DnD setup (@dnd-kit/core + @dnd-kit/sortable):

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
    {chapters.map(chapter => (
      <SortableChapter key={chapter.id} chapter={chapter} ... />
    ))}
  </SortableContext>
</DndContext>
```

Sensors: `useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))`

`handleDragEnd` logic:

1. Determine if dragged item is a chapter or lesson (use data attributes or ID prefixes)
2. For chapters: `arrayMove` on chapter array, then call reorder API
3. For lessons within same chapter: `arrayMove` on lessons array, then call reorder API
4. Cross-chapter lesson moves: remove from source, insert in target (future enhancement -- initially keep same-container only)
5. Optimistically update local state, revert on API error

Reorder API call:

```ts
await fetch(`/api/admin/courses/${courseId}/reorder`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chapters: localChapters.map((ch, i) => ({
      id: ch.id,
      order: i,
      lessons: ch.lessons.map((l, j) => ({ id: l.id, order: j })),
    })),
  }),
});
```

"Add Chapter" button at the bottom of the list.

**6.2 Create `src/widgets/curriculum-editor/ui/sortable-chapter.tsx`**

Each chapter rendered as a collapsible card with:

- Drag handle (GripVertical icon) via `useSortable` `listeners` + `attributes`
- Chapter title (inline editable or edit via dialog)
- Action buttons: Edit (Pencil), Delete (Trash2), Add Lesson (Plus)
- Nested `SortableContext` for lessons within the chapter
- Expand/collapse toggle (ChevronDown/ChevronUp)

Uses `useSortable` hook:

```tsx
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
  id: chapter.id,
});
const style = { transform: CSS.Transform.toString(transform), transition };
```

**6.3 Create `src/widgets/curriculum-editor/ui/sortable-lesson.tsx`**

Each lesson rendered as a row within a chapter:

- Drag handle (GripVertical icon, smaller)
- Lesson title
- Duration badge (formatted as mm:ss if set)
- `isPreview` toggle (Switch component) -> PATCH /api/admin/lessons/[id] with `{ isPreview: !current }`
- Action buttons: Edit (Pencil), Delete (Trash2)

Uses `useSortable` hook same as chapter.

**6.4 Create `src/widgets/curriculum-editor/ui/chapter-dialog.tsx`**

Dialog for add/edit chapter:

- Mode: "create" | "edit"
- Form: single field `title` (react-hook-form + createChapterSchema or updateChapterSchema)
- Create: POST /api/admin/courses/[courseId]/chapters -> onMutate()
- Edit: PATCH /api/admin/chapters/[id] -> onMutate()
- Delete confirmation: nested in edit mode or separate trigger

**6.5 Create `src/widgets/curriculum-editor/ui/lesson-dialog.tsx`**

Dialog for add/edit lesson:

- Mode: "create" | "edit"
- Form fields: title, description (Textarea), videoUrl, duration (number), isPreview (Switch)
- Uses react-hook-form + createLessonSchema / updateLessonSchema
- Create: POST /api/admin/chapters/[chapterId]/lessons -> onMutate()
- Edit: PATCH /api/admin/lessons/[id] -> onMutate()

**6.6 Create `src/widgets/curriculum-editor/model/use-curriculum.ts`**

Helper hook for curriculum operations (optional, can keep logic in component):

- `addChapter(courseId, title)` -> POST + mutate
- `updateChapter(chapterId, title)` -> PATCH + mutate
- `deleteChapter(chapterId)` -> DELETE + mutate + confirmation
- `addLesson(chapterId, data)` -> POST + mutate
- `updateLesson(lessonId, data)` -> PATCH + mutate
- `deleteLesson(lessonId)` -> DELETE + mutate
- `reorder(courseId, chaptersWithLessons)` -> PATCH reorder

All operations follow:

```ts
const res = await fetch(url, { method, body });
const json = await res.json();
if (!json.success) {
  toast.error(json.error.message);
  return;
}
toast.success(message);
onMutate();
```

**6.7 Barrel exports**:

- `src/widgets/curriculum-editor/index.ts`

**6.8 Dynamic import in edit page**:

```tsx
import dynamic from "next/dynamic";
const CurriculumEditor = dynamic(
  () => import("@/widgets/curriculum-editor").then((m) => ({ default: m.CurriculumEditor })),
  { loading: () => <Skeleton className="h-96 w-full" /> },
);
```

**Verification**:

1. Navigate to course edit page, see "Curriculum" tab
2. Add a chapter, see it appear
3. Add lessons to the chapter
4. Drag chapters to reorder, see order persist after refresh
5. Drag lessons to reorder within a chapter
6. Toggle lesson preview, see switch update
7. Edit/delete chapters and lessons via dialogs

---

## Files to Create

| File                                                        | Layer    | Type   | Description                  |
| ----------------------------------------------------------- | -------- | ------ | ---------------------------- |
| `src/app/[locale]/(admin)/layout.tsx`                       | app      | server | Admin layout with role guard |
| `src/app/[locale]/(admin)/admin/page.tsx`                   | app      | server | Dashboard page route         |
| `src/app/[locale]/(admin)/admin/courses/page.tsx`           | app      | server | Course list page route       |
| `src/app/[locale]/(admin)/admin/courses/new/page.tsx`       | app      | client | Course create page           |
| `src/app/[locale]/(admin)/admin/courses/[id]/page.tsx`      | app      | client | Course edit page with tabs   |
| `src/widgets/admin-sidebar/index.ts`                        | widgets  | barrel | Public API                   |
| `src/widgets/admin-sidebar/ui/admin-shell.tsx`              | widgets  | client | Sidebar + shell layout       |
| `src/features/admin/dashboard/index.ts`                     | features | barrel | Public API                   |
| `src/features/admin/dashboard/ui/admin-dashboard.tsx`       | features | client | Dashboard with stats         |
| `src/features/admin/dashboard/ui/admin-stats-card.tsx`      | features | client | Reusable stat card           |
| `src/features/admin/dashboard/model/use-admin-analytics.ts` | features | client | SWR hook for analytics       |
| `src/features/admin/courses/index.ts`                       | features | barrel | Public API                   |
| `src/features/admin/courses/ui/course-form.tsx`             | features | client | Shared create/edit form      |
| `src/features/admin/courses/ui/course-list.tsx`             | features | client | Course list with actions     |
| `src/features/admin/courses/model/use-admin-courses.ts`     | features | client | SWR hook for course list     |
| `src/features/admin/courses/model/use-admin-course.ts`      | features | client | SWR hook for single course   |
| `src/widgets/curriculum-editor/index.ts`                    | widgets  | barrel | Public API                   |
| `src/widgets/curriculum-editor/ui/curriculum-editor.tsx`    | widgets  | client | Main DnD editor              |
| `src/widgets/curriculum-editor/ui/sortable-chapter.tsx`     | widgets  | client | Sortable chapter card        |
| `src/widgets/curriculum-editor/ui/sortable-lesson.tsx`      | widgets  | client | Sortable lesson row          |
| `src/widgets/curriculum-editor/ui/chapter-dialog.tsx`       | widgets  | client | Chapter add/edit dialog      |
| `src/widgets/curriculum-editor/ui/lesson-dialog.tsx`        | widgets  | client | Lesson add/edit dialog       |
| `src/widgets/curriculum-editor/model/use-curriculum.ts`     | widgets  | client | Curriculum CRUD operations   |

## Files to Modify

| File                                      | Change                                                  |
| ----------------------------------------- | ------------------------------------------------------- |
| `src/app/api/admin/courses/route.ts`      | Add `GET` handler (list all courses with counts)        |
| `src/app/api/admin/courses/[id]/route.ts` | Add `GET` handler (course detail with chapters+lessons) |
| `src/shared/config/navigation.ts`         | Add `adminNav` array export                             |

---

## Acceptance Criteria Mapping

| AC# | Requirement                                | Phase     | Implementation                                         |
| --- | ------------------------------------------ | --------- | ------------------------------------------------------ |
| 1   | (admin) route group + admin layout         | Phase 2   | `layout.tsx` with role guard + `AdminShell`            |
| 2   | /admin dashboard with stats                | Phase 3   | `AdminDashboard` + `useAdminAnalytics`                 |
| 3   | /admin/courses list (all statuses, badges) | Phase 4   | `CourseList` + `useAdminCourses` + Badge               |
| 4   | /admin/courses/new creation form           | Phase 5   | `CourseForm` mode="create"                             |
| 5   | /admin/courses/[id]/edit + curriculum      | Phase 5+6 | `CourseForm` mode="edit" + `CurriculumEditor`          |
| 6   | Chapter/lesson add/edit/delete             | Phase 6   | `ChapterDialog` + `LessonDialog` + `useCurriculum`     |
| 7   | DnD reorder (@dnd-kit)                     | Phase 6   | `SortableChapter` + `SortableLesson` + reorder API     |
| 8   | is_preview toggle per lesson               | Phase 6   | Switch in `SortableLesson` -> PATCH lesson API         |
| 9   | Publish/unpublish toggle                   | Phase 4+5 | Toggle in course list + Switch in CourseForm           |
| 10  | i18n support                               | All       | All text uses `useTranslations("admin.*")`, keys exist |

---

## Risks

| Risk                                                     | Impact | Mitigation                                                                                                                                                                                         |
| -------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @dnd-kit/sortable v10 API differences from v8 examples   | Medium | Use only imports confirmed in exploration (SortableContext, useSortable, arrayMove, verticalListSortingStrategy). Test early in Phase 6.                                                           |
| Nested DnD (lessons inside chapters) collision detection | Medium | Start with chapter-only reorder, then add lesson reorder. Use distinct ID prefixes (`chapter-{id}` vs `lesson-{id}`) to distinguish drag types.                                                    |
| Server-side redirect import from next-intl               | Low    | Use `redirect` from `@/i18n/navigation` for locale-aware redirects in the layout. Verify it works in server components. If not, fall back to `next/navigation` redirect with manual locale prefix. |
| Large form re-renders with many fields                   | Low    | Use `react-hook-form` which minimizes re-renders by default. Split form into sections if needed.                                                                                                   |
| Flash of admin content for non-admin                     | Low    | Role check is in server component layout, so non-admin users never receive admin HTML.                                                                                                             |

---

## Conventions Checklist

- [x] All filenames: kebab-case
- [x] All components: PascalCase named exports
- [x] Forms: react-hook-form + zodResolver + shadcn Form primitives
- [x] Data fetching: SWR hooks in feature `model/` directories
- [x] i18n: `useTranslations("admin.courses")` etc. for client components
- [x] Icons: lucide-react only
- [x] Links: `import { Link } from "@/i18n/navigation"`
- [x] Toast: sonner `toast.success()` / `toast.error()`
- [x] Dark mode: semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border`)
- [x] "use client" directive on all components using hooks
- [x] Barrel exports: `index.ts` per slice
- [x] FSD imports: upper layers import from lower layers only
