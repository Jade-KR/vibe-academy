# Exploration Results: Progress Tracking System

> Task: task-014
> Explored at: 2026-02-03
> Scope: Auto-save position every 5s, auto-complete at 90%, manual complete button, chapter/course progress calculation

## Related Files

### Directly Related (Existing Infrastructure)

- `/Users/jade/projects/vibeAcademy/src/db/schema/progress.ts` -- DB table: `progress(id, userId, lessonId, completed, position, updatedAt)` with unique constraint on `(userId, lessonId)` and indexes on each FK
- `/Users/jade/projects/vibeAcademy/src/entities/progress/model/types.ts` -- Types: `ProgressRecord`, `UpdateProgressRequest`, `CourseProgress`, `LessonProgress`, `CourseProgressWithLessons`
- `/Users/jade/projects/vibeAcademy/src/entities/progress/api/use-progress.ts` -- SWR hook `useProgress(courseId)` fetching `GET /api/progress?courseId=xxx` -- **NOTE: This GET endpoint does NOT exist yet**
- `/Users/jade/projects/vibeAcademy/src/entities/progress/index.ts` -- Barrel export for types and `useProgress`
- `/Users/jade/projects/vibeAcademy/src/app/api/progress/[lessonId]/route.ts` -- `PATCH /api/progress/[lessonId]` -- upserts progress row, accepts `{ completed?: boolean, position?: number }`, validates with `progressUpdateSchema`, checks auth + enrollment
- `/Users/jade/projects/vibeAcademy/src/shared/lib/validations/lecture.ts` -- `progressUpdateSchema`: Zod schema requiring at least one of `completed` (boolean) or `position` (int >= 0)

### Curriculum API (Returns Progress Data)

- `/Users/jade/projects/vibeAcademy/src/app/api/learn/[courseSlug]/route.ts` -- `GET /api/learn/[courseSlug]` returns `{ course, chapters[], progress: { totalLessons, completedLessons, percent } }` with per-lesson `completed` and `position` fields merged into curriculum
- `/Users/jade/projects/vibeAcademy/src/app/api/learn/[courseSlug]/lessons/[lessonId]/route.ts` -- `GET /api/learn/[courseSlug]/lessons/[lessonId]` returns single lesson detail with video URL (R2), auth/enrollment check (skip for preview lessons)

### Video Player Widget

- `/Users/jade/projects/vibeAcademy/src/widgets/video-player/ui/video-player.tsx` -- Full HLS-capable video player component
- `/Users/jade/projects/vibeAcademy/src/widgets/video-player/ui/video-controls.tsx` -- Custom video controls (play, seek, volume, speed, quality, fullscreen)
- `/Users/jade/projects/vibeAcademy/src/widgets/video-player/index.ts` -- Barrel: exports `VideoPlayer` and `VideoPlayerProps`

### Lesson Entity

- `/Users/jade/projects/vibeAcademy/src/entities/lesson/model/types.ts` -- `LessonSummary`, `ChapterWithLessons`, `LessonDetail` (extends Lesson with chapterTitle, courseSlug, courseTitle)
- `/Users/jade/projects/vibeAcademy/src/entities/lesson/api/use-lesson.ts` -- `useLesson(lessonId)` SWR hook
- `/Users/jade/projects/vibeAcademy/src/entities/lesson/api/use-lessons.ts` -- `useLessons(courseSlug)` SWR hook
- `/Users/jade/projects/vibeAcademy/src/entities/lesson/index.ts` -- Barrel export

### Shared API Utilities

- `/Users/jade/projects/vibeAcademy/src/shared/lib/api/response.ts` -- `successResponse()`, `errorResponse()`, `zodErrorResponse()`
- `/Users/jade/projects/vibeAcademy/src/shared/lib/api/get-db-user.ts` -- Auth helper
- `/Users/jade/projects/vibeAcademy/src/shared/lib/api/enrollment-check.ts` -- `verifyLessonEnrollment(lessonId, userId)` returns enrollment status with course context

### i18n Keys

- `/Users/jade/projects/vibeAcademy/public/locales/ko/common.json` -- Korean translations
- `/Users/jade/projects/vibeAcademy/public/locales/en/common.json` -- English translations

## Discovered Patterns

### VideoPlayer Callback Props (Hook Points)

```typescript
// src/widgets/video-player/ui/video-player.tsx
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;  // fires on every browser timeupdate event (~250ms)
  onEnded?: () => void;                                             // fires when video reaches the end
  onProgress?: (percent: number) => void;                           // fires with (currentTime/duration)*100
  startAt?: number;                                                 // resume position in seconds
  className?: string;
}
```

Key detail: `onTimeUpdate` and `onProgress` fire frequently (every ~250ms browser timeupdate). The auto-save must throttle/debounce to 5-second intervals.

### Progress PATCH API Pattern

```typescript
// PATCH /api/progress/[lessonId]
// Request body (validated by progressUpdateSchema):
{ completed?: boolean, position?: number }

// Response on success:
{ success: true, data: { id, completed, position, updatedAt } }

// Uses upsert: INSERT ... ON CONFLICT (userId, lessonId) DO UPDATE
// TODO comment in code: "Rate limiting -- progress auto-saves every 5s, so ~12 req/min per user is expected."
```

### Curriculum API Response Shape

```typescript
// GET /api/learn/[courseSlug]
{
  course: { id, title, slug },
  chapters: [
    {
      id, title, order,
      lessons: [
        { id, title, duration, isPreview, order, completed: boolean, position: number }
      ]
    }
  ],
  progress: { totalLessons, completedLessons, percent }
}
```

This already computes course-level progress. Chapter-level progress must be calculated client-side from the lessons within each chapter.

### DB Schema Details

```
progress table:
  id          UUID PK (auto-generated)
  userId      UUID FK -> users.id (cascade delete) NOT NULL
  lessonId    UUID FK -> lessons.id (cascade delete) NOT NULL
  completed   BOOLEAN default false NOT NULL
  position    INTEGER default 0 NOT NULL (seconds into video)
  updatedAt   TIMESTAMP WITH TZ default now() NOT NULL

  UNIQUE(userId, lessonId)
  INDEX on userId
  INDEX on lessonId
```

`position` is stored as an integer (seconds). The video player's `onTimeUpdate` provides float seconds -- truncate to int before sending.

### SWR Fetcher Pattern

All SWR hooks rely on a global fetcher configured in the SWR provider. Response shape is `{ success: true, data: T }` and hooks access `data?.data`.

## What Does NOT Exist Yet

1. **No `GET /api/progress` route** -- `useProgress(courseId)` fetches from `/api/progress?courseId=xxx` but no route handler exists. However, the curriculum API at `GET /api/learn/[courseSlug]` already returns all progress data merged in. Decision: either create a standalone progress GET endpoint OR refactor `useProgress` to use the curriculum API.

2. **No learn page** -- No `src/app/[locale]/(dashboard)/learn/` directory exists. No page component for the learning view.

3. **No `src/features/learn/` or `src/features/progress/`** -- No feature-level code for progress saving logic (auto-save hook, auto-complete logic, manual complete action).

4. **No auto-save hook** -- The `onTimeUpdate`/`onProgress` callbacks are wired in the video player but nobody consumes them yet.

5. **No chapter-level progress calculation** -- The curriculum API returns per-lesson `completed` booleans, but chapter progress aggregation is not computed anywhere.

## i18n Keys Available (learn namespace)

All necessary keys exist in both ko and en locales:

| Key | Korean | English |
|-----|--------|---------|
| `learn.progress` | 진도율 | Progress |
| `learn.progressPercent` | {percent}% 완료 | {percent}% complete |
| `learn.complete` | 완료 | Complete |
| `learn.completed` | 학습 완료 | Completed |
| `learn.incomplete` | 미완료 | Incomplete |
| `learn.markComplete` | 완료하고 다음으로 | Complete & Next |
| `learn.nextLesson` | 다음 레슨 | Next Lesson |
| `learn.previousLesson` | 이전 레슨 | Previous Lesson |
| `learn.currentLesson` | 현재 레슨 | Current Lesson |
| `learn.resumeAt` | 이어보기 | Resume |
| `learn.autoComplete` | 자동 완료됨 | Auto-completed |
| `learn.chapterProgress` | 챕터 진도 | Chapter Progress |
| `learn.overallProgress` | 전체 진도 | Overall Progress |

## Conventions Observed

| Item | Convention |
|------|-----------|
| Filename | kebab-case (e.g., `video-player.tsx`, `use-progress.ts`) |
| Component | PascalCase named export (e.g., `VideoPlayer`, `VideoControls`) |
| Hook | camelCase with `use` prefix (e.g., `useProgress`, `useLesson`) |
| Types | PascalCase (e.g., `LessonProgress`, `CourseProgressWithLessons`) |
| API response | `successResponse(data)` / `errorResponse(code, message, status)` |
| Validation | Zod schemas in `src/shared/lib/validations/` |
| SWR hooks | In `entity/api/` folder, use conditional key pattern `key ? url : null` |
| Barrel exports | `index.ts` with explicit named exports |

## Recommended Implementation Approach

### 1. Create `useProgressSaver` Hook (Feature Layer)

Location: `src/features/progress/` or inline in the learn page widget.

```typescript
// Core logic:
// - Accepts lessonId, courseSlug
// - Tracks lastSavedPosition via useRef
// - onTimeUpdate callback: throttle to 5s interval, PATCH position
// - onProgress callback: if percent >= 90 && !completed, auto-complete
// - onEnded callback: mark completed
// - Expose manualComplete() for the button
// - After any PATCH, call mutate() on curriculum SWR key to revalidate
```

Key design decisions:
- **Throttle, not debounce**: Use a ref-based 5-second interval (`Date.now() - lastSaveTime >= 5000`) rather than `setTimeout` debounce, so saves happen at regular intervals during playback.
- **Optimistic position**: No need for optimistic UI on position saves -- the user sees the video time directly.
- **Auto-complete at 90%**: Check `(currentTime / duration) >= 0.9` in `onTimeUpdate`. Send `{ completed: true, position }` once. Use a ref flag to prevent duplicate auto-complete calls.
- **Manual complete button**: Calls `PATCH /api/progress/[lessonId]` with `{ completed: true }`, then mutates SWR cache, then navigates to next lesson.

### 2. Chapter/Course Progress Calculation

The curriculum API already returns `progress.percent` for course-level progress. For chapter-level:

```typescript
// Client-side calculation from curriculum data:
const chapterProgress = chapter.lessons.filter(l => l.completed).length / chapter.lessons.length * 100;
```

No additional API needed.

### 3. Missing GET `/api/progress` Route

The `useProgress(courseId)` hook references a non-existent endpoint. Two options:
- **Option A**: Create `src/app/api/progress/route.ts` with a GET handler that queries progress by courseId.
- **Option B** (Recommended): Remove/refactor `useProgress` since the curriculum API (`GET /api/learn/[courseSlug]`) already returns all progress data. Use a single SWR key for the curriculum and derive progress from it.

### 4. Files to Create/Modify

**Create:**
- `src/features/progress/model/use-progress-saver.ts` -- Auto-save hook with throttled PATCH calls
- `src/features/progress/index.ts` -- Barrel export

**Modify:**
- Wherever the learn page/widget will consume `VideoPlayer` -- wire up `onTimeUpdate`, `onProgress`, `onEnded`, `startAt` via the new hook
- `src/entities/progress/api/use-progress.ts` -- Either fix the endpoint reference or refactor to use curriculum API data
