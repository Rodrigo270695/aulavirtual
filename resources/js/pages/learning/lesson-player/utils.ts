import type { LucideIcon } from 'lucide-react';
import { BookOpen, ClipboardList, FileCode, FileStack, Upload, Video } from 'lucide-react';
import type { LessonItem, LessonProgress } from './types';

export function formatDuration(seconds: number): string {
    if (seconds <= 0) {
        return 'Sin duración';
    }
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
}

/** Icono según solo el tipo (sin mirar si hay vídeo embebido en un artículo). */
export function lessonTypeNavIcon(lessonType: string): LucideIcon {
    switch (lessonType.toLowerCase()) {
        case 'video':
            return Video;
        case 'quiz':
            return ClipboardList;
        case 'article':
            return FileCode;
        case 'document':
            return FileStack;
        case 'assignment':
            return Upload;
        default:
            return BookOpen;
    }
}

function lessonHasPlayableVideo(lesson: Pick<LessonItem, 'video'>): boolean {
    if (!lesson.video) {
        return false;
    }
    return Boolean(lesson.video.embed_url || lesson.video.url);
}

/**
 * Vídeo en la barra lateral: tipo `video`, reproductor resuelto (URL/embed) o artículo con fila `lesson_videos`
 * (a veces el tipo en BD sigue siendo `article`).
 */
function lessonTreatsAsVideoNav(lesson: Pick<LessonItem, 'lesson_type' | 'video'>): boolean {
    const t = lesson.lesson_type.toLowerCase();
    if (t === 'video') {
        return true;
    }
    if (lessonHasPlayableVideo(lesson)) {
        return true;
    }
    if (t === 'article' && lesson.video !== null) {
        return true;
    }
    return false;
}

/** Icono en la barra lateral: vídeo si hay reproductor o tipo vídeo; si no, según tipo. */
export function lessonNavIconForLesson(lesson: Pick<LessonItem, 'lesson_type' | 'video'>): LucideIcon {
    if (lessonTreatsAsVideoNav(lesson)) {
        return Video;
    }
    return lessonTypeNavIcon(lesson.lesson_type);
}

/**
 * Texto junto al icono: duración m:ss para vídeos (incl. artículo con vídeo);
 * para cuestionario, minutos de tiempo límite si está configurado.
 */
export function lessonSidebarMetaLabel(
    lesson: Pick<LessonItem, 'lesson_type' | 'duration_seconds' | 'video' | 'quiz'>,
): string | null {
    if (lessonTreatsAsVideoNav(lesson)) {
        return formatDuration(lesson.duration_seconds);
    }
    if (lesson.lesson_type.toLowerCase() === 'quiz' && lesson.quiz) {
        const lim = lesson.quiz.time_limit_minutes;
        if (lim != null && lim > 0) {
            return `${lim} min`;
        }
    }
    return null;
}

export function statusLabelEs(status: LessonProgress['status']): string {
    switch (status) {
        case 'completed':
            return 'Completada';
        case 'in_progress':
            return 'En progreso';
        default:
            return 'Sin empezar';
    }
}

export function providerOpenLabel(source: string): string {
    switch (source) {
        case 'youtube':
            return 'Abrir en YouTube';
        case 'vimeo':
            return 'Abrir en Vimeo';
        default:
            return 'Abrir vídeo en nueva pestaña';
    }
}

export function resourceTypeLabelEs(type: string): string {
    const t = type.toLowerCase();
    switch (t) {
        case 'link':
            return 'Enlace';
        case 'file':
            return 'Archivo';
        default:
            return type || 'Recurso';
    }
}

export function lessonTypeLabelEs(type: string): string {
    const t = type.toLowerCase();
    switch (t) {
        case 'video':
            return 'Vídeo';
        case 'article':
            return 'Artículo';
        case 'document':
            return 'Documento';
        case 'quiz':
            return 'Cuestionario';
        case 'assignment':
            return 'Tarea';
        default:
            return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Lección';
    }
}
