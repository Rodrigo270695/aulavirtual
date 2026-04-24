/**
 * Alta / edición del vídeo principal de una lección (1:1): upload o embed externo.
 */

import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { FormInput, FormSelect } from '@/components/form';
import { Modal } from '@/components/ui/modal';
import coursesRoute from '@/routes/admin/courses';
import type { AdminLessonVideo, AdminLessonVideoSource } from '@/types';
import { cn } from '@/lib/utils';

interface FormData {
    video_source: AdminLessonVideoSource;
    duration_seconds: string;
    external_url: string;
    external_embed_url: string;
    external_provider_video_id: string;
    file: File | null;
}

const SOURCE_OPTIONS: { value: AdminLessonVideoSource; label: string }[] = [
    { value: 'upload', label: 'Archivo en el servidor (MP4, WebM, MOV…)' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'vimeo', label: 'Vimeo' },
    { value: 'external', label: 'Otra URL o embed' },
];

interface Props {
    open: boolean;
    onClose: () => void;
    courseId: string;
    moduleId: string;
    lessonId: string;
    video: AdminLessonVideo | null;
}

export function LessonVideoFormModal({ open, onClose, courseId, moduleId, lessonId, video }: Props) {
    const hasVideo = video !== null;

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm<FormData>({
        video_source: 'upload',
        duration_seconds: '0',
        external_url: '',
        external_embed_url: '',
        external_provider_video_id: '',
        file: null,
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        if (video) {
            setData({
                video_source: video.video_source,
                duration_seconds: String(video.duration_seconds),
                external_url: video.external_url ?? '',
                external_embed_url: video.external_embed_url ?? '',
                external_provider_video_id: video.external_provider_video_id ?? '',
                file: null,
            });
        } else {
            setData({
                video_source: 'upload',
                duration_seconds: '0',
                external_url: '',
                external_embed_url: '',
                external_provider_video_id: '',
                file: null,
            });
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, video]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const baseArgs = { course: courseId, course_module: moduleId, lesson: lessonId };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const duration = parseInt(data.duration_seconds, 10);
        const durationSeconds = Number.isFinite(duration) ? duration : 0;
        const payloadCommon = {
            video_source: data.video_source,
            duration_seconds: durationSeconds,
            external_url: data.video_source === 'upload' ? '' : data.external_url,
            external_embed_url: data.video_source === 'upload' ? '' : data.external_embed_url,
            external_provider_video_id: data.video_source === 'upload' ? '' : data.external_provider_video_id,
        };

        if (hasVideo) {
            const updateUrl = coursesRoute.modules.lessons.video.update.url(baseArgs);
            if (data.video_source === 'upload' && data.file) {
                transform((form) => ({ ...form, ...payloadCommon, _method: 'put' as const }));
                post(updateUrl, { onSuccess: handleClose, preserveScroll: true, forceFormData: true });
                return;
            }
            router.put(updateUrl, { ...payloadCommon }, { onSuccess: handleClose, preserveScroll: true });
            return;
        }

        const storeUrl = coursesRoute.modules.lessons.video.store.url(baseArgs);
        if (data.video_source === 'upload') {
            transform((form) => ({ ...form, ...payloadCommon }));
            post(storeUrl, { onSuccess: handleClose, preserveScroll: true, forceFormData: true });
            return;
        }
        router.post(storeUrl, { ...payloadCommon }, { onSuccess: handleClose, preserveScroll: true });
    };

    const isExternal = data.video_source !== 'upload';

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={hasVideo ? 'Editar vídeo de la lección' : 'Configurar vídeo de la lección'}
            description="Una sola configuración por lección: archivo en el servidor o enlace (YouTube, Vimeo, etc.). Máx. ~100 MB en subida."
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
                        form="lesson-video-form"
                        disabled={processing}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                        {processing ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            }
        >
            <form id="lesson-video-form" onSubmit={handleSubmit} className="space-y-4 px-1 py-2">
                <FormSelect
                    id="lv-source"
                    label="Origen del vídeo"
                    required
                    accent="amber"
                    hint="El reproductor del alumno usará archivo propio o embed según elijas."
                    value={data.video_source}
                    onValueChange={(v) => setData('video_source', v as AdminLessonVideoSource)}
                    placeholder="Selecciona el origen…"
                    options={SOURCE_OPTIONS}
                    error={errors.video_source}
                    triggerClassName={cn('h-11 shadow-sm hover:border-slate-300')}
                />

                <FormInput
                    id="lv-duration"
                    label="Duración (segundos)"
                    type="number"
                    min={0}
                    value={data.duration_seconds}
                    onChange={(e) => setData('duration_seconds', e.target.value)}
                    error={errors.duration_seconds}
                    required
                />

                {isExternal ? (
                    <>
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                            <strong>YouTube / Vimeo:</strong> en el proveedor debe estar activada la opción de{' '}
                            <strong>permitir incrustación</strong> en sitios web; si no, el alumno verá el vídeo como no
                            disponible en el aula. Alternativa: subir el archivo en «Archivo en el servidor».
                        </p>
                        <FormInput
                            id="lv-external"
                            label="URL del vídeo"
                            value={data.external_url}
                            onChange={(e) => setData('external_url', e.target.value)}
                            error={errors.external_url}
                            placeholder="https://..."
                            required
                        />
                        <FormInput
                            id="lv-embed"
                            label="URL de embed (opcional)"
                            value={data.external_embed_url}
                            onChange={(e) => setData('external_embed_url', e.target.value)}
                            error={errors.external_embed_url}
                            placeholder="https://..."
                        />
                        <FormInput
                            id="lv-provider-id"
                            label="ID en el proveedor (opcional)"
                            value={data.external_provider_video_id}
                            onChange={(e) => setData('external_provider_video_id', e.target.value)}
                            error={errors.external_provider_video_id}
                        />
                    </>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="lv-file" className="text-sm font-medium text-slate-700">
                            Archivo de vídeo{!hasVideo && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                            id="lv-file"
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
                            onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                        />
                        {errors.file && <p className="text-sm text-red-600">{errors.file}</p>}
                        {hasVideo && video?.storage_path ? (
                            <p className="text-xs text-slate-500">
                                Archivo actual: {video.original_filename ?? video.storage_path}. Sube otro solo si quieres
                                reemplazarlo.
                            </p>
                        ) : null}
                    </div>
                )}
            </form>
        </Modal>
    );
}
