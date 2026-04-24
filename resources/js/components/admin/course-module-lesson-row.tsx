/**
 * Fila de una lección dentro del panel de módulo (árbol).
 */

import type { ComponentType } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    FileText,
    Link2,
    ListChecks,
    Paperclip,
    Pencil,
    Trash2,
    Upload,
    Video,
} from 'lucide-react';
import coursesRoute from '@/routes/admin/courses';
import type {
    AdminCourseLesson,
    AdminCourseModule,
    CourseLessonsCan,
    CourseModuleMaterialsCan,
    CourseModuleQuizCan,
} from '@/types';
import { cn } from '@/lib/utils';

const TYPE_SHORT: Record<string, string> = {
    article: 'Artículo',
    video: 'Vídeo',
    document: 'Doc.',
    quiz: 'Quiz',
    assignment: 'Tarea',
};

function lessonContentCounts(lesson: AdminCourseLesson): {
    documents: number;
    resources: number;
    /** Registro `lesson_videos` (0 o 1) */
    video: number;
    /** Fila en `quizzes` (0 o 1) */
    quiz: number;
    /** Entrega de archivos por el alumno (`lessons.has_homework`) */
    homework: 0 | 1;
} {
    return {
        documents: lesson.documents_count ?? 0,
        resources: lesson.resources_count ?? 0,
        video: lesson.video_count ?? 0,
        quiz: lesson.quiz_count ?? 0,
        homework: (lesson.has_homework ?? false) ? 1 : 0,
    };
}

function CountChip({
    title,
    Icon,
    count,
    activeClass,
}: {
    title: string;
    Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    count: number;
    activeClass: string;
}) {
    const active = count > 0;
    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center gap-0.5 rounded px-1 py-px font-medium tabular-nums',
                active ? activeClass : 'text-slate-300',
            )}
        >
            <Icon className="size-3 shrink-0" aria-hidden />
            {count}
        </span>
    );
}

export interface CourseModuleLessonRowProps {
    courseId: string;
    module: AdminCourseModule;
    lesson: AdminCourseLesson;
    index: number;
    total: number;
    lessonsCan: CourseLessonsCan;
    materialsCan: CourseModuleMaterialsCan;
    quizCan: CourseModuleQuizCan;
    onEdit: (lesson: AdminCourseLesson) => void;
    onDeleteRequest: (lesson: AdminCourseLesson) => void;
}

export function CourseModuleLessonRow({
    courseId,
    module,
    lesson,
    index,
    total,
    lessonsCan,
    materialsCan,
    quizCan,
    onEdit,
    onDeleteRequest,
}: CourseModuleLessonRowProps) {
    const move = (dir: -1 | 1) => {
        const next = index + dir;
        if (next < 0 || next >= total) {
            return;
        }
        const list = [...(module.lessons ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
        );
        const copy = [...list];
        const a = copy[index]!;
        const b = copy[next]!;
        copy[index] = b;
        copy[next] = a;
        router.put(
            coursesRoute.modules.lessons.reorder.url({
                course: courseId,
                course_module: module.id,
            }),
            { order: copy.map((l) => l.id) },
            { preserveScroll: true },
        );
    };

    const fmtDuration = (sec: number) => {
        if (sec <= 0) {
            return '—';
        }
        if (sec < 60) {
            return `${sec}s`;
        }
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return s > 0 ? `${m}m ${s}s` : `${m}m`;
    };

    const counts = lessonContentCounts(lesson);

    return (
        <div className="flex gap-2 rounded-lg border border-slate-200/80 bg-white px-2 py-2 sm:gap-3 sm:px-3">
            <div className="flex w-7 shrink-0 flex-col items-center justify-start pt-0.5 sm:w-8">
                <span className="text-[10px] font-bold tabular-nums text-slate-500 sm:text-xs">
                    {lesson.sort_order}
                </span>
                {lessonsCan.edit && total > 1 && (
                    <div className="mt-0.5 flex flex-col gap-0">
                        <button
                            type="button"
                            title="Subir lección"
                            disabled={index === 0}
                            onClick={() => move(-1)}
                            className={cn(
                                'rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                                index === 0 && 'pointer-events-none opacity-30',
                            )}
                        >
                            <ArrowUp className="size-3" />
                        </button>
                        <button
                            type="button"
                            title="Bajar lección"
                            disabled={index === total - 1}
                            onClick={() => move(1)}
                            className={cn(
                                'rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                                index === total - 1 && 'pointer-events-none opacity-30',
                            )}
                        >
                            <ArrowDown className="size-3" />
                        </button>
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-800">{lesson.title}</span>
                    <span className="rounded bg-violet-50 px-1.5 py-0 text-[10px] font-medium text-violet-700">
                        {TYPE_SHORT[lesson.lesson_type] ?? lesson.lesson_type}
                    </span>
                    {lesson.is_published ? (
                        <span className="rounded bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                            Publicada
                        </span>
                    ) : (
                        <span className="rounded bg-slate-100 px-1.5 py-0 text-[10px] text-slate-500">
                            Borrador
                        </span>
                    )}
                    {lesson.is_free_preview && (
                        <span className="rounded bg-sky-50 px-1.5 py-0 text-[10px] font-medium text-sky-700">
                            Preview
                        </span>
                    )}
                </div>
                {lesson.description ? (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{lesson.description}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-slate-100/80 pt-1 text-[10px]">
                    <span className="sr-only">Resumen de contenido</span>
                    <CountChip
                        title="Documentos adjuntos (archivos subidos)"
                        Icon={FileText}
                        count={counts.documents}
                        activeClass="text-amber-800"
                    />
                    <CountChip
                        title="Recursos externos (enlaces)"
                        Icon={Link2}
                        count={counts.resources}
                        activeClass="text-sky-800"
                    />
                    <CountChip
                        title="Vídeo principal de la lección (lesson_videos, máx. 1)"
                        Icon={Video}
                        count={counts.video}
                        activeClass="text-violet-800"
                    />
                    {lesson.lesson_type === 'quiz' ? (
                        <CountChip
                            title="Cuestionario configurado (tabla quizzes)"
                            Icon={ListChecks}
                            count={counts.quiz}
                            activeClass="text-rose-800"
                        />
                    ) : null}
                    <CountChip
                        title="Tarea (entrega del alumno en el aula)"
                        Icon={Upload}
                        count={counts.homework}
                        activeClass="text-emerald-800"
                    />
                </div>
                <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">{fmtDuration(lesson.duration_seconds)}</p>
            </div>

            <div className="flex shrink-0 items-start gap-0.5 pt-0.5">
                {materialsCan.showPage && (
                    <Link
                        href={coursesRoute.modules.lessons.materials.show.url({
                            course: courseId,
                            course_module: module.id,
                            lesson: lesson.id,
                        })}
                        title="Materiales: documentos y enlaces"
                        className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50"
                    >
                        <Paperclip className="size-3.5" aria-hidden />
                    </Link>
                )}
                {quizCan.showPage && lesson.lesson_type === 'quiz' && (
                    <Link
                        href={coursesRoute.modules.lessons.quiz.show.url({
                            course: courseId,
                            course_module: module.id,
                            lesson: lesson.id,
                        })}
                        title="Cuestionario: preguntas y reglas"
                        className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                        <ListChecks className="size-3.5" aria-hidden />
                    </Link>
                )}
                {lessonsCan.edit && (
                    <button
                        type="button"
                        title="Editar lección"
                        onClick={() => onEdit(lesson)}
                        className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                    >
                        <Pencil className="size-3.5" />
                    </button>
                )}
                {lessonsCan.delete && (
                    <button
                        type="button"
                        title="Eliminar lección"
                        onClick={() => onDeleteRequest(lesson)}
                        className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
