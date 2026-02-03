# Task-010: Course Detail Page -- Curriculum, Preview, Purchase Widget, FAQ

> Created: 2026-02-03
> Based on: exploration.md
> Estimated time: 6-8 hours

---

## Objective

Build the course detail page at `/courses/[slug]` featuring a hero banner, preview video player, sticky purchase widget (desktop sidebar + mobile bottom bar), curriculum accordion, instructor bio, reviews section, FAQ accordion, and related courses. The page must be responsive, SEO-optimized, and handle enrollment state (unauthenticated, authenticated-not-enrolled, enrolled).

---

## Applied Skills

### Scan Results

3 skills found (project: 3, user: 0, default: 0)

### Selected Skills

| Skill                       | Location | Reason                                                                              |
| --------------------------- | -------- | ----------------------------------------------------------------------------------- |
| vercel-react-best-practices | project  | Client component performance, SWR dedup, bundle optimization, conditional rendering |
| web-design-guidelines       | project  | Responsive layout, accessibility, sticky positioning, design review                 |

### Excluded Skills

| Skill                            | Reason                                     |
| -------------------------------- | ------------------------------------------ |
| supabase-postgres-best-practices | No DB/query work -- all APIs already exist |

---

## Architecture

### Page Layout (Desktop)

```
+------------------------------------------------------------------+
| Header (from marketing layout)                                    |
+------------------------------------------------------------------+
|                                                                    |
| [CourseHero: title, subtitle, level, stats, CTA]                  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| +------------------------------------------+ +------------------+ |
| | PreviewVideoSection                      | | PurchaseWidget   | |
| |                                          | | (sticky sidebar) | |
| +------------------------------------------+ |                  | |
| |                                          | | Price            | |
| | CurriculumAccordion                      | | CTA button       | |
| |   Chapter 1                              | | Includes list    | |
| |     Lesson 1  (5:30) [Preview]           | |                  | |
| |     Lesson 2  (8:20)                     | |                  | |
| |   Chapter 2                              | |                  | |
| |     ...                                  | |                  | |
| +------------------------------------------+ +------------------+ |
| |                                          |                      |
| | InstructorSection                        |                      |
| +------------------------------------------+                      |
| |                                          |                      |
| | CourseReviewsSection                     |                      |
| |   Average rating + star display          |                      |
| |   Review cards (paginated)               |                      |
| +------------------------------------------+                      |
| |                                          |                      |
| | CourseFaqSection                         |                      |
| +------------------------------------------+                      |
| |                                          |                      |
| | RelatedCoursesSection                    |                      |
| +------------------------------------------+                      |
|                                                                    |
+------------------------------------------------------------------+
| Footer (from marketing layout)                                    |
+------------------------------------------------------------------+
```

### Page Layout (Mobile)

- Single column, no sidebar
- PurchaseWidget renders as a **fixed bottom bar** with price and CTA
- All sections stack vertically
- Bottom padding added to body to account for fixed bar height

### Data Flow

```
Page (server component)
  |-- generateMetadata() --> fetch /api/courses/[slug] server-side for SEO
  |-- render <CourseDetailContent slug={slug} />
        |
        CourseDetailContent (client component)
          |-- useCourse(slug) ------------> GET /api/courses/[slug]
          |-- useAuth() ------------------> AuthContext (user | null)
          |-- useEnrollment(courseId) -----> GET /api/enrollments/{courseId} (conditional: only if user)
          |-- useCourseReviews(slug) ------> GET /api/courses/{slug}/reviews
          |-- useCourses({ category }) ---> GET /api/courses?category=xxx (for related)
          |
          |-- handleCheckout() -----------> POST /api/checkout/{courseSlug}
          |       free: revalidate enrollment via mutate()
          |       paid: window.location.href = checkoutUrl
```

### Component Tree

```
CourseDetailContent (orchestrator, "use client")
  +-- CourseHero
  +-- <div className="lg:grid lg:grid-cols-12 lg:gap-8">
  |     +-- <main className="lg:col-span-8">
  |     |     +-- PreviewVideoSection
  |     |     +-- CurriculumAccordion
  |     |     +-- InstructorSection
  |     |     +-- CourseReviewsSection
  |     |     +-- CourseFaqSection
  |     |     +-- RelatedCoursesSection
  |     +-- <aside className="lg:col-span-4">
  |           +-- PurchaseWidget (desktop: sticky)
  +-- PurchaseWidget (mobile: fixed bottom bar, hidden on lg)
```

---

## Implementation Plan

### Phase 1: Foundation -- Fix Hooks, Add New Hook, i18n Keys (1 hour)

**Goal**: Prepare the data layer and translations before building UI.

#### 1.1 Fix useEnrollment endpoint

**File**: `src/entities/enrollment/api/use-enrollment.ts` (MODIFY)

Change the SWR key from `/api/enrollments/check?courseId=${courseId}` to `/api/enrollments/${courseId}`.

The API response shape `{ enrolled: boolean }` matches `EnrollmentCheckResponse` so the type remains valid.

#### 1.2 Create useCourseReviews hook

**File**: `src/entities/review/api/use-course-reviews.ts` (CREATE)

```typescript
"use client";
import useSWR from "swr";
import type { ReviewWithUser } from "../model/types";
import type { PaginatedResponse } from "@/shared/types/api";

export function useCourseReviews(slug: string | undefined, page = 1, pageSize = 5) {
  const key = slug ? `/api/courses/${slug}/reviews?page=${page}&pageSize=${pageSize}` : null;
  const { data, error, isLoading, mutate } = useSWR(key);
  const paginated = (data?.data as PaginatedResponse<ReviewWithUser>) ?? null;

  return {
    reviews: paginated?.items ?? [],
    total: paginated?.total ?? 0,
    page: paginated?.page ?? 1,
    hasMore: paginated?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}
```

**File**: `src/entities/review/index.ts` (MODIFY)

Add export: `export { useCourseReviews } from "./api/use-course-reviews";`

#### 1.3 Add formatDuration utility

**File**: `src/shared/lib/format.ts` (CREATE)

```typescript
/**
 * Format duration in seconds to "Xh Ym" or "Xm" string.
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format lesson duration in seconds to "M:SS" string.
 */
export function formatLessonDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
```

#### 1.4 Add i18n keys

**Files**: `public/locales/ko/common.json` and `public/locales/en/common.json` (MODIFY)

Add keys under `course.detail`:

- `course.detail.purchaseWidget.title` -- "수강 정보" / "Course Info"
- `course.detail.purchaseWidget.enrollFree` -- "무료 수강하기" / "Enroll Free"
- `course.detail.purchaseWidget.enrollPaid` -- "수강권 구매하기" / "Purchase Course"
- `course.detail.purchaseWidget.loginRequired` -- "로그인 후 수강하기" / "Login to Enroll"
- `course.detail.purchaseWidget.processing` -- "처리 중..." / "Processing..."
- `course.detail.curriculum.totalChapters` -- "{count}개 챕터" / "{count} chapters"
- `course.detail.curriculum.expandAll` -- "모두 펼치기" / "Expand all"
- `course.detail.curriculum.collapseAll` -- "모두 접기" / "Collapse all"
- `course.detail.reviews.showMore` -- "수강평 더 보기" / "Show more reviews"
- `course.detail.faq.items.0.q` / `.a` -- Refund, access period, certificate, discussion (4 items)
- `course.detail.notFound` -- "강의를 찾을 수 없습니다" / "Course not found"
- `course.detail.notFoundDescription` -- "요청하신 강의가 존재하지 않거나 비공개 상태입니다." / "The requested course does not exist or is not published."
- `course.detail.errorTitle` -- "강의를 불러올 수 없습니다" / "Could not load course"
- `course.detail.errorDescription` -- "잠시 후 다시 시도해 주세요." / "Please try again later."

**Verification**: `pnpm typecheck` passes. `pnpm lint` passes.

---

### Phase 2: Page Route and Widget Scaffold (1 hour)

**Goal**: Create the page route with SEO metadata and the widget barrel export with the orchestrator component.

#### 2.1 Create page route

**File**: `src/app/[locale]/(marketing)/courses/[slug]/page.tsx` (CREATE)

Server component following the dynamic marketing page pattern (see blog/[slug]/page.tsx):

```typescript
import type { Metadata } from "next";
import { generateSEO, JsonLd } from "@/shared/ui";
import { CourseDetailContent } from "@/widgets/course-detail";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Server-side fetch for SEO (no SWR, direct fetch with absolute URL)
  // Use internal API URL or direct DB query
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/courses/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return generateSEO({ title: "Course Not Found" });
  const { data } = await res.json();
  return generateSEO({
    title: data.title,
    description: data.description ?? undefined,
    image: data.thumbnailUrl ?? undefined,
    type: "website",
    keywords: [data.category, data.level].filter(Boolean) as string[],
  });
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  return <CourseDetailContent slug={slug} locale={locale} />;
}
```

Note: `generateMetadata` does a server-side fetch to the API. The `revalidate: 60` caches for 60s using Next.js data cache. This avoids importing DB code into the page component while keeping SEO metadata dynamic.

#### 2.2 Create widget barrel export

**File**: `src/widgets/course-detail/index.ts` (CREATE)

```typescript
export { CourseDetailContent } from "./ui/course-detail-content";
```

#### 2.3 Create orchestrator component

**File**: `src/widgets/course-detail/ui/course-detail-content.tsx` (CREATE)

This is the main "use client" component. It:

1. Calls `useCourse(slug)` to get course data
2. Calls `useAuth()` to get current user
3. Conditionally calls `useEnrollment(course.id)` if user is logged in
4. Renders loading skeleton, error state, or not-found state
5. Renders all sub-sections in the 2-column layout

Key props: `{ slug: string; locale: string }`

State management:

- `checkoutLoading` boolean for purchase button loading state
- `handleCheckout` async function that calls POST /api/checkout/[courseSlug]

**Verification**: Page renders at `/ko/courses/[slug]` with loading state.

---

### Phase 3: Hero and Purchase Widget (1.5 hours)

**Goal**: Build the above-the-fold experience -- hero banner and purchase widget.

#### 3.1 CourseHero component

**File**: `src/widgets/course-detail/ui/course-hero.tsx` (CREATE)

Props: `{ course: CourseDetail & { reviewCount: number; averageRating: number } }`

Content:

- Full-width section with optional thumbnail background (gradient overlay for readability)
- Course title (`<h1>`)
- Level badge + category badge (using `<Badge>`)
- Stats row: totalLessons, totalDuration (formatted), averageRating with star icon, reviewCount
- Description text (1-2 lines, from `course.description`)

Responsive:

- Desktop: larger title, horizontal stats row
- Mobile: stacked layout, smaller text

#### 3.2 PurchaseWidget component

**File**: `src/widgets/course-detail/ui/purchase-widget.tsx` (CREATE)

Props: `{ course, enrolled, isAuthLoading, user, onCheckout, checkoutLoading }`

Three states:

1. **Not authenticated**: Show price + "Login to Enroll" button (links to `/login?redirect=/courses/[slug]`)
2. **Authenticated, not enrolled**: Show price + "Enroll Free" or "Purchase Course" button
3. **Enrolled**: Show "Continue Learning" button (links to `/learn/[slug]`)

Desktop rendering (inside `<aside>`):

- `<Card>` with sticky positioning: `className="sticky top-20"`
- Price display: "Free" or formatted KRW price
- CTA button (full width)
- Separator
- "Includes" list with check icons: lifetime access, certificate, discussion

Mobile rendering (separate instance, outside grid):

- Fixed bottom bar: `className="fixed bottom-0 inset-x-0 z-40 border-t bg-background p-4 lg:hidden"`
- Compact layout: price on left, CTA button on right
- Uses `useMediaQuery` or CSS-only approach (render both, hide with responsive classes)

Implementation decision: Render TWO instances of the widget with different layout props/classes rather than one that repositions. The mobile bar is simpler as a separate element. Use `hidden lg:block` for desktop and `lg:hidden` for mobile.

**Verification**: Sticky sidebar sticks on scroll (desktop). Fixed bar appears at bottom (mobile).

---

### Phase 4: Content Sections -- Video, Curriculum, Instructor (1.5 hours)

**Goal**: Build the main content column sections.

#### 4.1 PreviewVideoSection

**File**: `src/widgets/course-detail/ui/preview-video-section.tsx` (CREATE)

Props: `{ previewVideoUrl: string | null; thumbnailUrl: string | null }`

- Only renders if `previewVideoUrl` is truthy
- Uses `<VideoPlayer>` from `@/widgets/video-player`
- Passes `src={previewVideoUrl}`, `poster={thumbnailUrl}`
- Wraps in a section with rounded corners and overflow hidden
- Aspect ratio container: `aspect-video`

#### 4.2 CurriculumAccordion

**File**: `src/widgets/course-detail/ui/curriculum-accordion.tsx` (CREATE)

Props: `{ chapters: CourseDetail["chapters"]; totalLessons: number; totalDuration: number }`

Structure:

- Summary header: "{N} chapters, {M} lessons, {duration}" with expand/collapse all button
- Uses shadcn `<Accordion type="multiple">` for multi-expand
- Each chapter = `<AccordionItem>`:
  - Trigger: chapter title + lesson count
  - Content: list of lessons, each showing:
    - Play icon (if isPreview) or lock icon
    - Lesson title
    - Duration formatted as "M:SS" using `formatLessonDuration()`
    - `<Badge variant="secondary">` with "Preview" text if `isPreview`

State: `openChapters` array of chapter IDs managed via Accordion's `value` prop. "Expand all" sets all chapter IDs; "Collapse all" sets empty array.

#### 4.3 InstructorSection

**File**: `src/widgets/course-detail/ui/instructor-section.tsx` (CREATE)

Props: `{ instructorBio: string | null }`

- Only renders if `instructorBio` is truthy
- Section heading: t("course.instructor.title")
- Bio text rendered as paragraphs (split by `\n`)
- Simple card layout with avatar placeholder and bio

**Verification**: Curriculum accordion expands/collapses. Preview video plays. Instructor bio displays.

---

### Phase 5: Reviews, FAQ, Related Courses (1.5 hours)

**Goal**: Build the remaining content sections.

#### 5.1 CourseReviewsSection

**File**: `src/widgets/course-detail/ui/course-reviews-section.tsx` (CREATE)

Props: `{ slug: string; reviewCount: number; averageRating: number }`

- Section heading with average rating display (star icons + numeric rating + review count)
- Uses `useCourseReviews(slug, page)` hook
- Renders review cards: avatar, name, star rating, title, content, date
- "Show more" button increments page state and appends reviews
- Loading state with skeleton cards

StarRating sub-component:

- Extract from the pattern in `reviews-page-content.tsx` (lines 22-36)
- Renders 5 Star icons, filled yellow for `i < rating`, muted otherwise
- Accepts `rating: number`, `size?: "sm" | "md"` prop

#### 5.2 CourseFaqSection

**File**: `src/widgets/course-detail/ui/course-faq-section.tsx` (CREATE)

Props: `{}` (uses i18n keys directly)

- Section heading: t("course.faq.title")
- Uses shadcn `<Accordion type="single" collapsible>` for single-expand FAQ
- 4 FAQ items from i18n: `course.detail.faq.items.{0-3}.q` and `.a`
- Maps over indices [0, 1, 2, 3], renders AccordionItem for each

#### 5.3 RelatedCoursesSection

**File**: `src/widgets/course-detail/ui/related-courses-section.tsx` (CREATE)

Props: `{ category: string | null; currentCourseId: string }`

- Only renders if `category` is truthy
- Uses `useCourses({ category })` to fetch same-category courses
- Filters out the current course by ID
- Renders up to 3 courses using `<CourseCard>` from `@/widgets/course-card`
- Responsive grid: 1 col (mobile), 2 col (sm), 3 col (lg)
- Section heading: t("course.relatedCourses")

**Verification**: Reviews load and paginate. FAQ accordion works. Related courses display.

---

### Phase 6: Loading, Error, Not-Found States (0.5 hours)

**Goal**: Polish edge cases.

#### 6.1 Loading skeleton

Inside `course-detail-content.tsx`, when `isLoading` from `useCourse`:

- Render full-page skeleton matching the layout structure
- Use `<Skeleton>` components from `@/shared/ui`
- Hero skeleton, video area skeleton, curriculum skeleton rows, sidebar skeleton

#### 6.2 Error state

When `error` from `useCourse`:

- Show centered error message with t("course.detail.errorTitle") and t("course.detail.errorDescription")
- Retry button that calls `mutate()`

#### 6.3 Not-found state

When `useCourse` returns no error but `course` is null (API returned 404):

- Show centered not-found message with t("course.detail.notFound") and t("course.detail.notFoundDescription")
- Link back to courses listing

**Verification**: Loading skeleton displays during fetch. Error state renders on API failure. Not-found shows for invalid slugs.

---

### Phase 7: Responsive Polish and Final Integration (0.5 hours)

**Goal**: Verify responsive behavior, accessibility, and performance.

- Test mobile fixed bottom bar does not overlap content (add `pb-24 lg:pb-0` to main content on mobile)
- Verify sticky sidebar stops before footer
- Test keyboard navigation through accordion
- Verify all i18n keys resolve (no missing key warnings)
- Run `pnpm lint` and `pnpm typecheck`
- Verify dark mode works with semantic tokens

---

## Files to Create/Modify

### New Files (14)

| #   | File Path                                                  | Purpose                         |
| --- | ---------------------------------------------------------- | ------------------------------- |
| 1   | `src/app/[locale]/(marketing)/courses/[slug]/page.tsx`     | Page route with dynamic SEO     |
| 2   | `src/widgets/course-detail/index.ts`                       | Widget barrel export            |
| 3   | `src/widgets/course-detail/ui/course-detail-content.tsx`   | Main orchestrator (client)      |
| 4   | `src/widgets/course-detail/ui/course-hero.tsx`             | Hero banner section             |
| 5   | `src/widgets/course-detail/ui/preview-video-section.tsx`   | Video player section            |
| 6   | `src/widgets/course-detail/ui/purchase-widget.tsx`         | Sticky/fixed purchase widget    |
| 7   | `src/widgets/course-detail/ui/curriculum-accordion.tsx`    | Chapter/lesson accordion        |
| 8   | `src/widgets/course-detail/ui/instructor-section.tsx`      | Instructor bio section          |
| 9   | `src/widgets/course-detail/ui/course-reviews-section.tsx`  | Reviews + star ratings          |
| 10  | `src/widgets/course-detail/ui/course-faq-section.tsx`      | FAQ accordion                   |
| 11  | `src/widgets/course-detail/ui/related-courses-section.tsx` | Related courses grid            |
| 12  | `src/entities/review/api/use-course-reviews.ts`            | SWR hook for slug-based reviews |
| 13  | `src/shared/lib/format.ts`                                 | Duration formatting utilities   |
| 14  | `src/widgets/course-detail/ui/star-rating.tsx`             | Reusable star rating display    |

### Modified Files (4)

| #   | File Path                                       | Change                        |
| --- | ----------------------------------------------- | ----------------------------- |
| 1   | `src/entities/enrollment/api/use-enrollment.ts` | Fix endpoint URL              |
| 2   | `src/entities/review/index.ts`                  | Add `useCourseReviews` export |
| 3   | `public/locales/ko/common.json`                 | Add `course.detail.*` keys    |
| 4   | `public/locales/en/common.json`                 | Add `course.detail.*` keys    |

---

## Acceptance Criteria Mapping

| #   | AC                                                      | Implementation                                                                                                    | Phase   |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Hero banner -- title, subtitle, enroll CTA              | `CourseHero` component with h1 title, description, stats, CTA                                                     | Phase 3 |
| 2   | Preview video player                                    | `PreviewVideoSection` using existing `VideoPlayer` widget                                                         | Phase 4 |
| 3   | Sticky purchase widget (desktop sidebar, mobile bottom) | `PurchaseWidget` -- two render targets with responsive hide/show                                                  | Phase 3 |
| 4   | Tech stack grid                                         | SKIPPED for MVP (no DB field `techStack`). Can be added later with schema migration.                              | N/A     |
| 5   | Curriculum accordion                                    | `CurriculumAccordion` using shadcn Accordion with chapter/lesson tree                                             | Phase 4 |
| 6   | Instructor section                                      | `InstructorSection` rendering `instructorBio`                                                                     | Phase 4 |
| 7   | Reviews section (avg rating + list)                     | `CourseReviewsSection` with `useCourseReviews` hook, StarRating, pagination                                       | Phase 5 |
| 8   | FAQ accordion                                           | `CourseFaqSection` with i18n-driven FAQ items                                                                     | Phase 5 |
| 9   | Enrolled user sees "Continue Learning"                  | `PurchaseWidget` checks `enrolled` state, renders Link to `/learn/[slug]`                                         | Phase 3 |
| 10  | SEO meta + dynamic OG image                             | `generateMetadata` in page route uses `generateSEO()`. OG image deferred (uses thumbnailUrl as OG image for now). | Phase 2 |
| 11  | Responsive                                              | Two-column desktop, single-column mobile, fixed bottom bar                                                        | Phase 7 |

---

## Key Architecture Decisions

### Decision 1: Skip Tech Stack Grid (AC #4)

**Rationale**: The `courses` table has no `techStack` field. Adding one requires a schema migration that is out of scope. Parsing from `longDescription` is fragile. The grid can be added when a dedicated field exists.

**Impact**: AC #4 is deferred. No user-facing impact since no course data populates this section.

### Decision 2: Fix useEnrollment Rather Than Create New Hook

**Rationale**: The existing hook calls a non-existent endpoint (`/api/enrollments/check`). The actual API is at `/api/enrollments/[courseId]`. Fixing the hook aligns it with the real API and benefits all consumers. The response shape is compatible.

**Impact**: Any other component using `useEnrollment` will now call the correct endpoint. Since the old endpoint did not exist, this is purely a fix.

### Decision 3: Two Widget Instances for Mobile/Desktop Purchase

**Rationale**: Rendering the same component twice with different CSS classes (`hidden lg:block` / `lg:hidden`) is simpler and more maintainable than a single component that repositions itself. React will efficiently reconcile since props are the same.

**Performance note** (from vercel-react-best-practices): The duplicate render is lightweight -- the PurchaseWidget is a small component with minimal state. The SWR data is shared via cache dedup (`client-swr-dedup` rule).

### Decision 4: Server-side Fetch for SEO Metadata

**Rationale**: `generateMetadata` runs on the server and cannot use SWR hooks. A direct fetch to the API route with `next: { revalidate: 60 }` provides cached SEO data without importing DB code into the page component. This follows the existing pattern and keeps the page thin.

### Decision 5: Defer @vercel/og Dynamic Image Generation

**Rationale**: Setting up `@vercel/og` requires font loading, layout design, and an OG image API route. The course `thumbnailUrl` serves as a reasonable OG image. This can be added as a separate task.

### Decision 6: FAQ Uses Site-Wide i18n Keys

**Rationale**: Per-course FAQ would require a DB field and admin UI. Using i18n keys for 4 common questions (access period, refunds, certificates, discussion) covers the typical FAQ needs and is easily extensible.

---

## Risks

| Risk                                                   | Impact | Likelihood | Mitigation                                                                                                                                                                                 |
| ------------------------------------------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useEnrollment` fix breaks other consumers             | Medium | Low        | The old endpoint never existed, so all current consumers were getting errors. This fix is an improvement. Search for all `useEnrollment` usage and verify.                                 |
| `generateMetadata` fetch fails (API down)              | Low    | Low        | Graceful fallback: return generic SEO with "Course Not Found" title.                                                                                                                       |
| Mobile bottom bar overlaps page content                | Medium | Medium     | Add sufficient bottom padding (`pb-24 lg:pb-0`) to the main content container. Test on multiple viewport sizes.                                                                            |
| SWR waterfall: useCourse -> useEnrollment (sequential) | Low    | Certain    | This is inherent -- enrollment requires courseId from the course response. The enrollment check is fast (single DB lookup). useCourseReviews runs in parallel since it uses slug directly. |
| Large curriculum (many chapters) slows render          | Low    | Low        | Accordion items are collapsed by default and only render content when expanded. Use `rendering-conditional-render` pattern (ternary not &&).                                               |
| Related courses request returns current course         | Low    | Certain    | Filter by `course.id !== currentCourseId` client-side after fetch.                                                                                                                         |

---

## Performance Considerations (vercel-react-best-practices)

| Rule                           | Application                                                                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client-swr-dedup`             | All data via SWR hooks -- automatic request deduplication across components                                                                                                                        |
| `async-parallel`               | `useCourseReviews(slug)` and `useCourses({ category })` fire in parallel since they don't depend on `useCourse` response (reviews use slug; related courses use category from initial course data) |
| `bundle-dynamic-imports`       | Consider `next/dynamic` for `VideoPlayer` (heavy: includes hls.js) to avoid loading it for courses without preview video                                                                           |
| `rendering-conditional-render` | Use ternary `condition ? <Component /> : null` instead of `condition && <Component />` throughout                                                                                                  |
| `server-serialization`         | Page passes only `slug` and `locale` strings to client component -- minimal serialization                                                                                                          |
| `rerender-memo`                | Consider `React.memo` for `CurriculumAccordion` lesson items since parent re-renders on expand/collapse                                                                                            |

---

## Completion Criteria

- [ ] All phases complete (1 through 7)
- [ ] Page accessible at `/ko/courses/[valid-slug]` and `/en/courses/[valid-slug]`
- [ ] Loading, error, and not-found states render correctly
- [ ] Purchase widget sticks on desktop, fixed bottom on mobile
- [ ] Curriculum accordion expands/collapses with expand-all toggle
- [ ] Preview video plays using existing VideoPlayer
- [ ] Reviews section shows ratings and paginates
- [ ] FAQ accordion works
- [ ] Related courses display (same category, excluding current)
- [ ] Enrolled users see "Continue Learning" button
- [ ] Unauthenticated users see "Login to Enroll" with redirect
- [ ] SEO metadata renders (title, description, OG image)
- [ ] Dark mode works (semantic tokens throughout)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] No console errors in browser
