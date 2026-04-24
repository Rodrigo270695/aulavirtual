/**
 * Árbol de módulos del curso (nodos padre + lecciones por módulo).
 */

import { GitBranch } from 'lucide-react';
import { CourseModuleTreeNode } from '@/components/admin/course-module-tree-node';
import type {
    AdminCourseLesson,
    AdminCourseModule,
    CourseLessonsCan,
    CourseModuleMaterialsCan,
    CourseModuleQuizCan,
    CourseModulesCan,
} from '@/types';

interface Props {
    courseId: string;
    modules: AdminCourseModule[];
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

export function CourseModulesTree({
    courseId,
    modules,
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
}: Props) {
    return (
        <section className="rounded-xl border border-slate-200/90 bg-linear-to-b from-slate-50/80 to-white p-4 shadow-sm sm:p-5">
            <header className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                    <GitBranch className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-slate-800">Estructura del curso</h2>
                    <p className="text-xs text-slate-500">
                        Vista en árbol: cada módulo contiene sus lecciones. Reordena con las flechas del módulo o de
                        cada lección.
                    </p>
                </div>
            </header>

            <div className="space-y-4 sm:space-y-5">
                {modules.map((m, index) => (
                    <CourseModuleTreeNode
                        key={m.id}
                        module={m}
                        index={index}
                        totalModules={modules.length}
                        courseId={courseId}
                        can={can}
                        lessonsCan={lessonsCan}
                        materialsCan={materialsCan}
                        quizCan={quizCan}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onMove={onMove}
                        onAddLesson={onAddLesson}
                        onEditLesson={onEditLesson}
                        onDeleteLessonRequest={onDeleteLessonRequest}
                    />
                ))}
            </div>
        </section>
    );
}
