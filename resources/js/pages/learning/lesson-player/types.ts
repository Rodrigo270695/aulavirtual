export type LessonProgress = {
    status: 'not_started' | 'in_progress' | 'completed';
    watch_pct: number;
    video_position_sec: number;
    completed_at: string | null;
};

export type StudentQuizOption = {
    id: string;
    option_text: string;
};

export type StudentQuizQuestion = {
    id: string;
    question_text: string;
    question_type: string;
    points: number;
    sort_order: number;
    options: StudentQuizOption[];
};

export type StudentQuizAttempt = {
    attempt_number: number;
    score_pct: number;
    is_passed: boolean;
    submitted_at: string | null;
    obtained_points: number;
    total_points: number;
};

/** Intento cronometrado en curso (servidor); al recargar se restaura el tiempo límite. */
export type StudentQuizActiveTimedAttempt = {
    id: string;
    attempt_number: number;
    started_at: string;
    deadline_at: string;
};

/** Cuestionario del alumno (sin marcar opciones correctas). Incluye reglas, intentos y si puede enviar. */
export type StudentQuiz = {
    id: string;
    title: string;
    description: string | null;
    /** Si es false, el alumno ve el contenido pero no puede enviar hasta que el instructor active el cuestionario. */
    is_active: boolean;
    passing_score: number;
    /** never | submission (tras enviar) | passed (solo si supera en ese intento) */
    show_answers_after: 'never' | 'submission' | 'passed';
    time_limit_minutes: number | null;
    /** 0 = intentos ilimitados */
    max_attempts: number;
    attempts_used: number;
    can_submit: boolean;
    /** Algún intento enviado ya cumple la nota mínima. */
    has_passed: boolean;
    /** Mejor nota (%) entre intentos enviados; 0 si no hay ninguno. */
    best_score_pct: number;
    /** true si la mejor nota es 100% (no se permiten más intentos salvo ilimitados mal configurados). */
    has_perfect_score: boolean;
    /** Intento con cronómetro abierto (solo si hay límite de tiempo y puede continuar). */
    active_timed_attempt: StudentQuizActiveTimedAttempt | null;
    attempts: StudentQuizAttempt[];
    questions: StudentQuizQuestion[];
};

/** Actualización de intentos/notas/cronómetro en cliente (props Inertia no cambian al cambiar de lección). */
export type LessonHomeworkDeliverable = {
    id: string;
    title: string;
    url: string;
};

export type LessonHomeworkCan = {
    view: boolean;
    create: boolean;
    delete: boolean;
};

export type StudentQuizSessionPatch = Partial<
    Pick<
        StudentQuiz,
        | 'attempts_used'
        | 'attempts'
        | 'can_submit'
        | 'has_passed'
        | 'passing_score'
        | 'best_score_pct'
        | 'has_perfect_score'
        | 'active_timed_attempt'
    >
>;

export type LessonItem = {
    id: string;
    title: string;
    description: string | null;
    /** HTML o texto plano (p. ej. lecciones tipo artículo) */
    content_text: string | null;
    lesson_type: string;
    /** El docente pide entrega de archivos (independiente del tipo: vídeo, artículo, etc.). */
    has_homework: boolean;
    homework_title: string | null;
    homework_instructions: string | null;
    duration_seconds: number;
    video: {
        source: string;
        url: string | null;
        embed_url: string | null;
        provider_page_url?: string | null;
    } | null;
    documents: Array<{ id: string; title: string; url: string; is_downloadable: boolean }>;
    resources: Array<{ id: string; title: string; url: string; resource_type: string }>;
    quiz: StudentQuiz | null;
    homework_can: LessonHomeworkCan;
    /** Archivos subidos por el alumno para esta lección (solo si has_homework). */
    homework_deliverables: LessonHomeworkDeliverable[];
    progress: LessonProgress;
};

export type ModuleItem = {
    id: string;
    title: string;
    sort_order: number;
    lessons: LessonItem[];
};

export type LearningEnrollment = {
    id: string;
    progress_pct: number;
    course: {
        id: string;
        title: string;
        cover_image_url: string | null;
        instructor: { name: string };
    };
    review: {
        can_create: boolean;
        eligible: boolean;
        has_review: boolean;
    };
    certificate: {
        eligible: boolean;
        has_certificate: boolean;
        show_url: string;
        generate_url: string;
    };
};

export type LessonPlayerPageProps = {
    enrollment: LearningEnrollment;
    modules: ModuleItem[];
    initialLessonId?: string;
};

export type PlatformColors = {
    color_primary: string;
    color_accent: string;
};
