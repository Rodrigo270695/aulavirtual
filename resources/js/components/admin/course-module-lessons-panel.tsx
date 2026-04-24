/**
 * Lista de lecciones bajo un módulo (rama del árbol).
 */

import { Plus } from 'lucide-react';
import { CourseModuleLessonRow } from '@/components/admin/course-module-lesson-row';
import type {
    AdminCourseLesson,
    AdminCourseModule,
    CourseLessonsCan,
    CourseModuleMaterialsCan,
    CourseModuleQuizCan,
} from '@/types';

export interface CourseModuleLessonsPanelProps {
    courseId: string;
    module: AdminCourseModule;
    lessonsCan: CourseLessonsCan;
    materialsCan: CourseModuleMaterialsCan;
    quizCan: CourseModuleQuizCan;
    onAddLesson: () => void;
    onEditLesson: (lesson: AdminCourseLesson) => void;
    onDeleteRequest: (lesson: AdminCourseLesson) => void;
}

export function CourseModuleLessonsPanel({
    courseId,
    module,
    lessonsCan,
    materialsCan,
    quizCan,
    onAddLesson,
    onEditLesson,
    onDeleteRequest,
}: CourseModuleLessonsPanelProps) {
    if (!lessonsCan.view) {
        return (
            <div className="border-t border-slate-100 bg-amber-50/40 px-4 py-2.5">
                <p className="text-xs text-amber-900">
                    No tienes permiso para ver u organizar lecciones en este curso (
                    <code className="rounded bg-amber-100/80 px-1">cursos_lecciones.view</code>).
                </p>
            </div>
        );
    }

    const raw = module.lessons ?? [];
    const sorted = [...raw].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));

    return (
        <div className="border-t border-slate-100 bg-slate-50/70">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/80 px-4 py-2">
                <div className="flex items-center gap-2">
                    <span className="inline-block size-1.5 shrink-0 rounded-full bg-teal-500 ring-2 ring-teal-100" />
                    <span className="text-xs font-semibold text-slate-700">Lecciones</span>
                    <span className="text-[11px] text-slate-400">({sorted.length})</span>
                </div>
                {lessonsCan.create && (
                    <button
                        type="button"
                        onClick={onAddLesson}
                        className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
                    >
                        <Plus className="size-3.5" />
                        Añadir lección
                    </button>
                )}
            </div>

            <div className="space-y-2 px-3 py-3 sm:px-4">
                {sorted.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-center text-xs text-slate-500">
                        {lessonsCan.create
                            ? 'Este módulo aún no tiene lecciones. Usa «Añadir lección» para crear la primera.'
                            : 'No hay lecciones en este módulo.'}
                    </p>
                ) : (
                    sorted.map((lesson, index) => (
                        <CourseModuleLessonRow
                            key={lesson.id}
                            courseId={courseId}
                            module={module}
                            lesson={lesson}
                            index={index}
                            total={sorted.length}
                            lessonsCan={lessonsCan}
                            materialsCan={materialsCan}
                            quizCan={quizCan}
                            onEdit={onEditLesson}
                            onDeleteRequest={onDeleteRequest}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
