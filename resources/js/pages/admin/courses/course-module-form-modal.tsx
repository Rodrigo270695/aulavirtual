/**
 * Alta / edición de un módulo de curso (unidad del contenido).
 */

import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSwitch, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import coursesRoute from '@/routes/admin/courses';
import { cn } from '@/lib/utils';
import type { AdminCourseModule } from '@/types';

interface FormData {
    title: string;
    description: string;
    sort_order: string;
    is_free_preview: boolean;
    duration_minutes: string;
    total_lessons: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    courseId: string;
    module: AdminCourseModule | null;
}

export function CourseModuleFormModal({ open, onClose, courseId, module }: Props) {
    const isEditing = module !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        title: '',
        description: '',
        sort_order: '1',
        is_free_preview: false,
        duration_minutes: '0',
        total_lessons: '0',
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        if (module) {
            setData({
                title: module.title,
                description: module.description ?? '',
                sort_order: String(module.sort_order),
                is_free_preview: module.is_free_preview,
                duration_minutes: String(module.duration_minutes),
                total_lessons: String(module.total_lessons),
            });
        } else {
            setData({
                title: '',
                description: '',
                sort_order: '1',
                is_free_preview: false,
                duration_minutes: '0',
                total_lessons: '0',
            });
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, module]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: handleClose, preserveScroll: true };
        if (isEditing && module) {
            put(
                coursesRoute.modules.update.url({
                    course: courseId,
                    course_module: module.id,
                }),
                opts,
            );
        } else {
            post(coursesRoute.modules.store.url({ course: courseId }), opts);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar módulo' : 'Nuevo módulo'}
            description="Define la unidad dentro del curso. El orden en lista también se puede cambiar con las flechas."
            size="lg"
            footer={
                <div className="flex w-full justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="course-module-form"
                        disabled={processing}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {processing ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear módulo'}
                    </button>
                </div>
            }
        >
            <form id="course-module-form" onSubmit={handleSubmit} className="space-y-4 px-1 py-2">
                <FormInput
                    id="module-title"
                    label="Título"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={errors.title}
                    required
                />

                <FormTextarea
                    id="module-description"
                    label="Descripción"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                    rows={3}
                />

                {/* items-end: si una etiqueta ocupa 2 líneas, los inputs quedan alineados por la base */}
                <div
                    className={cn(
                        'grid grid-cols-1 gap-4 sm:items-end',
                        isEditing ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
                    )}
                >
                    {isEditing && (
                        <FormInput
                            id="module-sort-order"
                            label="Orden (número)"
                            type="number"
                            min={1}
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', e.target.value)}
                            error={errors.sort_order}
                        />
                    )}
                    <FormInput
                        id="module-duration"
                        label="Duración (min)"
                        type="number"
                        min={0}
                        value={data.duration_minutes}
                        onChange={(e) => setData('duration_minutes', e.target.value)}
                        error={errors.duration_minutes}
                    />
                    <FormInput
                        id="module-lessons"
                        label="Nº de lecciones"
                        type="number"
                        min={0}
                        value={data.total_lessons}
                        onChange={(e) => setData('total_lessons', e.target.value)}
                        error={errors.total_lessons}
                    />
                </div>

                <FormSwitch
                    id="module-free-preview"
                    label="Vista previa gratuita"
                    description="Permite que estudiantes vean este módulo sin comprar (si la plataforma lo aplica)."
                    checked={data.is_free_preview}
                    onCheckedChange={(v) => setData('is_free_preview', v)}
                    error={errors.is_free_preview}
                />
            </form>
        </Modal>
    );
}
