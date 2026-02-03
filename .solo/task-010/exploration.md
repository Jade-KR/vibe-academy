# Exploration Results: 강의 상세 페이지 -- 커리큘럼, 미리보기, 구매 위젯, FAQ

> Task: task-010
> Explored at: 2026-02-03
> PRD Reference: FR-COURSE-003

---

## 1. What Already Exists

### 1.1 API Routes (fully implemented)

| Route                             | Method | Description                                        | File                                                                           |
| --------------------------------- | ------ | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `GET /api/courses/[slug]`         | GET    | Course detail with chapters, lessons, review stats | `/Users/jade/projects/vibeAcademy/src/app/api/courses/[slug]/route.ts`         |
| `GET /api/courses/[slug]/reviews` | GET    | Paginated reviews with user info                   | `/Users/jade/projects/vibeAcademy/src/app/api/courses/[slug]/reviews/route.ts` |
| `GET /api/courses`                | GET    | Course list with review stats                      | `/Users/jade/projects/vibeAcademy/src/app/api/courses/route.ts`                |
| `GET /api/enrollments/[courseId]` | GET    | Check enrollment for current user                  | `/Users/jade/projects/vibeAcademy/src/app/api/enrollments/[courseId]/route.ts` |
| `POST /api/checkout/[courseSlug]` | POST   | Create checkout (free=enroll, paid=Polar)          | `/Users/jade/projects/vibeAcademy/src/app/api/checkout/[courseSlug]/route.ts`  |
| `GET /api/enrollments`            | GET    | My enrolled courses with progress                  | `/Users/jade/projects/vibeAcademy/src/app/api/enrollments/route.ts`            |

#### GET /api/courses/[slug] Response Shape

Returns `{ success: true, data: { ...courseFields, totalDuration, totalLessons, chapters: [{ id, title, order, lessons: [{ id, title, duration, isPreview, order }] }] } }`. Fields include: `id, title, slug, description, longDescription, price, level, category, thumbnailUrl, previewVideoUrl, instructorBio, isFree, reviewCount, averageRating`.

NOTE: `longDescription` and `previewVideoUrl` and `instructorBio` are all available from the API. `videoUrl` on individual lessons is deliberately excluded for the public API (only `isPreview` flag exposed).

#### GET /api/courses/[slug]/reviews Response Shape

Returns `PaginatedResponse<{ id, rating, title, content, createdAt, user: { name, avatarUrl } }>` with `{ items, total, page, pageSize, hasMore }`.

#### POST /api/checkout/[courseSlug] Flow

Body: validated by `courseCheckoutSchema`. Free courses create enrollment directly + send email. Paid courses create Polar checkout session with `successUrl` = `/dashboard?checkout=success`. Requires authentication.

#### GET /api/enrollments/[courseId] Response

Returns `{ enrolled: boolean, enrollment: { id, purchasedAt, expiresAt } | null }`. Requires authentication.

### 1.2 Entity Hooks & Types (fully implemented)

| Entity             | File                                                                             | Exports                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Course types       | `/Users/jade/projects/vibeAcademy/src/entities/course/model/types.ts`            | `CourseLevel`, `CourseSummary`, `CourseSummaryWithStats`, `CourseDetail`, `CourseListParams`             |
| useCourse hook     | `/Users/jade/projects/vibeAcademy/src/entities/course/api/use-course.ts`         | `useCourse(slug)` -- fetches `/api/courses/{slug}`, returns `{ course: CourseDetail, error, isLoading }` |
| useCourses hook    | `/Users/jade/projects/vibeAcademy/src/entities/course/api/use-courses.ts`        | `useCourses(params?)` -- fetches `/api/courses`                                                          |
| Enrollment types   | `/Users/jade/projects/vibeAcademy/src/entities/enrollment/model/types.ts`        | `EnrollmentCheckResponse`, `EnrollmentWithCourse`, `EnrollRequest`                                       |
| useEnrollment hook | `/Users/jade/projects/vibeAcademy/src/entities/enrollment/api/use-enrollment.ts` | `useEnrollment(courseId)` -- returns `{ enrolled, error, isLoading, mutate }`                            |
| Review types       | `/Users/jade/projects/vibeAcademy/src/entities/review/model/types.ts`            | `ReviewWithUser`, `ReviewListParams`, `CreateReviewRequest`                                              |
| useReviews hook    | `/Users/jade/projects/vibeAcademy/src/entities/review/api/use-reviews.ts`        | `useReviews(params)` -- fetches `/api/reviews?courseId=xxx`, paginated                                   |

**IMPORTANT DISCREPANCY**: `useEnrollment` fetches `/api/enrollments/check?courseId=xxx` but the actual API endpoint is `/api/enrollments/[courseId]` (path param, not query). The course detail page will need to use the correct endpoint or use the hook with awareness. For the detail page, it may be simpler to call `/api/enrollments/{courseId}` directly or create a new hook `useEnrollmentCheck(courseId)` that calls the correct endpoint.

### 1.3 DB Schema

| Table       | Key Fields                                                                                                                                               | File                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| courses     | id, title, slug, description, longDescription, price, level, category, thumbnailUrl, previewVideoUrl, instructorBio, isFree, isPublished, polarProductId | `/Users/jade/projects/vibeAcademy/src/db/schema/courses.ts`     |
| chapters    | id, courseId, title, order                                                                                                                               | `/Users/jade/projects/vibeAcademy/src/db/schema/chapters.ts`    |
| lessons     | id, chapterId, title, description, videoUrl, duration, isPreview, order                                                                                  | `/Users/jade/projects/vibeAcademy/src/db/schema/lessons.ts`     |
| enrollments | id, userId, courseId, paymentId, purchasedAt, expiresAt                                                                                                  | `/Users/jade/projects/vibeAcademy/src/db/schema/enrollments.ts` |
| reviews     | id, userId, courseId, rating, title, content, createdAt                                                                                                  | `/Users/jade/projects/vibeAcademy/src/db/schema/reviews.ts`     |
| coupons     | id, courseId, code, discountType, discountAmount, validFrom, validUntil, maxUses                                                                         | `/Users/jade/projects/vibeAcademy/src/db/schema/coupons.ts`     |

Relations defined in: `/Users/jade/projects/vibeAcademy/src/db/schema/index.ts`

### 1.4 Existing Widgets (reusable)

| Widget             | Exports                                                                                  | File                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| VideoPlayer        | `VideoPlayer`, `VideoPlayerProps` (src, poster, autoPlay, callbacks, startAt, className) | `/Users/jade/projects/vibeAcademy/src/widgets/video-player/index.ts` |
| CourseCard         | `CourseCard`, `CourseCardSkeleton`, `CoursesPageContent`                                 | `/Users/jade/projects/vibeAcademy/src/widgets/course-card/index.ts`  |
| ReviewsPageContent | Full review page with StarRating, ReviewCard, pagination                                 | `/Users/jade/projects/vibeAcademy/src/widgets/reviews/index.ts`      |

**VideoPlayer** supports HLS streaming via hls.js, native Safari HLS, regular video files. Has full custom controls (play/pause, seek, volume, playback rate, quality selection, fullscreen). Can be reused as-is for the preview video section.

**CourseCard** accepts `CourseSummaryWithStats` and renders a linked card with thumbnail, level badge, free badge, title, description, rating. Can be reused for the "Related Courses" section.

**StarRating** pattern exists inside `reviews-page-content.tsx` (lines 22-36) -- renders 5 stars with fill based on rating. This is currently NOT exported separately; will need to extract or duplicate for the course detail reviews section.

### 1.5 Shared UI Components Available

All from `/Users/jade/projects/vibeAcademy/src/shared/ui/index.ts`:

- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` -- Radix UI based, ready for curriculum section
- `Badge` -- for level/free/preview badges
- `Button` -- standard button
- `Card`, `CardContent` -- for review cards, purchase widget
- `Avatar`, `AvatarImage`, `AvatarFallback` -- for reviewer avatars, instructor
- `Skeleton` -- loading states
- `Separator` -- visual dividers
- `Progress` -- progress bar (could use for curriculum progress)
- `Tabs` -- could use for section navigation
- `Dialog` -- could use for video preview modal
- `generateSEO`, `JsonLd` -- SEO metadata generation

### 1.6 Existing Page Routes

The courses listing page exists at:

- `/Users/jade/projects/vibeAcademy/src/app/[locale]/(marketing)/courses/page.tsx`

There is NO `/courses/[slug]` page route yet -- this is what needs to be created.

Marketing layout at `/Users/jade/projects/vibeAcademy/src/app/[locale]/(marketing)/layout.tsx` wraps children with `<Header />` + `<Footer />` in a `flex min-h-screen flex-col` container.

---

## 2. Patterns Discovered

### 2.1 Marketing Page Pattern

```typescript
// src/app/[locale]/(marketing)/[page-name]/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { generateSEO } from "@/shared/ui";
import { SomeWidget } from "@/widgets/some-widget";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "someNamespace" });
  return generateSEO({ title: t("title"), description: t("description") });
}

export default async function SomePage({ params }: Props) {
  const { locale } = await params;
  return <SomeWidget locale={locale} />;
}
```

### 2.2 Dynamic Marketing Page Pattern (blog/[slug])

```typescript
// src/app/[locale]/(marketing)/blog/[slug]/page.tsx
interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  // fetch data, generate SEO
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  // render content
}
```

### 2.3 Widget Pattern (FSD)

```
widgets/
  widget-name/
    index.ts           # Public API barrel export
    ui/                # Component files
    api/               # SWR hooks specific to this widget
    model/             # Types
    config/            # Configuration
```

### 2.4 Client Component with i18n Pattern

```typescript
"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function MyComponent() {
  const t = useTranslations("namespace");
  return <div>{t("key")}</div>;
}
```

### 2.5 API Response Pattern

All API routes return `{ success: true, data: T }` or `{ success: false, error: { code, message } }`. SWR hooks access `data?.data` to unwrap.

### 2.6 SWR Hook Pattern

```typescript
"use client";
import useSWR from "swr";
export function useEntity(param: string | undefined) {
  const { data, error, isLoading } = useSWR(param ? `/api/entity/${param}` : null);
  return {
    entity: (data?.data as EntityType) ?? null,
    error,
    isLoading,
  };
}
```

### 2.7 Naming Conventions

| Item            | Convention                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| File names      | kebab-case (`course-card.tsx`, `use-course.ts`)                                                         |
| Component names | PascalCase (`CourseCard`, `VideoPlayer`)                                                                |
| Functions       | camelCase (`useCourse`, `handleCheckout`)                                                               |
| Types           | PascalCase with descriptive suffix (`CourseDetail`, `ReviewWithUser`)                                   |
| i18n keys       | dot-notation namespace (`course.curriculum`, `course.faq.title`)                                        |
| CSS             | Tailwind utility classes, semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`) |

---

## 3. i18n Key Analysis

### 3.1 Existing Keys (in `course` namespace)

The following keys already exist and can be used directly:

```
course.title                    "강의"
course.allCourses               "전체 강의"
course.level.beginner           "초급"
course.level.intermediate       "중급"
course.level.advanced           "고급"
course.price                    "가격"
course.free                     "무료"
course.currency                 "원"
course.lessons                  "{count}개 레슨"
course.totalDuration            "총 {hours}시간 {minutes}분"
course.students                 "{count}명 수강"
course.rating                   "평점 {score}"
course.reviewCount              "수강평 {count}개"
course.curriculum               "커리큘럼"
course.chapter                  "챕터"
course.lesson                   "레슨"
course.preview                  "미리보기"
course.enroll                   "수강하기"
course.enrolled                 "수강 중"
course.continueLearning         "이어서 학습하기"
course.buyNow                   "지금 구매하기"
course.includes                 "포함 사항"
course.lifetimeAccess           "평생 수강 가능"
course.certificate              "수료증 발급"
course.discussionAccess         "토론 참여"
course.techStack                "다루는 기술"
course.instructor.title         "강사 소개"
course.instructor.about         "소개"
course.faq.title                "자주 묻는 질문"
course.relatedCourses           "관련 강의"
course.categories.*             Category names
course.detail.hero.enrollCta    "수강 신청하기"
course.detail.hero.previewVideo "소개 영상 보기"
```

### 3.2 Missing Keys Needed

The following keys need to be added for the course detail page:

```
course.detail.meta.title        "{title} | vibeAcademy"  (or use generateSEO pattern)
course.detail.meta.description  Dynamic from course description
course.detail.hero.level        "난이도"
course.detail.hero.totalLessons "{count}개 레슨"  (maybe reuse course.lessons)
course.detail.hero.totalDuration "총 학습 시간"  (maybe reuse course.totalDuration)
course.detail.purchaseWidget.title  "수강 정보"
course.detail.purchaseWidget.originalPrice  "정가"  (can reuse checkout.originalPrice)
course.detail.purchaseWidget.enrollFree     "무료 수강하기"
course.detail.purchaseWidget.enrollPaid     "수강권 구매하기"
course.detail.purchaseWidget.loginRequired  "로그인 후 수강하기"
course.detail.curriculum.totalChapters "{count}개 챕터"
course.detail.curriculum.totalLessons "{count}개 레슨"
course.detail.curriculum.totalDuration "총 {hours}시간 {minutes}분"
course.detail.curriculum.previewBadge  "미리보기"  (reuse course.preview)
course.detail.reviews.title     "수강평"
course.detail.reviews.averageRating  "평균 별점"  (reuse review.averageRating)
course.detail.reviews.showMore  "더 보기"
course.detail.faq.items.*       FAQ questions and answers (hardcoded per-site or per-course)
course.detail.relatedCourses    "관련 강의"  (reuse course.relatedCourses)
course.detail.notFound          "강의를 찾을 수 없습니다"
course.detail.loadingError      "강의를 불러오는 중 오류가 발생했습니다"
```

Many of these can reuse existing keys. Minimal new keys needed:

- `course.detail.purchaseWidget.*` (widget-specific labels)
- `course.detail.faq.items.*` (FAQ Q&A pairs)
- `course.detail.curriculum.totalChapters`
- `course.detail.notFound`

---

## 4. What Needs to Be Built

### 4.1 Page Route (NEW)

**File**: `src/app/[locale]/(marketing)/courses/[slug]/page.tsx`

- Server component with `generateMetadata` (dynamic SEO from course data)
- Renders `CourseDetailContent` widget
- Passes `slug` and `locale` as props

### 4.2 Course Detail Widget (NEW)

**Location**: `src/widgets/course-detail/`

Structure:

```
src/widgets/course-detail/
  index.ts
  ui/
    course-detail-content.tsx    # Main orchestrator component
    course-hero.tsx              # Hero banner with title, level, stats
    preview-video-section.tsx    # Embedded VideoPlayer for preview
    purchase-widget.tsx          # Sticky sidebar/bottom purchase widget
    tech-stack-grid.tsx          # Technology icons grid
    curriculum-accordion.tsx     # Chapter/lesson accordion
    instructor-section.tsx       # Instructor bio
    course-reviews-section.tsx   # Review stats + paginated list
    course-faq-section.tsx       # FAQ accordion
    related-courses-section.tsx  # Related course cards
  model/
    types.ts                     # Widget-specific types if needed
  config/
    faq-data.ts                  # Default FAQ Q&A items
```

### 4.3 Component Details

#### CourseDetailContent (main orchestrator)

- Client component using `useCourse(slug)` hook
- Conditionally uses `useEnrollment(courseId)` (only if user logged in)
- Handles loading/error/not-found states
- Renders all sub-sections in order

#### CourseHero

- Course title, level badge, category badge
- Stats: totalLessons, totalDuration, averageRating, reviewCount
- CTA button (enroll/buy/continue learning)
- Thumbnail as background or hero image

#### PreviewVideoSection

- Uses existing `<VideoPlayer />` from `@/widgets/video-player`
- `src={course.previewVideoUrl}`, `poster={course.thumbnailUrl}`
- Only renders if `previewVideoUrl` is present

#### PurchaseWidget (Sticky)

- Desktop: sticky sidebar (`position: sticky; top: offset`)
- Mobile: fixed bottom bar
- Shows price (or "Free"), "Enroll" / "Buy Now" / "Continue Learning" based on enrollment state
- "Includes" list: lifetime access, certificate, discussion access
- Checkout flow: calls `POST /api/checkout/[courseSlug]` with `{}` body
- For free courses, enrollment happens immediately; for paid, redirects to Polar checkout URL
- If not logged in, show "Login to enroll" with redirect

#### TechStackGrid

- Renders from `longDescription` or a dedicated field
- NOTE: courses table does not have a `techStack` field. Options:
  1. Parse from `longDescription` (markdown)
  2. Add a `techStack` JSON field to courses table (requires migration)
  3. Use hardcoded mapping per category
  - Recommendation: Skip for MVP or parse from longDescription

#### CurriculumAccordion

- Uses shadcn `<Accordion>` component
- Maps `chapters` array, each chapter is an accordion item
- Lists lessons inside with: title, duration (formatted), isPreview badge
- Shows total chapters/lessons/duration summary at top

#### InstructorSection

- Renders `course.instructorBio` as markdown or plain text
- Could add instructor avatar (not in DB -- would need to hardcode or add field)
- For now: simple bio text with a heading

#### CourseReviewsSection

- Shows average rating + total count summary
- Fetches reviews via `/api/courses/[slug]/reviews` (already exists)
- Uses a dedicated hook or inline SWR call for slug-based reviews
- Renders StarRating + ReviewCard list
- "Show more" button or link to full reviews page
- NOTE: The existing `useReviews` hook uses `courseId` (not slug). The slug-based API at `/api/courses/[slug]/reviews` is different from `/api/reviews?courseId=xxx`. Should create a new `useCourseReviews(slug)` hook or use inline SWR.

#### CourseFaqSection

- Uses shadcn `<Accordion>` component
- FAQ data: site-wide defaults (refund, study period, prerequisites, certificate)
- Translation keys: `course.detail.faq.items.{n}.q` and `.a`

#### RelatedCoursesSection

- Fetches courses in same category using `useCourses({ category })`
- Filters out current course
- Renders with existing `<CourseCard />` widget
- Grid: 1-3 columns responsive

### 4.4 New SWR Hook Needed

**`useCourseReviews(slug, page?, pageSize?)`** -- fetches `GET /api/courses/[slug]/reviews`

Location: `src/entities/review/api/use-course-reviews.ts` or inside the widget.

### 4.5 i18n Keys to Add

Both `ko/common.json` and `en/common.json` need new keys under `course.detail.*`:

```json
{
  "course": {
    "detail": {
      "hero": {
        "enrollCta": "수강 신청하기",
        "previewVideo": "소개 영상 보기"
      },
      "purchaseWidget": {
        "title": "수강 정보",
        "enrollFree": "무료 수강하기",
        "enrollPaid": "수강권 구매하기",
        "loginRequired": "로그인 후 수강하기",
        "processing": "처리 중..."
      },
      "curriculum": {
        "totalChapters": "{count}개 챕터",
        "expandAll": "모두 펼치기",
        "collapseAll": "모두 접기"
      },
      "reviews": {
        "showMore": "수강평 더 보기"
      },
      "faq": {
        "items": {
          "0": {
            "q": "수강 기간에 제한이 있나요?",
            "a": "아니요, 한 번 등록하면 평생 수강 가능합니다."
          },
          "1": {
            "q": "환불은 어떻게 하나요?",
            "a": "구매 후 7일 이내, 5개 영상 미만 시청 시 환불 가능합니다."
          },
          "2": {
            "q": "수료증이 발급되나요?",
            "a": "네, 모든 레슨을 완료하면 수료증이 발급됩니다."
          },
          "3": {
            "q": "질문은 어디에 할 수 있나요?",
            "a": "각 레슨의 토론 패널에서 질문하실 수 있습니다."
          }
        }
      },
      "notFound": "강의를 찾을 수 없습니다",
      "notFoundDescription": "요청하신 강의가 존재하지 않거나 비공개 상태입니다.",
      "errorTitle": "강의를 불러올 수 없습니다",
      "errorDescription": "잠시 후 다시 시도해 주세요."
    }
  }
}
```

Note: `course.detail.hero.enrollCta` and `course.detail.hero.previewVideo` already exist.

---

## 5. Dependency and Impact Analysis

### 5.1 Direct Dependencies (imports the detail page will use)

| Dependency                                                                | From                                            |
| ------------------------------------------------------------------------- | ----------------------------------------------- |
| `useCourse`                                                               | `@/entities/course`                             |
| `useEnrollment`                                                           | `@/entities/enrollment` (needs fix or new hook) |
| `VideoPlayer`                                                             | `@/widgets/video-player`                        |
| `CourseCard`                                                              | `@/widgets/course-card`                         |
| `useCourses`                                                              | `@/entities/course` (for related courses)       |
| `Accordion`, `Badge`, `Button`, `Card`, `Avatar`, `Skeleton`, `Separator` | `@/shared/ui`                                   |
| `generateSEO`, `JsonLd`                                                   | `@/shared/ui`                                   |
| `Link`                                                                    | `@/i18n/navigation`                             |
| `useTranslations`                                                         | `next-intl`                                     |
| `Star` (icon)                                                             | `lucide-react`                                  |
| `cn`                                                                      | `@/shared/lib/cn`                               |

### 5.2 useEnrollment Fix

The existing `useEnrollment` hook fetches `/api/enrollments/check?courseId=xxx` but the API endpoint is actually `/api/enrollments/[courseId]` (REST path param). Options:

1. Fix `useEnrollment` to call `/api/enrollments/${courseId}` -- PREFERRED, aligns with actual API
2. Create a new hook -- adds duplication

### 5.3 Review Hook for Slug-Based API

The existing `useReviews` uses `courseId` and calls `/api/reviews?courseId=xxx`. The course detail page has the slug, not the ID, until `useCourse` resolves. Two options:

1. After `useCourse` resolves, use `course.id` with existing `useReviews` -- but this calls `/api/reviews` which may be different from `/api/courses/[slug]/reviews`
2. Create a new `useCourseReviews(slug)` hook calling `/api/courses/${slug}/reviews` -- PREFERRED, cleaner

### 5.4 Checkout Integration

The `POST /api/checkout/[courseSlug]` route expects:

- Authenticated user
- Body validated by `courseCheckoutSchema` (from `src/shared/lib/validations/lecture.ts`)
- Returns `{ enrolled: true, enrollmentId }` for free courses
- Returns `{ checkoutUrl }` for paid courses (redirect to Polar)

The purchase widget needs to:

1. Check auth state
2. Call checkout API
3. Handle free (revalidate enrollment) vs paid (redirect to checkoutUrl)

---

## 6. Recommended Approach

### Step 1: Add i18n Keys

- Add `course.detail.*` keys to both `ko/common.json` and `en/common.json`
- Minimal set focused on purchase widget, curriculum, FAQ, and error states

### Step 2: Fix useEnrollment Hook

- Update `useEnrollment` to call `/api/enrollments/${courseId}` instead of `/api/enrollments/check?courseId=xxx`
- Response shape already matches: `{ enrolled: boolean, enrollment: {...} | null }`

### Step 3: Create useCourseReviews Hook

- New file: `src/entities/review/api/use-course-reviews.ts`
- Fetches `GET /api/courses/${slug}/reviews?page=X&pageSize=Y`
- Export from `src/entities/review/index.ts`

### Step 4: Create Course Detail Widget

- New directory: `src/widgets/course-detail/`
- Build sub-components following the widget pattern
- Orchestrator component: `CourseDetailContent`
- Reuse: `VideoPlayer`, `CourseCard`, `Accordion` from shadcn
- Desktop layout: 2-column (content left, sticky purchase widget right)
- Mobile layout: single column with fixed bottom purchase bar

### Step 5: Create Page Route

- New file: `src/app/[locale]/(marketing)/courses/[slug]/page.tsx`
- Server component with dynamic SEO metadata
- Delegates to `CourseDetailContent` widget

### Step 6: Test

- Loading, error, not-found states
- Free course enrollment flow
- Paid course checkout redirect
- Responsive layout (mobile sticky bottom, desktop sticky sidebar)
- Accordion expand/collapse
- Video player preview
- Review pagination
- Related courses display

---

## 7. Architecture Notes

### Layout

- The page sits inside `(marketing)` route group -- gets Header + Footer automatically
- Two-column layout on desktop: main content (8/12) + sticky sidebar (4/12)
- Mobile: single column, purchase widget fixed at bottom

### Data Flow

```
Page (server) --> CourseDetailContent (client)
  --> useCourse(slug) --> GET /api/courses/[slug]
  --> useEnrollment(courseId) --> GET /api/enrollments/[courseId]  [auth required, conditional]
  --> useCourseReviews(slug) --> GET /api/courses/[slug]/reviews
  --> useCourses({ category }) --> GET /api/courses?category=xxx  [for related courses]
  --> POST /api/checkout/[courseSlug]  [on purchase button click]
```

### Sticky Widget Implementation

```css
/* Desktop */
.purchase-widget {
  position: sticky;
  top: 5rem; /* below header */
}

/* Mobile */
.purchase-bar-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
}
```

### Duration Formatting Utility

The API returns `totalDuration` in seconds. Need a `formatDuration(seconds)` utility to display "Xh Ym".
Can add to `src/shared/lib/format.ts` or inline in the widget.

---

## 8. Files Summary

### Existing (to reuse/modify)

- `/Users/jade/projects/vibeAcademy/src/entities/course/api/use-course.ts` -- SWR hook for course detail
- `/Users/jade/projects/vibeAcademy/src/entities/course/model/types.ts` -- CourseDetail type
- `/Users/jade/projects/vibeAcademy/src/entities/enrollment/api/use-enrollment.ts` -- NEEDS FIX (wrong endpoint)
- `/Users/jade/projects/vibeAcademy/src/entities/review/index.ts` -- needs new export
- `/Users/jade/projects/vibeAcademy/src/widgets/video-player/index.ts` -- VideoPlayer reuse
- `/Users/jade/projects/vibeAcademy/src/widgets/course-card/index.ts` -- CourseCard reuse
- `/Users/jade/projects/vibeAcademy/src/shared/ui/accordion.tsx` -- Accordion component
- `/Users/jade/projects/vibeAcademy/src/shared/ui/index.ts` -- all UI exports
- `/Users/jade/projects/vibeAcademy/public/locales/ko/common.json` -- i18n keys to add
- `/Users/jade/projects/vibeAcademy/public/locales/en/common.json` -- i18n keys to add

### New files to create

- `src/app/[locale]/(marketing)/courses/[slug]/page.tsx` -- page route
- `src/widgets/course-detail/index.ts` -- barrel export
- `src/widgets/course-detail/ui/course-detail-content.tsx` -- main widget
- `src/widgets/course-detail/ui/course-hero.tsx` -- hero section
- `src/widgets/course-detail/ui/preview-video-section.tsx` -- video embed
- `src/widgets/course-detail/ui/purchase-widget.tsx` -- sticky buy widget
- `src/widgets/course-detail/ui/curriculum-accordion.tsx` -- chapter/lesson tree
- `src/widgets/course-detail/ui/instructor-section.tsx` -- instructor bio
- `src/widgets/course-detail/ui/course-reviews-section.tsx` -- reviews section
- `src/widgets/course-detail/ui/course-faq-section.tsx` -- FAQ accordion
- `src/widgets/course-detail/ui/related-courses-section.tsx` -- related courses grid
- `src/entities/review/api/use-course-reviews.ts` -- new SWR hook
