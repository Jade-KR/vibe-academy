# Exploration Results: task-013 (Learn Page 3-Column Layout)

> Task: task-013
> Explored at: 2026-02-03
> Duration: ~5 min

## 1. Page Route Structure

### Current State

- **No learn route exists yet.** There is no `src/app/[locale]/*/learn/` directory.
- Route groups under `src/app/[locale]/` are: `(auth)`, `(dashboard)`, `(marketing)`.
- Middleware at `src/middleware.ts` already protects `/learn` as a PROTECTED_ROUTE (line 9).

### Where to Create

The learn page needs its own route group or can be nested under `(dashboard)`. However, since the learn page has a completely different layout (no TopBar, no container padding -- full-width 3-column layout), it is best to either:

- **Option A (Recommended):** Create a new route group `(learn)` under `src/app/[locale]/(learn)/` with its own `layout.tsx` (minimal -- no TopBar, no container).
- **Option B:** Place it under `(dashboard)` but override layout via a nested layout.

**Recommended:** Option A -- create `src/app/[locale]/(learn)/learn/[courseSlug]/[lessonId]/page.tsx`.

### Route Pattern

```
/[locale]/learn/[courseSlug]/[lessonId]
e.g. /ko/learn/react-fundamentals/abc-123
```

## 2. APIs (Already Exist)

### GET /api/learn/[courseSlug] -- Curriculum with Progress

- **File:** `src/app/api/learn/[courseSlug]/route.ts`
- Returns: `{ course, chapters[], progress: { totalLessons, completedLessons, percent } }`
- Each lesson includes: `id, title, duration, isPreview, order, completed, position`
- Auth + enrollment verification built in (returns 403 if not enrolled)

### GET /api/learn/[courseSlug]/lessons/[lessonId] -- Lesson Detail with Video

- **File:** `src/app/api/learn/[courseSlug]/lessons/[lessonId]/route.ts`
- Returns: `{ id, title, description, videoUrl, duration, isPreview, order }`
- `videoUrl` is generated via `getVideoUrl()` from `@/shared/api/r2` (public domain or presigned)
- Enrollment check (skipped for preview lessons)
- Note: `description` is a text field from DB -- may contain MDX content

### PATCH /api/progress/[lessonId] -- Save Progress

- **File:** `src/app/api/progress/[lessonId]/route.ts`
- Body: `{ completed?: boolean, position?: number }`
- Upserts progress record
- Auth + enrollment verification

## 3. Existing Hooks & Types

### From `@/entities/progress` (index.ts)

- `useCurriculum(courseSlug)` -- SWR hook fetching `/api/learn/[courseSlug]`
  - Returns: `{ course, chapters[], progress, error, isLoading, mutate }`
  - Types: `CurriculumLesson`, `CurriculumChapter`, `CurriculumCourse`, `CurriculumProgress`, `CurriculumData`
- `useProgress(courseId)` -- **DEPRECATED**, do not use

### From `@/features/progress` (index.ts)

- `useProgressSaver({ lessonId, courseSlug, initialPosition, initialCompleted })`
  - Returns: `{ handleTimeUpdate, handleEnded, manualComplete, isCompleted, isSaving }`
  - Throttled position save every 5s
  - Auto-complete at 90% threshold
  - Manual complete for "Complete & Next" button
  - Revalidates curriculum SWR cache on completion
- `findNextLesson(chapters, currentLessonId)` -- returns `{ lessonId, lessonTitle, chapterTitle } | null`
- `calculateChapterProgress(chapters)` -- returns `ChapterProgressResult[]`
- `calculateCourseProgress(chapters)` -- returns `{ totalLessons, completedLessons, percent }`

### From `@/entities/lesson` (index.ts)

- `useLesson(lessonId)` -- fetches `/api/lessons/[id]` (different endpoint than learn API)
  - **Note:** This hook fetches from `/api/lessons/${lessonId}` which is a DIFFERENT endpoint than `/api/learn/[courseSlug]/lessons/[lessonId]`. For the learn page, we need to use the learn API endpoint to get video URLs (presigned).
  - The learn page should create a **dedicated hook** or use SWR directly with the learn API lesson endpoint.

### From `@/entities/enrollment` (index.ts)

- `useEnrollment(courseId)` -- checks enrollment via `/api/enrollments/[courseId]`
  - Returns: `{ enrolled, error, isLoading, mutate }`
  - Note: The curriculum API already checks enrollment (returns 403), so we can detect enrollment failure from the curriculum fetch error rather than a separate call.

### From `@/entities/discussion` (index.ts)

- `useDiscussions({ lessonId, page, pageSize })` -- used by DiscussionPanel

## 4. Existing Widgets

### VideoPlayer (`@/widgets/video-player`)

- **Files:** `src/widgets/video-player/ui/video-player.tsx`, `video-controls.tsx`
- Props: `{ src, poster?, autoPlay?, onTimeUpdate?, onEnded?, onProgress?, startAt?, className? }`
- Supports HLS.js (`.m3u8`) and native video
- Has keyboard shortcuts, fullscreen, quality selection, buffering overlay
- Custom controls with seek bar, volume, playback rate, settings menu
- **Ready to use** -- wire `onTimeUpdate` and `onEnded` to `useProgressSaver`

### DiscussionPanel (`@/widgets/discussion-panel`)

- **File:** `src/widgets/discussion-panel/ui/discussion-panel.tsx`
- Props: `{ lessonId: string }`
- Full CRUD: create/edit/delete discussions, comment threads, pagination
- Uses `useDiscussions` from `@/entities/discussion`
- **Ready to use** -- just pass `lessonId`

### Progress (shared UI)

- **File:** `src/shared/ui/progress.tsx`
- Simple progress bar component: `<Progress value={percent} />`

### Sheet (shared UI)

- **File:** `src/shared/ui/sheet.tsx`
- Bottom sheet / side sheet using Radix Dialog
- Has `side` variants: `top`, `bottom`, `left`, `right`
- **Use for mobile bottom sheet** for curriculum/discussion panels

### MDX Components

- **File:** `src/widgets/blog/ui/mdx-components.tsx`
- `getMDXComponents()` returns styled h1-h4, p, a, code, pre, ul, ol, li, blockquote
- Blog uses `<MDXRemote source={...} components={getMDXComponents()} />` from `next-mdx-remote/rsc`
- **Note:** This is server-side rendering. For the learn page (client component), use `next-mdx-remote` client-side serialize + render, OR keep MDX rendering in a server component.

## 5. MDX / Code Highlighting

### Installed Packages

- `rehype-pretty-code: ^0.14.1` -- installed in package.json
- `next-mdx-remote: ^5.0.0` -- installed
- Blog pattern: `<MDXRemote source={post.content} components={getMDXComponents()} />`

### Lesson Description

- DB schema `lessons.description` is a `text` field -- can contain MDX
- API returns `description` as raw text from DB
- **Need to render** lesson description as MDX with `rehype-pretty-code` for code blocks

### Implementation Approach for MDX

Since the learn page main content is a client component (needs hooks for state management, video player interaction), but MDX rendering with `next-mdx-remote/rsc` is server-only:

- **Option A:** Create a separate server component for MDX rendering, pass serialized MDX as prop.
- **Option B:** Use `serialize` + `MDXRemote` from `next-mdx-remote` (client-compatible).
- **Option C:** Simply render the description as markdown using a lightweight client-side markdown renderer if MDX features aren't strictly needed.

**Recommended:** Option B -- Use `serialize()` from `next-mdx-remote/serialize` in the API route or a server action, then render with `MDXRemote` on the client. Or keep the MDX section as a server component island.

## 6. i18n Keys (Already Complete)

### `learn.*` namespace -- Both ko and en translations exist:

```
learn.title
learn.progress
learn.progressPercent          "{percent}% complete"
learn.complete
learn.completed
learn.incomplete
learn.markComplete             "Complete & Next"
learn.nextLesson
learn.previousLesson
learn.currentLesson
learn.resumeAt
learn.autoComplete
learn.chapterProgress
learn.overallProgress
learn.lastStudied
learn.sidebar.curriculum
learn.sidebar.discussion
learn.player.*                 (play, pause, volume, mute, etc.)
learn.notEnrolled
learn.notEnrolledDescription
learn.goToCourse
```

### Additional namespaces used:

- `common.*` for loading, error, retry, back, next
- `discussion.*` for discussion panel
- `course.*` for course-related labels

## 7. Layout Patterns

### Dashboard Layout (`src/app/[locale]/(dashboard)/layout.tsx`)

```tsx
<div className="min-h-screen">
  <TopBar />
  <main className="container py-6">{children}</main>
</div>
```

### Marketing Layout (`src/app/[locale]/(marketing)/layout.tsx`)

```tsx
<div className="flex min-h-screen flex-col">
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
</div>
```

### Learn Page Layout (Needs to be Created)

The learn page needs a **completely different layout**:

- No header/footer (or minimal top bar)
- Full viewport height, no container padding
- 3-column layout filling the screen
- Responsive: on mobile, single column with bottom tab navigation

## 8. What Exists vs What Needs to Be Built

### EXISTS (Ready to Use)

| Component                       | Location                                                     | Status                         |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------ |
| Curriculum API                  | `src/app/api/learn/[courseSlug]/route.ts`                    | Complete                       |
| Lesson Detail API               | `src/app/api/learn/[courseSlug]/lessons/[lessonId]/route.ts` | Complete                       |
| Progress Save API               | `src/app/api/progress/[lessonId]/route.ts`                   | Complete                       |
| `useCurriculum` hook            | `@/entities/progress`                                        | Complete                       |
| `useProgressSaver` hook         | `@/features/progress`                                        | Complete                       |
| `findNextLesson` util           | `@/features/progress`                                        | Complete                       |
| `calculateChapterProgress` util | `@/features/progress`                                        | Complete                       |
| `VideoPlayer` widget            | `@/widgets/video-player`                                     | Complete                       |
| `DiscussionPanel` widget        | `@/widgets/discussion-panel`                                 | Complete                       |
| `Progress` bar UI               | `@/shared/ui`                                                | Complete                       |
| `Sheet` component               | `@/shared/ui`                                                | Complete                       |
| MDX components                  | `@/widgets/blog`                                             | Complete (reusable)            |
| i18n translations               | `public/locales/{ko,en}/common.json`                         | Complete (`learn.*` namespace) |
| Middleware protection           | `src/middleware.ts`                                          | `/learn` protected             |
| R2 video URL                    | `@/shared/api/r2`                                            | Complete                       |

### NEEDS TO BE BUILT

| Component                               | Location                                                          | Description                                             |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Learn route group + layout**          | `src/app/[locale]/(learn)/layout.tsx`                             | Minimal layout (no header/footer, full viewport)        |
| **Learn page**                          | `src/app/[locale]/(learn)/learn/[courseSlug]/[lessonId]/page.tsx` | Server component entry point                            |
| **LearnPageContent**                    | `src/pages/learn/` or `src/widgets/learn-layout/`                 | Client component orchestrating 3-column layout          |
| **CurriculumSidebar**                   | (part of learn layout widget)                                     | Left panel: chapter/lesson list with progress           |
| **LessonContent**                       | (part of learn layout widget)                                     | Center: video + MDX description + nav buttons           |
| **useLearnLesson** hook                 | New SWR hook                                                      | Fetch from `/api/learn/[courseSlug]/lessons/[lessonId]` |
| **findPreviousLesson** util             | Extend `@/features/progress`                                      | Mirror of `findNextLesson` for prev button              |
| **Panel toggle logic**                  | Custom hook or state in layout                                    | Toggle left/right panels with fluid resize              |
| **Mobile bottom sheet tabs**            | Using Sheet component                                             | Tab-based bottom sheet for curriculum/discussion        |
| **MDX renderer for lesson description** | Server or client component                                        | Render lesson.description with rehype-pretty-code       |

## 9. Conventions Observed

| Item               | Rule                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Filename           | kebab-case (`use-curriculum.ts`, `video-player.tsx`)                                        |
| Component          | PascalCase named export (`VideoPlayer`, `DiscussionPanel`)                                  |
| Function           | camelCase (`findNextLesson`, `calculateChapterProgress`)                                    |
| Type               | PascalCase + descriptive suffix (`CurriculumLesson`, `VideoPlayerProps`)                    |
| Hooks              | `use` prefix (`useCurriculum`, `useProgressSaver`)                                          |
| SWR pattern        | `useSWR(key)` with `data?.data` extraction                                                  |
| API response       | `successResponse(data)` / `errorResponse(code, message, status)`                            |
| Client directive   | `"use client"` at top of files using hooks                                                  |
| Imports            | Path aliases (`@/entities/...`, `@/shared/...`)                                             |
| i18n               | `useTranslations("namespace")` in client, `getTranslations("namespace")` in server          |
| Navigation         | `import { Link } from "@/i18n/navigation"` for locale-aware links                           |
| Tailwind dark mode | Semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted/50` |
| Widget structure   | `widget-name/index.ts` (barrel), `ui/` (components)                                         |

## 10. Recommended Approach

### File Structure

```
src/app/[locale]/(learn)/
  layout.tsx                                    # Minimal layout (no header, full viewport)
  learn/[courseSlug]/[lessonId]/
    page.tsx                                    # Server component (metadata + entry)

src/widgets/learn-layout/
  index.ts                                      # Barrel export
  ui/
    learn-layout.tsx                            # Main 3-column layout orchestrator
    curriculum-sidebar.tsx                      # Left panel
    lesson-content.tsx                          # Center panel (video + MDX + nav)
    lesson-mdx-renderer.tsx                     # MDX rendering component
    mobile-learn-tabs.tsx                       # Mobile bottom tabs

src/features/progress/
  lib/find-previous-lesson.ts                  # New: find previous lesson

src/entities/progress/
  api/use-learn-lesson.ts                      # New: SWR hook for learn lesson API
```

### Implementation Steps

1. **Create `(learn)` route group** with minimal layout (just providers, no TopBar/Header/Footer).
2. **Create the page** at `learn/[courseSlug]/[lessonId]/page.tsx` as a thin server component.
3. **Build `LearnLayout` widget** (`src/widgets/learn-layout/`):
   - Main component manages panel visibility state (left open/closed, right open/closed).
   - CSS Grid or Flexbox for 3-column layout with dynamic widths.
   - Left panel: 240px (or 0 when closed).
   - Center: fluid (flex-1).
   - Right panel: 320px (or 0 when closed).
4. **Build `CurriculumSidebar`**:
   - Uses `useCurriculum(courseSlug)`.
   - Renders chapters/lessons with accordion or collapsible sections.
   - Shows completion icons (check for completed, circle for incomplete).
   - Highlights current lesson.
   - Shows per-chapter and overall progress bars.
   - Each lesson is a Link to `/learn/[courseSlug]/[lessonId]`.
5. **Build `LessonContent`**:
   - Uses a new `useLearnLesson(courseSlug, lessonId)` hook or inline SWR.
   - Renders `VideoPlayer` with `src={lesson.videoUrl}`, wired to `useProgressSaver`.
   - Renders lesson description as MDX below the video.
   - Previous/Next lesson buttons using `findNextLesson` and a new `findPreviousLesson`.
   - "Complete & Next" button using `manualComplete` from `useProgressSaver`.
6. **Build mobile bottom tabs**:
   - On screens < lg, hide left and right panels.
   - Show bottom tab bar with Curriculum / Discussion tabs.
   - Each tab opens a Sheet (bottom side) with the panel content.
7. **Add `findPreviousLesson`** to `@/features/progress/lib/` (mirror of findNextLesson).
8. **Add `useLearnLesson` hook** to `@/entities/progress/api/` fetching `/api/learn/[courseSlug]/lessons/[lessonId]`.

### Key Wiring

```tsx
// In LessonContent:
const { handleTimeUpdate, handleEnded, manualComplete, isCompleted, isSaving } = useProgressSaver({
  lessonId,
  courseSlug,
  initialPosition: currentLesson?.position ?? 0,
  initialCompleted: currentLesson?.completed ?? false,
});

<VideoPlayer
  src={lesson.videoUrl}
  startAt={currentLesson?.position ?? 0}
  onTimeUpdate={handleTimeUpdate}
  onEnded={handleEnded}
/>;
```

### Enrollment Check Strategy

The curriculum API (`GET /api/learn/[courseSlug]`) already returns 403 if not enrolled. So:

1. If `useCurriculum` returns error with status 403, redirect to course detail page.
2. No need for a separate `useEnrollment` call on the learn page.

### MDX Rendering Strategy

Since `next-mdx-remote/rsc` is server-only and the learn page is heavily client-interactive:

- Use `next-mdx-remote` with `serialize()` in a utility function (or API-level).
- Pass serialized source to `<MDXRemote>` in a client component.
- Integrate `rehype-pretty-code` in the serialize options for code highlighting.
- Reuse `getMDXComponents()` from `@/widgets/blog` for consistent styling.
