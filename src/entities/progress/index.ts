export type {
  ProgressRecord,
  UpdateProgressRequest,
  CourseProgress,
  LessonProgress,
  CourseProgressWithLessons,
} from "./model/types";

export { useCurriculum } from "./api/use-curriculum";
export type {
  CurriculumLesson,
  CurriculumChapter,
  CurriculumCourse,
  CurriculumProgress,
  CurriculumData,
} from "./api/use-curriculum";

/** @deprecated Use `useCurriculum` instead. */
export { useProgress } from "./api/use-progress";
