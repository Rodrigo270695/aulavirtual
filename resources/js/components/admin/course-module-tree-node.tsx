/**
 * Nodo de árbol: un módulo del curso + lecciones (panel hijo).
 */

import { ArrowDown, ArrowUp, BookOpen, Clock, Pencil, Trash2 } from 'lucide-react';
import { CourseModuleLessonsPanel } from '@/components/admin/course-module-lessons-panel';
import type {
    AdminCourseLesson,
    AdminCourseModule,
    CourseLessonsCan,
    CourseModuleMaterialsCan,
    CourseModuleQuizCan,
    CourseModulesCan,
} from '@/types';
import { cn } from '@/lib/utils';

export interface CourseModuleTreeNodeProps {
    module: AdminCourseModule;
    index: number;
    totalModules: number;
    courseId: string;
    can: CourseModulesCan;
    lessonsCan: CourseLessonsCan;
    materialsCan: CourseModuleMaterialsCan;
    quizCan: CourseModuleQuizCan;
    onEdit: (m: AdminCourseModule) => void;
    onDelete: (m: AdminCourseModule) => void;
    onMove: (index: number, direction: -1 | 1) => void;
    onAddLesson: (module: AdminCourseModule) => void;
    onEditLesson: (module: AdminCourseModule, lesson: AdminCourseLesson) => void;
    onDeleteLessonRequest: (module: AdminCourseModule, lesson: AdminCourseLesson) => void;
}

export function CourseModuleTreeNode({
    module: m,
    index,
    totalModules,
    courseId,
    can,
    lessonsCan,
    materialsCan,
    quizCan,
    onEdit,
    onDelete,
    onMove,
    onAddLesson,
    onEditLesson,
    onDeleteLessonRequest,
}: CourseModuleTreeNodeProps) {
    return (
        <div className="relative flex gap-3 sm:gap-4">
            <div
                className="flex shrink-0 flex-col items-center pt-3"
                title={`Orden ${m.sort_order}`}
            >
                <span className="flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold tabular-nums text-slate-600 shadow-sm sm:size-7 sm:text-xs">
                    {m.sort_order}
                </span>
                {can.edit && totalModules > 1 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                        <button
                            type="button"
                            title="Subir módulo"
                            disabled={index === 0}
                            onClick={() => onMove(index, -1)}
                            className={cn(
                                'rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800',
                                index === 0 && 'pointer-events-none opacity-30',
                            )}
                        >
                            <ArrowUp className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            title="Bajar módulo"
                            disabled={index === totalModules - 1}
                            onClick={() => onMove(index, 1)}
                            className={cn(
                                'rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800',
                                index === totalModules - 1 && 'pointer-events-none opacity-30',
                            )}
                        >
                            <ArrowDown className="size-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1 rounded-xl border border-slate-200/90 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">{m.title}</h3>
                        {m.description ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {m.description}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {m.is_free_preview ? (
                            <span className="inline-flex h-7 items-center rounded-full bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700">
                                Vista previa
                            </span>
                        ) : (
                            <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs text-slate-500">
                                Sin preview
                            </span>
                        )}
                        <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs tabular-nums text-slate-700">
                            <Clock className="size-3.5 shrink-0 text-slate-500" aria-hidden />
                            {m.duration_minutes} min
                        </span>
                        <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs tabular-nums text-slate-700">
                            <BookOpen className="size-3.5 shrink-0 text-slate-500" aria-hidden />
                            {m.total_lessons} lecc.
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-0.5 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
                        {can.edit && (
                            <button
                                type="button"
                                title="Editar módulo"
                                onClick={() => onEdit(m)}
                                className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                            >
                                <Pencil className="size-4" />
                            </button>
                        )}
                        {can.delete && (
                            <button
                                type="button"
                                title="Eliminar módulo"
                                onClick={() => onDelete(m)}
                                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                <CourseModuleLessonsPanel
                    courseId={courseId}
                    module={m}
                    lessonsCan={lessonsCan}
                    materialsCan={materialsCan}
                    quizCan={quizCan}
                    onAddLesson={() => onAddLesson(m)}
                    onEditLesson={(lesson) => onEditLesson(m, lesson)}
                    onDeleteRequest={(lesson) => onDeleteLessonRequest(m, lesson)}
                />
            </div>
        </div>
    );
}
