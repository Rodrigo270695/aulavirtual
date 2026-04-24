/**
 * admin/courses/modules — Módulos (unidades) de un curso.
 */

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Layers, ListOrdered, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { CourseModulesTree } from '@/components/admin/course-modules-tree';
import { CourseModulesTreeEmpty } from '@/components/admin/course-modules-tree-empty';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CourseLessonFormModal } from '@/pages/admin/courses/course-lesson-form-modal';
import { CourseModuleFormModal } from '@/pages/admin/courses/course-module-form-modal';
import { dashboard } from '@/routes';
import coursesRoute from '@/routes/admin/courses';
import type {
    AdminCourseLesson,
    AdminCourseModule,
    CourseLessonsCan,
    CourseModuleMaterialsCan,
    CourseModuleQuizCan,
    CourseModulesCan,
    CourseModulesPageCourse,
} from '@/types';

interface Props {
    course: CourseModulesPageCourse;
    modules: AdminCourseModule[];
    can: CourseModulesCan;
    lessonsCan: CourseLessonsCan;
    materialsCan: CourseModuleMaterialsCan;
    quizCan: CourseModuleQuizCan;
}

export default function CourseModulesIndex({ course, modules, can, lessonsCan, materialsCan, quizCan }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminCourseModule | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingModule, setDeletingModule] = useState<AdminCourseModule | null>(null);

    const [lessonFormOpen, setLessonFormOpen] = useState(false);
    const [lessonModuleForForm, setLessonModuleForForm] = useState<AdminCourseModule | null>(null);
    const [editingLesson, setEditingLesson] = useState<AdminCourseLesson | null>(null);

    const [lessonDeleteOpen, setLessonDeleteOpen] = useState(false);
    const [lessonDeleting, setLessonDeleting] = useState(false);
    const [lessonDeleteModule, setLessonDeleteModule] = useState<AdminCourseModule | null>(null);
    const [lessonPendingDelete, setLessonPendingDelete] = useState<AdminCourseLesson | null>(null);

    const catLabel = course.category ? `${course.category.name} · /${course.category.slug}` : '—';

    const openCreate = useCallback(() => {
        setEditing(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((m: AdminCourseModule) => {
        setEditing(m);
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((m: AdminCourseModule) => {
        setDeletingModule(m);
        setDeleteOpen(true);
    }, []);

    const closeForm = useCallback(() => {
        setFormOpen(false);
        setEditing(null);
    }, []);

    const openLessonCreate = useCallback((mod: AdminCourseModule) => {
        setLessonModuleForForm(mod);
        setEditingLesson(null);
        setLessonFormOpen(true);
    }, []);

    const openLessonEdit = useCallback((mod: AdminCourseModule, lesson: AdminCourseLesson) => {
        setLessonModuleForForm(mod);
        setEditingLesson(lesson);
        setLessonFormOpen(true);
    }, []);

    const closeLessonForm = useCallback(() => {
        setLessonFormOpen(false);
        setEditingLesson(null);
        setLessonModuleForForm(null);
    }, []);

    const requestLessonDelete = useCallback((mod: AdminCourseModule, lesson: AdminCourseLesson) => {
        setLessonDeleteModule(mod);
        setLessonPendingDelete(lesson);
        setLessonDeleteOpen(true);
    }, []);

    const moveModule = useCallback(
        (index: number, dir: -1 | 1) => {
            const next = index + dir;
            if (next < 0 || next >= modules.length) {
                return;
            }
            const copy = [...modules];
            const a = copy[index]!;
            const b = copy[next]!;
            copy[index] = b;
            copy[next] = a;
            router.put(
                coursesRoute.modules.reorder.url({ course: course.id }),
                { order: copy.map((m) => m.id) },
                { preserveScroll: true },
            );
        },
        [course.id, modules],
    );

    const confirmDelete = useCallback(() => {
        if (!deletingModule) {
            return;
        }
        setDeleting(true);
        router.delete(
            coursesRoute.modules.destroy.url({
                course: course.id,
                course_module: deletingModule.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setDeleteOpen(false);
                    setDeletingModule(null);
                },
            },
        );
    }, [course.id, deletingModule]);

    const confirmDeleteLesson = useCallback(() => {
        if (!lessonPendingDelete || !lessonDeleteModule) {
            return;
        }
        setLessonDeleting(true);
        router.delete(
            coursesRoute.modules.lessons.destroy.url({
                course: course.id,
                course_module: lessonDeleteModule.id,
                lesson: lessonPendingDelete.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setLessonDeleting(false);
                    setLessonDeleteOpen(false);
                    setLessonPendingDelete(null);
                    setLessonDeleteModule(null);
                },
            },
        );
    }, [course.id, lessonDeleteModule, lessonPendingDelete]);

    return (
        <>
            <Head title={`Módulos · ${course.title}`} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={course.title}
                    description={`Módulos del curso (estructura del contenido). Categoría: ${catLabel}. Slug: /${course.slug}`}
                    icon={<Layers />}
                    stats={[
                        {
                            label: 'Módulos',
                            value: modules.length,
                            icon: <ListOrdered className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Total (denormalizado)',
                            value: course.total_modules,
                            icon: <BookOpen className="size-3.5" />,
                            color: 'slate',
                        },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {can.create && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
                                >
                                    <Plus className="size-4" />
                                    Nuevo módulo
                                </button>
                            )}
                            <Link
                                href={coursesRoute.index.url()}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
                            >
                                <ArrowLeft className="size-4" />
                                Volver a cursos
                            </Link>
                        </div>
                    }
                />

                {modules.length === 0 ? (
                    <CourseModulesTreeEmpty canCreate={can.create} onCreate={openCreate} />
                ) : (
                    <CourseModulesTree
                        courseId={course.id}
                        modules={modules}
                        can={can}
                        lessonsCan={lessonsCan}
                        materialsCan={materialsCan}
                        quizCan={quizCan}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onMove={moveModule}
                        onAddLesson={openLessonCreate}
                        onEditLesson={openLessonEdit}
                        onDeleteLessonRequest={requestLessonDelete}
                    />
                )}
            </div>

            <CourseModuleFormModal
                open={formOpen}
                onClose={closeForm}
                courseId={course.id}
                module={editing}
            />

            {lessonModuleForForm && (
                <CourseLessonFormModal
                    open={lessonFormOpen}
                    onClose={closeLessonForm}
                    courseId={course.id}
                    moduleId={lessonModuleForForm.id}
                    lesson={editingLesson}
                />
            )}

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    if (!deleting) {
                        setDeleteOpen(false);
                        setDeletingModule(null);
                    }
                }}
                onConfirm={confirmDelete}
                loading={deleting}
                title="Eliminar módulo"
                description={
                    <>
                        ¿Eliminar el módulo{' '}
                        <span className="font-semibold text-slate-800">«{deletingModule?.title}»</span>?
                        <br />
                        <span className="text-xs text-slate-400">
                            Las lecciones vinculadas se eliminarán en cascada si la base de datos está configurada así.
                        </span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />

            <ConfirmModal
                open={lessonDeleteOpen}
                onClose={() => {
                    if (!lessonDeleting) {
                        setLessonDeleteOpen(false);
                        setLessonPendingDelete(null);
                        setLessonDeleteModule(null);
                    }
                }}
                onConfirm={confirmDeleteLesson}
                loading={lessonDeleting}
                title="Eliminar lección"
                description={
                    <>
                        ¿Eliminar la lección{' '}
                        <span className="font-semibold text-slate-800">«{lessonPendingDelete?.title}»</span> del módulo{' '}
                        <span className="font-semibold text-slate-800">«{lessonDeleteModule?.title}»</span>?
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

CourseModulesIndex.layout = (pageProps: Props) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cursos', href: coursesRoute.index.url() },
        {
            title: `Módulos · ${pageProps.course.title}`,
            href: coursesRoute.modules.index.url({ course: pageProps.course.id }),
        },
    ],
});
