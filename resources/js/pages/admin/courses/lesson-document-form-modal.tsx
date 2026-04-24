/**
 * Alta / edición de documento adjunto a una lección (archivo en storage público).
 */

import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSwitch } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import coursesRoute from '@/routes/admin/courses';
import type { AdminLessonDocument } from '@/types';

interface FormData {
    title: string;
    is_downloadable: boolean;
    file: File | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    courseId: string;
    moduleId: string;
    lessonId: string;
    document: AdminLessonDocument | null;
}

export function LessonDocumentFormModal({
    open,
    onClose,
    courseId,
    moduleId,
    lessonId,
    document,
}: Props) {
    const isEditing = document !== null;

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm<FormData>({
        title: '',
        is_downloadable: true,
        file: null,
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        if (document) {
            setData({
                title: document.title,
                is_downloadable: document.is_downloadable,
                file: null,
            });
        } else {
            setData({
                title: '',
                is_downloadable: true,
                file: null,
            });
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, document]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const storeUrl = coursesRoute.modules.lessons.documents.store.url({
            course: courseId,
            course_module: moduleId,
            lesson: lessonId,
        });

        if (isEditing && document) {
            const updateUrl = coursesRoute.modules.lessons.documents.update.url({
                course: courseId,
                course_module: moduleId,
                lesson: lessonId,
                lesson_document: document.id,
            });
            if (data.file) {
                transform((form) => ({ ...form, _method: 'put' as const }));
                post(updateUrl, { onSuccess: handleClose, preserveScroll: true, forceFormData: true });
            } else {
                router.put(
                    updateUrl,
                    { title: data.title, is_downloadable: data.is_downloadable },
                    { onSuccess: handleClose, preserveScroll: true },
                );
            }
            return;
        }

        transform((form) => form);
        post(storeUrl, { onSuccess: handleClose, preserveScroll: true, forceFormData: true });
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isEditing ? 'Editar documento' : 'Nuevo documento'}
            description="PDF, Office o ZIP (máx. ~25 MB). El archivo se guarda en el almacenamiento público del servidor."
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
                        form="lesson-document-form"
                        disabled={processing}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {processing ? 'Guardando…' : isEditing ? 'Guardar' : 'Subir'}
                    </button>
                </div>
            }
        >
            <form id="lesson-document-form" onSubmit={handleSubmit} className="space-y-4 px-1 py-2">
                <FormInput
                    id="doc-title"
                    label="Título"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={errors.title}
                    required
                />

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="doc-file" className="text-sm font-medium text-slate-700">
                        Archivo{!isEditing && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                        id="doc-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,application/pdf"
                        className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                    />
                    {errors.file && <p className="text-sm text-red-600">{errors.file}</p>}
                    {isEditing && document ? (
                        <p className="text-xs text-slate-500">
                            Archivo actual: {document.original_filename}. Deja vacío para no cambiarlo.
                        </p>
                    ) : null}
                </div>

                <FormSwitch
                    id="doc-downloadable"
                    label="Permitir descarga"
                    description="Si se desactiva, el uso previsto es solo visualización en navegador (según implementación futura)."
                    checked={data.is_downloadable}
                    onCheckedChange={(v) => setData('is_downloadable', v)}
                    error={errors.is_downloadable}
                />
            </form>
        </Modal>
    );
}
