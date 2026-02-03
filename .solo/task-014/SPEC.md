# Task-014: Progress Saving System -- Auto/Manual Complete + Progress Calculation

> Created: 2026-02-03
> Based on: exploration.md
> Estimated time: 3-4 hours

## Objective

Implement the progress saving system for the learn page. This includes a `useProgressSaver` hook that throttles position saves to 5-second intervals, auto-completes lessons at 90% watch threshold, provides a manual complete action for the "Complete & Next" button, and calculates chapter-level progress. The hook integrates with the existing `VideoPlayer` widget callbacks and the existing `PATCH /api/progress/[lessonId]` API endpoint.

This task is scoped to the **data layer and hook logic only**. The learn page UI (task-013) will consume these hooks.

## Applied Skills

### Scan Results
3 skills found (project: 3)

### Selected Skills

| Skill | Location | Reason |
|-------|----------|--------|
| vercel-react-best-practices | project | Hook design: ref-based throttling (rerender-use-ref-transient-values), stable callbacks (rerender-functional-setstate), no unnecessary re-renders |
| supabase-postgres-best-practices | project | Upsert pattern already used, index coverage for progress queries |

### Excluded Skills

| Skill | Reason |
|-------|--------|
| web-design-guidelines | No UI work in this task -- hook and API logic only |

---

## Architecture

### Data Flow

```
VideoPlayer
  |-- onTimeUpdate(currentTime, duration)  ~250ms from browser
  |-- onProgress(percent)                  ~250ms from browser
  |-- onEnded()                            once at video end
  |
  v
useProgressSaver hook (feature layer)
  |-- Ref-based 5s throttle  -->  PATCH /api/progress/[lessonId] { position }
  |-- 90% threshold check    -->  PATCH /api/progress/[lessonId] { completed: true, position }
  |-- manualComplete()        -->  PATCH /api/progress/[lessonId] { completed: true }
  |                                  + mutate curriculum SWR key
  |                                  + return next lesson info
  v
SWR cache (curriculum key: /api/learn/[courseSlug])
  |-- Revalidated after completed changes
  |-- Chapter progress derived client-side
```

### Key Design Decisions

1. **Throttle via refs, not timers**: Store `lastSaveTimestamp` in a `useRef`. On each `onTimeUpdate` call, check `Date.now() - lastSaveRef.current >= 5000`. This avoids setInterval cleanup issues and ties saves to actual playback activity. Aligns with `rerender-use-ref-transient-values` pattern -- position tracking is a transient value that should not trigger re-renders.

2. **Fire-and-forget position saves**: Position PATCH calls do not need to block or update UI state. Use `fetch()` without awaiting in the throttle callback. Errors are logged but do not interrupt playback.

3. **Auto-complete once at 90%**: Use a `hasAutoCompleted` ref flag. When `(currentTime / duration) >= 0.9` and flag is false, send `{ completed: true, position }`, set flag to true, and mutate the curriculum SWR cache. The flag resets when `lessonId` changes.

4. **Curriculum API as single source of truth**: The existing `GET /api/learn/[courseSlug]` already returns per-lesson `completed` and `position` fields plus course-level `progress.percent`. Instead of creating a separate GET progress endpoint, refactor `useProgress` to accept curriculum data and derive from it. This avoids a redundant API call.

5. **Chapter progress is pure computation**: `completedLessons / totalLessons` per chapter, calculated from curriculum data. Exposed as a utility function, not a separate API.

6. **Position is integer seconds**: `Math.floor(currentTime)` before sending to match the DB schema (`integer` type).

7. **Rate limit compliance**: 5-second interval = 12 requests/minute maximum. The existing TODO comment in the PATCH handler acknowledges this rate. No server-side rate limiting implementation needed in this task (the client-side throttle is the control).

---

## Implementation Plan

### Phase 1: `useProgressSaver` Hook (Core Logic)

**Goal**: Create the main hook that manages all progress saving behavior.

**Create**: `src/features/progress/model/use-progress-saver.ts`

```typescript
interface UseProgressSaverOptions {
  lessonId: string | undefined;
  courseSlug: string | undefined;
  initialPosition?: number;        // from curriculum data, for resume
  initialCompleted?: boolean;       // from curriculum data
}

interface UseProgressSaverReturn {
  // Callbacks to wire into VideoPlayer
  handleTimeUpdate: (currentTime: number, duration: number) => void;
  handleEnded: () => void;
  // Manual complete action
  manualComplete: () => Promise<void>;
  // State
  isCompleted: boolean;
  isSaving: boolean;               // true during manual complete only
}
```

Internal implementation details:
- `lastSaveTimestampRef = useRef(0)` -- tracks last successful position save time
- `hasAutoCompletedRef = useRef(false)` -- prevents duplicate auto-complete calls
- `isCompletedRef = useRef(initialCompleted)` -- tracks completed state without re-renders for throttle checks
- `positionRef = useRef(initialPosition)` -- current position for fire-and-forget saves
- `[isCompleted, setIsCompleted] = useState(initialCompleted)` -- for UI display only
- `[isSaving, setIsSaving] = useState(false)` -- loading state for manual complete button

`handleTimeUpdate(currentTime, duration)`:
1. Store `Math.floor(currentTime)` in `positionRef`
2. If `Date.now() - lastSaveTimestampRef.current >= 5000` and `lessonId` defined:
   - Call `savePosition(lessonId, positionRef.current)` (fire-and-forget)
   - Update `lastSaveTimestampRef.current = Date.now()`
3. If `duration > 0` and `(currentTime / duration) >= 0.9` and `!hasAutoCompletedRef.current` and `!isCompletedRef.current`:
   - Set `hasAutoCompletedRef.current = true`
   - Call `saveCompleted(lessonId, positionRef.current)` (awaited for SWR mutate)
   - Set `isCompletedRef.current = true`, `setIsCompleted(true)`
   - Mutate curriculum SWR key

`handleEnded()`:
- If not already completed, call `saveCompleted(lessonId, positionRef.current)`
- Mutate curriculum SWR key

`manualComplete()`:
- `setIsSaving(true)`
- `saveCompleted(lessonId, positionRef.current)`
- Mutate curriculum SWR key
- `setIsCompleted(true)`
- `setIsSaving(false)`
- Return (caller navigates to next lesson)

Internal helpers (module-level or within hook):
- `savePosition(lessonId, position)`: `fetch(PATCH, { position })`
- `saveCompleted(lessonId, position)`: `fetch(PATCH, { completed: true, position })`

Reset logic: `useEffect` on `lessonId` change resets `hasAutoCompletedRef`, `lastSaveTimestampRef`, updates `isCompletedRef` and `positionRef` from new `initialCompleted`/`initialPosition`.

**Create**: `src/features/progress/index.ts`

Barrel export:
```typescript
export { useProgressSaver } from "./model/use-progress-saver";
export type { UseProgressSaverOptions, UseProgressSaverReturn } from "./model/use-progress-saver";
export { calculateChapterProgress, calculateCourseProgress } from "./lib/progress-calc";
export { findNextLesson } from "./lib/find-next-lesson";
```

### Phase 2: Progress Calculation Utilities

**Goal**: Pure functions for chapter and course progress calculation from curriculum data.

**Create**: `src/features/progress/lib/progress-calc.ts`

```typescript
interface ChapterProgressResult {
  chapterId: string;
  chapterTitle: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
}

/**
 * Calculate progress for each chapter from curriculum data.
 * @param chapters - Array from GET /api/learn/[courseSlug] response
 */
function calculateChapterProgress(
  chapters: Array<{ id: string; title: string; lessons: Array<{ completed: boolean }> }>
): ChapterProgressResult[];

/**
 * Calculate overall course progress from curriculum data.
 * Returns the same shape as the API's progress field.
 */
function calculateCourseProgress(
  chapters: Array<{ lessons: Array<{ completed: boolean }> }>
): { totalLessons: number; completedLessons: number; percent: number };
```

These are pure functions with no side effects. They derive progress from the curriculum data already fetched by `useLessons` or the curriculum API hook used in the learn page.

### Phase 3: Next Lesson Navigation Helper

**Goal**: Given the current lesson ID and curriculum chapters, find the next lesson in order.

**Create**: `src/features/progress/lib/find-next-lesson.ts`

```typescript
interface NextLessonResult {
  lessonId: string;
  lessonTitle: string;
  chapterTitle: string;
} | null;

/**
 * Find the next lesson after the given lessonId in curriculum order.
 * Traverses chapters in order, then lessons within each chapter.
 * Returns null if current lesson is the last one.
 */
function findNextLesson(
  chapters: Array<{ title: string; lessons: Array<{ id: string; title: string }> }>,
  currentLessonId: string
): NextLessonResult;
```

### Phase 4: Refactor `useProgress` Entity Hook

**Goal**: Fix the broken `useProgress` hook that references a non-existent GET endpoint. Refactor it to derive progress from the curriculum API instead.

**Modify**: `src/entities/progress/api/use-progress.ts`

Current state: Fetches from `GET /api/progress?courseId=xxx` which does not exist.

New approach: Replace with `useCurriculum(courseSlug)` that fetches `GET /api/learn/[courseSlug]` and exposes both curriculum structure and progress data. This becomes the single data-fetching hook for the learn page.

```typescript
"use client";

import useSWR from "swr";

interface CurriculumLesson {
  id: string;
  title: string;
  duration: number | null;
  isPreview: boolean;
  order: number;
  completed: boolean;
  position: number;
}

interface CurriculumChapter {
  id: string;
  title: string;
  order: number;
  lessons: CurriculumLesson[];
}

interface CurriculumData {
  course: { id: string; title: string; slug: string };
  chapters: CurriculumChapter[];
  progress: { totalLessons: number; completedLessons: number; percent: number };
}

export function useCurriculum(courseSlug: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    courseSlug ? `/api/learn/${courseSlug}` : null,
  );

  const curriculum = (data?.data as CurriculumData) ?? null;

  return {
    course: curriculum?.course ?? null,
    chapters: curriculum?.chapters ?? [],
    progress: curriculum?.progress ?? null,
    error,
    isLoading,
    mutate,
  };
}
```

**Modify**: `src/entities/progress/index.ts`

Update barrel exports to export both the new `useCurriculum` and keep types. Deprecate or remove `useProgress` since the endpoint it called never existed.

```typescript
export type {
  ProgressRecord,
  UpdateProgressRequest,
  CourseProgress,
  LessonProgress,
  CourseProgressWithLessons,
} from "./model/types";

export { useCurriculum } from "./api/use-curriculum";
```

**Note**: Keep `use-progress.ts` file but mark the export as deprecated with a comment, or remove if nothing depends on it. Since the endpoint never existed, nothing can be using it successfully.

### Phase 5: Integration Verification

**Goal**: Ensure all pieces work together. Create a unit test for the progress calculation utilities and the `useProgressSaver` hook.

**Create**: `src/__tests__/features/progress/progress-calc.test.ts`

Test cases:
- `calculateChapterProgress` with mixed completed/incomplete lessons
- `calculateChapterProgress` with empty chapters
- `calculateCourseProgress` returns correct percentages
- `calculateCourseProgress` with zero lessons returns 0%

**Create**: `src/__tests__/features/progress/find-next-lesson.test.ts`

Test cases:
- Returns next lesson in same chapter
- Returns first lesson of next chapter when current is last in chapter
- Returns null when current is the very last lesson
- Handles single-lesson chapters

**Create**: `src/__tests__/features/progress/use-progress-saver.test.ts`

Test cases (using renderHook from React Testing Library):
- Does not save before 5 seconds elapsed
- Saves position after 5-second interval
- Auto-completes at 90% threshold
- Does not auto-complete twice (ref flag)
- Manual complete sends completed: true
- Resets state when lessonId changes
- Truncates position to integer

---

## Files Summary

### Files to Create

| File | Layer | Purpose |
|------|-------|---------|
| `src/features/progress/model/use-progress-saver.ts` | feature | Core hook: throttled save, auto-complete, manual complete |
| `src/features/progress/lib/progress-calc.ts` | feature | Pure functions: chapter + course progress calculation |
| `src/features/progress/lib/find-next-lesson.ts` | feature | Pure function: find next lesson in curriculum order |
| `src/features/progress/index.ts` | feature | Barrel exports |
| `src/entities/progress/api/use-curriculum.ts` | entity | SWR hook wrapping GET /api/learn/[courseSlug] |
| `src/__tests__/features/progress/progress-calc.test.ts` | test | Unit tests for progress calculation |
| `src/__tests__/features/progress/find-next-lesson.test.ts` | test | Unit tests for next lesson finder |
| `src/__tests__/features/progress/use-progress-saver.test.ts` | test | Hook tests for useProgressSaver |

### Files to Modify

| File | Change |
|------|--------|
| `src/entities/progress/api/use-progress.ts` | Deprecate or remove -- endpoint never existed |
| `src/entities/progress/index.ts` | Export `useCurriculum` instead of `useProgress` |

### Files NOT Modified (Existing, Verified Working)

| File | Status |
|------|--------|
| `src/app/api/progress/[lessonId]/route.ts` | PATCH endpoint works as-is, no changes needed |
| `src/db/schema/progress.ts` | Schema is correct, no changes needed |
| `src/shared/lib/validations/lecture.ts` | `progressUpdateSchema` validates correctly |
| `src/widgets/video-player/ui/video-player.tsx` | Props API already supports all needed callbacks |

---

## Acceptance Criteria Mapping

| AC | Implementation | Verified By |
|----|----------------|-------------|
| 1. PATCH /api/progress/[lessonId] -- 5s auto-call | `useProgressSaver.handleTimeUpdate` with ref-based 5s throttle | Hook test: saves after 5s interval |
| 2. 90%+ auto-complete | `handleTimeUpdate` checks `currentTime/duration >= 0.9`, sends `{ completed: true }` once | Hook test: auto-completes at 90% |
| 3. "Complete & Next" button | `manualComplete()` sends `{ completed: true }`, caller uses `findNextLesson()` for navigation | Hook test: manual complete flow |
| 4. Chapter progress calculation | `calculateChapterProgress()` pure function | Unit test: correct percentages per chapter |
| 5. Overall progress calculation | `calculateCourseProgress()` pure function + curriculum API `progress.percent` | Unit test: correct total percentage |
| 6. Resume from last position | `useCurriculum` returns per-lesson `position`, passed as `startAt` to `VideoPlayer` | Integration: curriculum data includes position |
| 7. Rate limit compliance (12req/min) | 5s throttle = max 12 saves/min; fire-and-forget avoids queuing | By design: 60s / 5s = 12 max |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stale SWR cache after auto-complete | Low | Mutate curriculum key immediately after completed PATCH |
| Race condition: manual complete during auto-complete | Low | Both check `isCompletedRef` before sending; PATCH is idempotent (upsert) |
| Browser tab close loses unsaved position | Low | 5s max data loss is acceptable; could add `beforeunload` flush in future |
| VideoPlayer unmounts before save completes | Low | Fire-and-forget saves are non-blocking; no state update after unmount |

## Completion Criteria

- [ ] `useProgressSaver` hook created with throttled saves, auto-complete, manual complete
- [ ] `calculateChapterProgress` and `calculateCourseProgress` pure functions created
- [ ] `findNextLesson` navigation helper created
- [ ] `useCurriculum` hook replaces broken `useProgress`
- [ ] All unit tests passing
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Lint passing (`pnpm lint`)
