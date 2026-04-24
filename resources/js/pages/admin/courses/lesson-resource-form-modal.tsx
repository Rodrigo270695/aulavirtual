/**
 * Alta / edición de recurso externo vinculado a una lección.
 */

import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSelect, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import coursesRoute from '@/routes/admin/courses';
import type { AdminLessonResource, AdminLessonResourceType } from '@/types';

const RESOURCE_TYPE_OPTIONS: { value: AdminLessonResourceType; label: string }[] = [
    { value: 'link', label: 'Enlace web' },
    { value: 'github', label: 'GitHub' },
    { value: 'download', label: 'Descarga externa' },
    { value: 'software', label: 'Software / herramienta' },
    { value: 'dataset', label: 'Dataset / datos' },
];

interface FormData {
    resource_type: AdminLessonResourceType;
    title: string;
    url: string;
    description: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    courseId: string;
    moduleId: string;
    lessonId: string;
    resource: AdminLessonResource | null;
}

export function LessonResourceFormModal({
    open,
    onClose,
    courseId,
    moduleId,
    lessonId,
    resource,
}: Props) {
    const isEditing = resource !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        resource_type: 'link',
        title: '',
        url: '',
        description: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        if (resource) {
            setData({
                resource_type: resource.resource_type,
                title: resource.title,
                url: resource.url,
                description: resource.description ?? '',
            });
        } else {
            setData({
                resource_type: 'link',
                title: '',
                url: '',
                description: '',
            });
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, resource]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: handleClose, preserveScroll: true };

        if (isEditing && resource) {
            put(
                coursesRoute.modules.lessons.resources.update.url({
                    course: courseId,
                    course_module: moduleId,
                    lesson: lessonId,
                    lesson_resource: resource.id,
                }),
                opts,
            );
        } else {
            post(
                coursesRoute.modules.lessons.resources.store.url({
                    course: courseId,
                    course_module: moduleId,
                    lesson: lessonId,
                }),
                opts,
            );
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar recurso' : 'Nuevo recurso'}
            description="Enlaces externos, repositorios, descargas o referencias para el estudiante."
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
                        form="lesson-resource-form"
                        disabled={processing}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {processing ? 'Guardando…' : isEditing ? 'Guardar' : 'Añadir'}
                    </button>
                </div>
            }
        >
            <form id="lesson-resource-form" onSubmit={handleSubmit} className="space-y-4 px-1 py-2">
                <FormSelect
                    id="res-type"
                    label="Tipo"
                    value={data.resource_type}
                    onValueChange={(v) => setData('resource_type', v as AdminLessonResourceType)}
                    options={RESOURCE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    error={errors.resource_type}
                    required
                />

                <FormInput
                    id="res-title"
                    label="Título"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={errors.title}
                    required
                />

                <FormInput
                    id="res-url"
                    label="URL"
                    type="url"
                    placeholder="https://"
                    value={data.url}
                    onChange={(e) => setData('url', e.target.value)}
                    error={errors.url}
                    required
                />

                <FormTextarea
                    id="res-description"
                    label="Descripción"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                    rows={3}
                />
            </form>
        </Modal>
    );
}
