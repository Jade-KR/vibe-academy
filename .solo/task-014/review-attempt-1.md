# Review: Task-014 - Progress Saving System

**Reviewer**: Claude Opus 4.5 (automated)
**Date**: 2026-02-03
**Branch**: `feature/task-014` (1 commit: `38663ad`)

---

## Score: 8.7 / 10

## Result: PASS

---

## Scoring Breakdown

| Aspect | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Correctness (logic, types, edge cases) | 30% | 8.5 | 2.55 |
| Security (auth, validation, injection) | 20% | 9.5 | 1.90 |
| Architecture (FSD compliance, separation) | 20% | 9.0 | 1.80 |
| Code quality (naming, DRY, readability) | 15% | 8.5 | 1.28 |
| Test coverage | 15% | 8.0 | 1.20 |
| **Total** | | | **8.73** |

---

## Must-Fix Issues

None. All issues found are below the must-fix threshold.

---

## Should-Fix Issues

### 1. useEffect reset dependencies may cause unwanted resets

**File**: `/Users/jade/projects/vibeAcademy/src/features/progress/model/use-progress-saver.ts:86-93`

```typescript
useEffect(() => {
  hasAutoCompletedRef.current = false;
  lastSaveTimestampRef.current = 0;
  isCompletedRef.current = initialCompleted;
  positionRef.current = initialPosition;
  setIsCompleted(initialCompleted);
  setIsSaving(false);
}, [lessonId, initialCompleted, initialPosition]);
```

The dependency array includes `initialCompleted` and `initialPosition`. If the parent component passes new prop references (e.g., SWR revalidation re-creates the object), the effect will re-run even for the same lesson. This resets `hasAutoCompletedRef` and `lastSaveTimestampRef`, which could cause:
- A duplicate auto-complete call (if already auto-completed at 90%)
- A premature position save (throttle timer reset)

**Recommendation**: Consider splitting the reset effect into two: one for `lessonId` changes (full reset), and one for `initialCompleted`/`initialPosition` sync that only updates the corresponding refs/state without resetting the throttle and auto-complete flags. Alternatively, use a `prevLessonIdRef` to guard the full reset.

### 2. Type assertion in useCurriculum

**File**: `/Users/jade/projects/vibeAcademy/src/entities/progress/api/use-curriculum.ts:60`

```typescript
const curriculum = (data?.data as CurriculumData) ?? null;
```

The `as CurriculumData` assertion bypasses TypeScript's type checking. If the API response shape changes, this will silently produce incorrect data rather than a compile-time error.

**Recommendation**: Use a Zod schema to validate the response at runtime, consistent with the project's validation approach. Alternatively, add a typed fetcher to SWR:
```typescript
const fetcher = (url: string) => fetch(url).then(r => r.json());
const { data } = useSWR<{ data: CurriculumData }>(key, fetcher);
```

---

## Nice-to-Have

### 1. Missing test for handleEnded after auto-complete

There is no test verifying that `handleEnded()` is a no-op after auto-complete has already fired. While the code handles this correctly via `isCompletedRef.current` check, an explicit test would document the behavior and prevent regressions.

### 2. Missing test for concurrent auto-complete and manual complete

No test simulates the scenario where the user clicks "Complete & Next" while the auto-complete promise is in-flight. The current design handles this safely (server-side upsert is idempotent, and `isCompletedRef` prevents double-complete), but a test would verify the behavior under race conditions.

### 3. Consider adding a beforeunload flush

The SPEC mentions this as a future improvement. A `beforeunload` event handler that sends the final position would reduce the 5-second data loss window on tab close. This is explicitly out of scope for this task but worth noting for follow-up.

### 4. Empty chapters in findNextLesson

The `findNextLesson` function skips empty chapters implicitly (since there are no lessons to iterate). However, there is no explicit test for a chapter with zero lessons between two non-empty chapters. The current flattening approach handles this correctly, but an explicit test would document the behavior.

---

## Summary

The implementation is solid and closely follows the SPEC. The code demonstrates excellent adherence to FSD architecture, clean separation between pure logic (progress calculations, next lesson finding) and stateful hook logic (useProgressSaver). The ref-based throttle pattern correctly avoids unnecessary re-renders, and the fire-and-forget position saves pattern is well-designed for the use case.

Key strengths:
- Zero `any` types in all new code
- Clean module-level helper extraction (savePosition, saveCompleted)
- Proper error handling: auto-complete failures reset the flag for retry, manual complete properly propagates errors to the caller
- Well-structured test suite with 28 tests covering all major scenarios
- Correct deprecation of the broken `useProgress` hook with JSDoc annotation

The two should-fix issues are minor edge cases that are unlikely to cause problems in practice but worth addressing for robustness. The nice-to-haves are standard improvements that would further strengthen the implementation.

All progress-related tests pass (28/28). TypeScript errors and lint warnings found in the repository are all pre-existing and unrelated to this branch's changes. No new type errors or lint issues were introduced.

---

## Discovered Conventions

### New Patterns (to propagate)
- Ref-based throttle pattern for fire-and-forget API calls: `lastSaveTimestampRef` + `Date.now()` comparison instead of `setInterval`
- Module-level async helper functions for API calls, keeping hooks focused on state management
- `hasAutoCompletedRef` flag pattern for one-time side effects that should not re-trigger

### Anti-patterns Found (to avoid in future)
- `as CurriculumData` type assertion on API response without runtime validation (-0.5 from Code quality score)
- Reset effect with mixed concerns: lesson-change reset + prop-sync in a single effect with combined dependency array (-0.5 from Correctness score)

### Reusable Utilities Created
- `src/features/progress/lib/progress-calc.ts`: `calculateChapterProgress()`, `calculateCourseProgress()` -- pure functions for deriving progress from curriculum data
- `src/features/progress/lib/find-next-lesson.ts`: `findNextLesson()` -- pure function for curriculum navigation
- `src/entities/progress/api/use-curriculum.ts`: `useCurriculum()` -- SWR hook for curriculum data fetching (replaces broken `useProgress`)
