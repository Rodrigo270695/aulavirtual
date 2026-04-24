/**
 * Alta / edición de lección dentro de un módulo.
 */

import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSelect, FormSwitch, FormTextarea } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import coursesRoute from '@/routes/admin/courses';
import type { AdminCourseLesson, AdminLessonType } from '@/types';

const LESSON_TYPE_OPTIONS: { value: AdminLessonType; label: string }[] = [
    { value: 'article', label: 'Artículo (texto/HTML)' },
    { value: 'video', label: 'Vídeo' },
    { value: 'document', label: 'Documento' },
    { value: 'quiz', label: 'Cuestionario' },
    { value: 'assignment', label: 'Tarea / entrega' },
];

interface FormData {
    title: string;
    description: string;
    lesson_type: AdminLessonType;
    sort_order: string;
    duration_seconds: string;
    is_free_preview: boolean;
    is_published: boolean;
    has_homework: boolean;
    content_text: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    courseId: string;
    moduleId: string;
    lesson: AdminCourseLesson | null;
}

export function CourseLessonFormModal({ open, onClose, courseId, moduleId, lesson }: Props) {
    const isEditing = lesson !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<FormData>({
        title: '',
        description: '',
        lesson_type: 'article',
        sort_order: '1',
        duration_seconds: '0',
        is_free_preview: false,
        is_published: false,
        has_homework: false,
        content_text: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        if (lesson) {
            setData({
                title: lesson.title,
                description: lesson.description ?? '',
                lesson_type: lesson.lesson_type,
                sort_order: String(lesson.sort_order),
                duration_seconds: String(lesson.duration_seconds),
                is_free_preview: lesson.is_free_preview,
                is_published: lesson.is_published,
                has_homework: lesson.has_homework ?? false,
                content_text: lesson.content_text ?? '',
            });
        } else {
            setData({
                title: '',
                description: '',
                lesson_type: 'article',
                sort_order: '1',
                duration_seconds: '0',
                is_free_preview: false,
                is_published: false,
                has_homework: false,
                content_text: '',
            });
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, lesson]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: handleClose, preserveScroll: true };
        if (isEditing && lesson) {
            put(
                coursesRoute.modules.lessons.update.url({
                    course: courseId,
                    course_module: moduleId,
                    lesson: lesson.id,
                }),
                opts,
            );
        } else {
            post(
                coursesRoute.modules.lessons.store.url({
                    course: courseId,
                    course_module: moduleId,
                }),
                opts,
            );
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar lección' : 'Nueva lección'}
            description="Unidad de contenido dentro del módulo. El tipo define cómo se mostrará al estudiante."
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
                        form="course-lesson-form"
                        disabled={processing}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {processing ? 'Guardando…' : isEditing ? 'Guardar' : 'Crear lección'}
                    </button>
                </div>
            }
        >
            <form id="course-lesson-form" onSubmit={handleSubmit} className="space-y-4 px-1 py-2">
                <FormInput
                    id="lesson-title"
                    label="Título"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={errors.title}
                    required
                />

                <FormTextarea
                    id="lesson-description"
                    label="Descripción"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                    rows={2}
                />

                <FormSelect
                    id="lesson-type"
                    label="Tipo de lección"
                    value={data.lesson_type}
                    onValueChange={(v) => setData('lesson_type', v as AdminLessonType)}
                    options={LESSON_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    error={errors.lesson_type}
                    required
                />

                <div
                    className={
                        isEditing
                            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end'
                            : 'grid grid-cols-1 gap-4 sm:grid-cols-1'
                    }
                >
                    {isEditing && (
                        <FormInput
                            id="lesson-sort-order"
                            label="Orden (número)"
                            type="number"
                            min={1}
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', e.target.value)}
                            error={errors.sort_order}
                        />
                    )}
                    <FormInput
                        id="lesson-duration-sec"
                        label="Duración (segundos)"
                        type="number"
                        min={0}
                        value={data.duration_seconds}
                        onChange={(e) => setData('duration_seconds', e.target.value)}
                        error={errors.duration_seconds}
                    />
                </div>

                <FormTextarea
                    id="lesson-content-text"
                    label="Contenido (HTML / texto)"
                    hint="Premisa de la tarea o ampliación del tema; el vídeo y los adjuntos del docente se gestionan en Materiales."
                    value={data.content_text}
                    onChange={(e) => setData('content_text', e.target.value)}
                    error={errors.content_text}
                    rows={4}
                />

                <FormSwitch
                    id="lesson-has-homework"
                    label="Pedir entrega (archivos del alumno)"
                    description="Si está activo, el alumno podrá subir PDF, Word, ZIP o RAR en el aula. La premisa va en título, descripción y contenido. Compatible con cualquier tipo de lección (p. ej. vídeo + tarea)."
                    checked={data.has_homework}
                    onCheckedChange={(v) => setData('has_homework', v)}
                    error={errors.has_homework}
                />

                <FormSwitch
                    id="lesson-free-preview"
                    label="Vista previa gratuita"
                    description="Permite ver esta lección sin comprar el curso (si aplica)."
                    checked={data.is_free_preview}
                    onCheckedChange={(v) => setData('is_free_preview', v)}
                    error={errors.is_free_preview}
                />

                <FormSwitch
                    id="lesson-published"
                    label="Publicada"
                    description="Visible para estudiantes matriculados cuando el curso esté publicado."
                    checked={data.is_published}
                    onCheckedChange={(v) => setData('is_published', v)}
                    error={errors.is_published}
                />
            </form>
        </Modal>
    );
}
