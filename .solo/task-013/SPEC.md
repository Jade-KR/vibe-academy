# Task-013: Learn Page -- 3-Column Layout (Curriculum / Player+MDX / Discussion)

> Created: 2026-02-03
> Based on: exploration.md
> Estimated time: 5 hours

## Summary

Build the learn page at `/learn/[courseSlug]/[lessonId]` with a responsive 3-column layout: left curriculum sidebar (240px), center video player + MDX lesson description (fluid), and right discussion panel (320px). Panels are individually toggleable. Mobile uses a single-column view with bottom sheet tabs. Uses existing APIs, hooks, and widgets -- the work is primarily composition and UI orchestration.

---

## Applied Skills

### Scan Results

3 skills found (project: 3, user: 0, default: 0)

### Selected Skills

| Skill                       | Location | Reason                                                                                                      |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| vercel-react-best-practices | project  | Performance patterns for client components, SWR dedup, re-render optimization, bundle-dynamic for heavy MDX |
| web-design-guidelines       | project  | Responsive layout, keyboard accessibility, panel toggle UX                                                  |

### Excluded Skills

| Skill                            | Reason                                           |
| -------------------------------- | ------------------------------------------------ |
| supabase-postgres-best-practices | No DB or Supabase work -- all APIs already exist |

---

## Requirements

### Functional Requirements

- [ ] 3-column layout: curriculum (240px) | player+description (fluid) | discussion (320px)
- [ ] Curriculum sidebar: chapter/lesson list, completion icons, current lesson highlight, progress bars
- [ ] Left/right panel individual toggle (closing panel expands center)
- [ ] Lesson MDX description rendered with rehype-pretty-code syntax highlighting
- [ ] Previous / Next lesson navigation buttons
- [ ] "Complete & Next" manual completion button
- [ ] URL changes per lesson (shareable: `/learn/[courseSlug]/[lessonId]`)
- [ ] Mobile: panels hidden, bottom tab bar for curriculum/discussion (Sheet components)
- [ ] R2 presigned URL video playback via existing VideoPlayer widget
- [ ] Enrollment verification: 403 from curriculum API redirects to course detail page

### Non-Functional Requirements

- [ ] Smooth CSS transitions on panel toggle (200ms ease)
- [ ] Keyboard accessible panel toggles (focusable buttons with aria labels)
- [ ] Dark mode support using semantic Tailwind tokens
- [ ] i18n: all strings from `learn.*` namespace (already complete in ko/en)
- [ ] Loading skeletons for curriculum, lesson content, and discussion
- [ ] Error state with retry for failed fetches

---

## Architecture

### Component Hierarchy

```
src/app/[locale]/(learn)/layout.tsx          (server) Minimal shell, no header/footer
  src/app/[locale]/(learn)/learn/[courseSlug]/[lessonId]/page.tsx  (server) Params extraction + metadata
    LearnLayout                               (client) 3-column orchestrator with panel state
      CurriculumSidebar                       (client) Left panel -- chapters, lessons, progress
      LessonContent                           (client) Center -- video + MDX + nav buttons
        VideoPlayer                           (widget) Existing HLS player
        LessonMdxRenderer                     (client) MDX description rendering
      DiscussionPanel                         (widget) Right panel -- existing CRUD discussions
      MobileLearnTabs                         (client) Bottom tabs for lg-down breakpoint
```

### Layout Diagram

```
Desktop (>= lg, 1024px):
+----------+---------------------------+-----------+
|          |                           |           |
| Curriculum|   VideoPlayer            | Discussion|
|  240px   |   (aspect-video)          |   320px   |
|          |                           |           |
| chapters |   MDX Description         | threads   |
| lessons  |   (scrollable)            | comments  |
| progress |                           |           |
|          |   [Prev] [Complete] [Next]|           |
+----------+---------------------------+-----------+

Left panel closed:
+--+--------------------------------+-----------+
|<<|   VideoPlayer (wider)          | Discussion|
+--+--------------------------------+-----------+

Both panels closed:
+--+------------------------------------------+--+
|<<|   VideoPlayer (full width)               |>>|
+--+------------------------------------------+--+

Mobile (< lg):
+------------------------------------------+
|   VideoPlayer                            |
|   (full width, aspect-video)             |
+------------------------------------------+
|   MDX Description                        |
|   [Prev] [Complete] [Next]               |
+------------------------------------------+
| [Curriculum Tab] [Discussion Tab]        |  <- fixed bottom bar
+------------------------------------------+
```

### Data Flow

```
URL params (courseSlug, lessonId)
    |
    +---> useCurriculum(courseSlug)  --> CurriculumSidebar
    |       |
    |       +-- 403 error? --> router.push(`/courses/${courseSlug}`)
    |       +-- chapters[] --> findPreviousLesson / findNextLesson
    |       +-- currentLesson.position, currentLesson.completed
    |
    +---> useLearnLesson(courseSlug, lessonId)  --> LessonContent
    |       |
    |       +-- videoUrl --> VideoPlayer src
    |       +-- description --> LessonMdxRenderer
    |       +-- title --> page heading
    |
    +---> useProgressSaver({ lessonId, courseSlug, initialPosition, initialCompleted })
            |
            +-- handleTimeUpdate --> VideoPlayer onTimeUpdate
            +-- handleEnded --> VideoPlayer onEnded
            +-- manualComplete --> "Complete & Next" button
            +-- isCompleted --> UI badge/icon
```

---

## Implementation Plan

### Phase 1: Route Group + Data Layer (45 min)

**Goal**: Establish the route structure and new data hooks/utilities.

**Tasks**:

1. **Create `(learn)` route group layout**
   - File: `src/app/[locale]/(learn)/layout.tsx`
   - Minimal server component: just renders `{children}` with `min-h-screen` and `overflow-hidden`
   - No TopBar, no Header, no Footer, no container padding
   - Providers (intl, theme, auth, swr) are already in the parent `[locale]/layout.tsx`

2. **Create `useLearnLesson` SWR hook**
   - File: `src/entities/progress/api/use-learn-lesson.ts`
   - SWR key: `/api/learn/${courseSlug}/lessons/${lessonId}`
   - Returns: `{ lesson, error, isLoading, mutate }`
   - Type: `LearnLessonData` with fields `{ id, title, description, videoUrl, duration, isPreview, order }`
   - Export from `src/entities/progress/index.ts`

3. **Create `findPreviousLesson` utility**
   - File: `src/features/progress/lib/find-previous-lesson.ts`
   - Mirror of `findNextLesson`: flattens chapters, finds current index, returns `index - 1` or null
   - Return type: `PreviousLessonResult` (same shape as `NextLessonResult`)
   - Export from `src/features/progress/index.ts`

**Verification**: `pnpm typecheck` passes. New hook and util are importable.

---

### Phase 2: Learn Layout Widget (1.5 hours)

**Goal**: Build the main 3-column layout orchestrator and curriculum sidebar.

**Tasks**:

1. **Create widget scaffold**
   - Directory: `src/widgets/learn-layout/`
   - Files: `index.ts`, `ui/learn-layout.tsx`, `ui/curriculum-sidebar.tsx`

2. **Build `LearnLayout` component**
   - File: `src/widgets/learn-layout/ui/learn-layout.tsx`
   - `"use client"` component
   - Props: `{ courseSlug: string; lessonId: string }`
   - State: `leftOpen` (default `true` on desktop), `rightOpen` (default `true` on desktop)
   - Detect viewport with a `useMediaQuery` or `lg:` CSS-only approach:
     - Use CSS approach: panels render in DOM always but hidden below `lg` via `hidden lg:flex`
     - Mobile tabs only render below `lg` via `lg:hidden`
   - Layout structure (Flexbox):
     ```
     <div className="flex h-screen">
       {leftOpen && <CurriculumSidebar ... className="hidden lg:flex w-[240px] shrink-0" />}
       <div className="flex-1 min-w-0 overflow-y-auto">
         <LessonContent ... />
       </div>
       {rightOpen && <DiscussionPanel ... className="hidden lg:flex w-[320px] shrink-0" />}
       <MobileLearnTabs ... className="lg:hidden" />
     </div>
     ```
   - Toggle buttons: small icon buttons at panel edges, always visible on desktop
     - Left toggle: `PanelLeftClose` / `PanelLeftOpen` (lucide-react)
     - Right toggle: `PanelRightClose` / `PanelRightOpen` (lucide-react)
   - Panel open/close with `transition-all duration-200` on width
   - Fetch curriculum here: `useCurriculum(courseSlug)` to share data between sidebar and content
   - Enrollment 403 check: if `error?.status === 403`, redirect using `router.push`

3. **Build `CurriculumSidebar` component**
   - File: `src/widgets/learn-layout/ui/curriculum-sidebar.tsx`
   - `"use client"` component
   - Props: `{ courseSlug, chapters, progress, currentLessonId, className? }`
   - Structure:
     - Top: Course title + overall progress bar (`<Progress value={progress.percent} />`)
     - Middle: Scrollable chapter list
       - Each chapter: collapsible section (use Disclosure pattern or simple state toggle)
         - Chapter title + chapter progress (e.g., "3/5")
         - Lessons as locale-aware `<Link>` to `/learn/${courseSlug}/${lesson.id}`
         - Each lesson shows:
           - Completion icon: `CheckCircle2` (completed, text-primary) or `Circle` (incomplete, text-muted-foreground)
           - Title (truncated with `truncate`)
           - Duration (formatted)
           - Current lesson: highlighted background (`bg-primary/10 border-l-2 border-primary`)
     - Bottom: Overall stats text (`learn.progressPercent`)
   - Keyboard: Links are naturally focusable; chapters toggle on Enter/Space

4. **Export from barrel**
   - `src/widgets/learn-layout/index.ts`: export `LearnLayout`

**Verification**: Component renders with mock data. Panel toggles work. Curriculum sidebar shows chapters/lessons.

---

### Phase 3: Lesson Content + MDX (1.5 hours)

**Goal**: Build center panel with video player, MDX description, and navigation.

**Tasks**:

1. **Build `LessonContent` component**
   - File: `src/widgets/learn-layout/ui/lesson-content.tsx`
   - `"use client"` component
   - Props: `{ courseSlug, lessonId, chapters, currentLesson? }` (currentLesson from curriculum for position/completed)
   - Uses:
     - `useLearnLesson(courseSlug, lessonId)` for video URL and description
     - `useProgressSaver({ lessonId, courseSlug, initialPosition, initialCompleted })` for progress tracking
     - `findNextLesson(chapters, lessonId)` for next button
     - `findPreviousLesson(chapters, lessonId)` for prev button
   - Structure:

     ```
     <div className="flex flex-col">
       <!-- Video area -->
       <div className="aspect-video bg-black">
         <VideoPlayer
           src={lesson.videoUrl}
           startAt={currentLesson?.position ?? 0}
           onTimeUpdate={handleTimeUpdate}
           onEnded={handleEnded}
         />
       </div>

       <!-- Content area (scrollable) -->
       <div className="p-6 space-y-6">
         <h1>{lesson.title}</h1>
         {lesson.description && <LessonMdxRenderer source={lesson.description} />}

         <!-- Navigation bar -->
         <nav className="flex items-center justify-between border-t pt-4">
           <Button variant="outline" asChild disabled={!prevLesson}>
             <Link href={`/learn/${courseSlug}/${prevLesson?.lessonId}`}>
               <ChevronLeft /> {t("previousLesson")}
             </Link>
           </Button>

           <Button onClick={handleCompleteAndNext} disabled={isCompleted || isSaving}>
             {isSaving ? <Loader2 className="animate-spin" /> : null}
             {t("markComplete")}
           </Button>

           <Button variant="outline" asChild disabled={!nextLesson}>
             <Link href={`/learn/${courseSlug}/${nextLesson?.lessonId}`}>
               {t("nextLesson")} <ChevronRight />
             </Link>
           </Button>
         </nav>
       </div>
     </div>
     ```

   - "Complete & Next" handler:
     ```ts
     async function handleCompleteAndNext() {
       await manualComplete();
       if (nextLesson) {
         router.push(`/learn/${courseSlug}/${nextLesson.lessonId}`);
       }
     }
     ```
   - Loading state: Skeleton for video area + content area
   - Error state: Error message with retry button

2. **Build `LessonMdxRenderer` component**
   - File: `src/widgets/learn-layout/ui/lesson-mdx-renderer.tsx`
   - `"use client"` component
   - Props: `{ source: string }` (raw MDX string from API)
   - Uses `next-mdx-remote` client-side approach:
     - `serialize()` from `next-mdx-remote/serialize` (called in useEffect or useMemo with async)
     - `<MDXRemote>` from `next-mdx-remote` for rendering
     - Options: `{ mdxOptions: { rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]] } }`
     - Components: reuse `getMDXComponents()` from `@/widgets/blog`
   - Implementation pattern:

     ```tsx
     const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);

     useEffect(() => {
       let cancelled = false;
       serialize(source, {
         mdxOptions: {
           rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
         },
       }).then((result) => {
         if (!cancelled) setMdxSource(result);
       });
       return () => {
         cancelled = true;
       };
     }, [source]);

     if (!mdxSource) return <Skeleton />;
     return (
       <div className="prose dark:prose-invert max-w-none">
         <MDXRemote {...mdxSource} components={getMDXComponents()} />
       </div>
     );
     ```

   - Applying `bundle-dynamic-imports` skill: consider `next/dynamic` for this component since rehype-pretty-code is heavy. Load lazily to avoid blocking initial paint of the video player.

**Verification**: Video plays. MDX renders with syntax highlighting. Prev/Next buttons navigate. Complete & Next saves progress and navigates.

---

### Phase 4: Mobile Bottom Tabs + Page Entry (1 hour)

**Goal**: Complete mobile experience and wire the page route.

**Tasks**:

1. **Build `MobileLearnTabs` component**
   - File: `src/widgets/learn-layout/ui/mobile-learn-tabs.tsx`
   - `"use client"` component
   - Props: `{ courseSlug, lessonId, chapters, progress, currentLessonId }`
   - Fixed bottom bar visible only below `lg` breakpoint: `className="fixed bottom-0 inset-x-0 lg:hidden"`
   - Two tab buttons: Curriculum (`BookOpen` icon) | Discussion (`MessageSquare` icon)
   - Each tab opens a `<Sheet side="bottom">` with height `~70vh`
   - Sheet content:
     - Curriculum tab: `<CurriculumSidebar>` (reuse same component)
     - Discussion tab: `<DiscussionPanel lessonId={lessonId} />`
   - Active tab highlighted with `text-primary` vs `text-muted-foreground`
   - Add bottom padding to main content area on mobile to prevent overlap: `pb-16 lg:pb-0`

2. **Create page route**
   - File: `src/app/[locale]/(learn)/learn/[courseSlug]/[lessonId]/page.tsx`
   - Server component (thin entry point)
   - Extracts `courseSlug` and `lessonId` from `params`
   - Generates metadata: `title` from courseSlug (basic), can be enhanced later
   - Renders `<LearnLayout courseSlug={courseSlug} lessonId={lessonId} />`

3. **Update barrel export**
   - `src/widgets/learn-layout/index.ts`: add `MobileLearnTabs` if needed (may stay internal)

**Verification**: On mobile viewport, panels are hidden, bottom tabs appear. Tapping tabs opens sheets. Sheet content is functional (links navigate, discussions load).

---

### Phase 5: Polish + Integration Testing (30 min)

**Goal**: Final polish, edge cases, typecheck, lint.

**Tasks**:

1. **Panel toggle polish**
   - Ensure toggle buttons have `aria-label` (using i18n keys or descriptive text)
   - Ensure transitions are smooth (no layout shift)
   - Test that center content reflows correctly when panels open/close

2. **Enrollment redirect polish**
   - When curriculum returns 403, show a brief toast (`learn.notEnrolled`) before redirecting
   - Redirect to: `/courses/${courseSlug}` (course detail page)

3. **Edge cases**
   - First lesson: "Previous" button disabled
   - Last lesson: "Next" button disabled, "Complete & Next" just completes without navigation
   - No video URL: hide VideoPlayer, show MDX only
   - Empty description: hide MDX section
   - Loading states: skeleton placeholders for all three panels

4. **Run checks**
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm build` (verify no build errors)

**Verification**: All checks pass. Full flow works: load page, see curriculum, watch video, toggle panels, complete lesson, navigate.

---

## Files to Create

| File                                                              | Layer    | Type             | Description                                   |
| ----------------------------------------------------------------- | -------- | ---------------- | --------------------------------------------- |
| `src/app/[locale]/(learn)/layout.tsx`                             | app      | Server component | Minimal shell layout for learn pages          |
| `src/app/[locale]/(learn)/learn/[courseSlug]/[lessonId]/page.tsx` | app      | Server component | Page entry point, param extraction            |
| `src/widgets/learn-layout/index.ts`                               | widgets  | Barrel           | Public exports for learn-layout widget        |
| `src/widgets/learn-layout/ui/learn-layout.tsx`                    | widgets  | Client component | 3-column layout orchestrator with panel state |
| `src/widgets/learn-layout/ui/curriculum-sidebar.tsx`              | widgets  | Client component | Left panel: chapters, lessons, progress       |
| `src/widgets/learn-layout/ui/lesson-content.tsx`                  | widgets  | Client component | Center: video + MDX + navigation              |
| `src/widgets/learn-layout/ui/lesson-mdx-renderer.tsx`             | widgets  | Client component | MDX rendering with rehype-pretty-code         |
| `src/widgets/learn-layout/ui/mobile-learn-tabs.tsx`               | widgets  | Client component | Bottom tab bar with Sheet panels              |
| `src/entities/progress/api/use-learn-lesson.ts`                   | entities | Hook             | SWR hook for lesson detail with video URL     |
| `src/features/progress/lib/find-previous-lesson.ts`               | features | Utility          | Find previous lesson in curriculum order      |

## Files to Modify

| File                             | Change                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| `src/entities/progress/index.ts` | Add export for `useLearnLesson` and `LearnLessonData` type          |
| `src/features/progress/index.ts` | Add export for `findPreviousLesson` and `PreviousLessonResult` type |

---

## Acceptance Criteria Mapping

| AC # | Criterion                                                      | Phase   | Implementation                                                                         |
| ---- | -------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| 1    | 3-column layout (240px / fluid / 320px)                        | Phase 2 | `LearnLayout` flexbox with fixed widths + `flex-1` center                              |
| 2    | Curriculum sidebar (chapters, completion, highlight, progress) | Phase 2 | `CurriculumSidebar` with `useCurriculum`, `Progress`, completion icons                 |
| 3    | Left/right panel toggle (player expands)                       | Phase 2 | `useState` per panel in `LearnLayout`, conditional render + CSS transition             |
| 4    | MDX description with rehype-pretty-code                        | Phase 3 | `LessonMdxRenderer` using `serialize` + `MDXRemote` + `rehypePrettyCode`               |
| 5    | Previous/Next lesson buttons                                   | Phase 3 | `LessonContent` using `findPreviousLesson` + `findNextLesson` with locale-aware `Link` |
| 6    | "Complete & Next" manual complete                              | Phase 3 | `LessonContent` calling `manualComplete()` from `useProgressSaver` then `router.push`  |
| 7    | URL changes per lesson (shareable)                             | Phase 4 | Each lesson is a full `Link` navigation to `/learn/[courseSlug]/[lessonId]`            |
| 8    | Mobile: panels hidden, bottom sheet tabs                       | Phase 4 | `MobileLearnTabs` with `Sheet side="bottom"`, `hidden lg:flex` / `lg:hidden`           |
| 9    | R2 presigned URL video playback                                | Phase 3 | `useLearnLesson` returns `videoUrl` (presigned by API), passed to `VideoPlayer` `src`  |
| 10   | Enrollment check (redirect if not enrolled)                    | Phase 2 | `useCurriculum` 403 error detected in `LearnLayout`, redirects via `router.push`       |

---

## Risks

| Risk                                                       | Impact | Mitigation                                                                         |
| ---------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| MDX `serialize()` is async and runs on client -- may flash | Low    | Show skeleton while serializing; lazy-load `LessonMdxRenderer` with `next/dynamic` |
| rehype-pretty-code adds to bundle size (~40KB)             | Medium | Dynamic import the MDX renderer so it loads after video player paints              |
| Panel toggle may cause video player resize/reflow issues   | Medium | Use CSS `transition-[width]` on panels, not on video; video just fills parent flex |
| `next-mdx-remote` v5 serialize may need RSC-only path      | Medium | Test with client import; fallback to `evaluate()` from `@mdx-js/mdx` if needed     |
| SWR cache stale after "Complete & Next" navigation         | Low    | `useProgressSaver` already calls `mutate` to revalidate curriculum SWR cache       |
| Mobile Sheet scroll conflicts with parent scroll           | Low    | Sheet handles scroll isolation via Radix Dialog; test thoroughly                   |

---

## Key Design Decisions

1. **New `(learn)` route group** rather than nesting under `(dashboard)` -- the layout is fundamentally different (no TopBar, full viewport, no container padding).

2. **Flexbox over CSS Grid** for the 3-column layout -- simpler to handle the toggle case where panels disappear and center expands naturally with `flex-1`.

3. **Client-side MDX serialization** -- the learn page is heavily interactive (video player, progress tracking, panel toggles), making it impractical to keep the MDX renderer as a server component island. The serialize + MDXRemote pattern works well in client components with a loading skeleton.

4. **CSS breakpoint approach over JS `useMediaQuery`** for responsive -- avoids hydration mismatches. Mobile tabs use `lg:hidden`, desktop panels use `hidden lg:flex`. Both render in DOM; CSS controls visibility.

5. **Enrollment check from curriculum fetch** -- no separate API call. The curriculum API already verifies enrollment and returns 403. This avoids an extra network request and keeps the check implicit.

6. **`findPreviousLesson` as separate utility** (not merged into `findNextLesson`) -- keeps each function simple and follows the existing pattern. Same flat-traversal approach, just `index - 1` instead of `index + 1`.
