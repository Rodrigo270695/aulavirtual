import type { PublicCourse } from '@/types/public';

/** Matrícula + curso (Mi aprendizaje y menú del navbar). */
export type LearningMenuRow = {
    enrollment_id: string;
    progress_pct: number;
    completed_at: string | null;
    last_accessed_at: string | null;
    enrolled_at: string;
    course: PublicCourse;
};

export type LearningSort =
    | 'recent'
    | 'title_asc'
    | 'title_desc'
    | 'progress_asc'
    | 'progress_desc'
    | 'enrolled_newest';

export type LearningProgressFilter = 'all' | 'in_progress' | 'completed';

/** Query de la página Mi aprendizaje. */
export type LearningPageFilters = {
    q: string;
    category: string;
    progress: LearningProgressFilter;
    instructor: string;
    sort: LearningSort;
};

export type LearningFilterOptionCategory = { slug: string; name: string };
export type LearningFilterOptionInstructor = { id: string; name: string };
