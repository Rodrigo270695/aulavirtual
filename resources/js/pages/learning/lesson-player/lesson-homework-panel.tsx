import { router } from '@inertiajs/react';
import { ExternalLink, Loader2, Trash2, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { appToastQueue } from '@/lib/app-toast-queue';
import learning from '@/routes/learning';
import type { LessonHomeworkCan, LessonHomeworkDeliverable, PlatformColors } from './types';

const MAX_FILES = 15;

type Props = {
    enrollmentId: string;
    lessonId: string;
    can: LessonHomeworkCan;
    promptTitle: string;
    promptText: string | null;
    deliverables: LessonHomeworkDeliverable[];
    platform: PlatformColors;
};

export function LessonHomeworkPanel({
    enrollmentId,
    lessonId,
    can,
    promptTitle,
    promptText,
    deliverables,
    platform,
}: Props) {
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const reloadModules = useCallback(() => {
        router.reload({ only: ['modules'], preserveScroll: true });
    }, []);

    const upload = useCallback(
        async (file: File) => {
            if (!can.create) {
                appToastQueue.add({ title: 'No tienes permiso para subir entregas.', variant: 'danger' }, { timeout: 6000 });
                return;
            }
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) {
                appToastQueue.add({ title: 'No se encontró el token de seguridad. Recarga la página.', variant: 'danger' }, { timeout: 6000 });
                return;
            }
            if (deliverables.length >= MAX_FILES) {
                appToastQueue.add(
                    { title: `Máximo ${MAX_FILES} archivos por entrega en esta lección.`, variant: 'danger' },
                    { timeout: 6000 },
                );
                return;
            }
            const fd = new FormData();
            fd.append('file', file);
            setUploading(true);
            try {
                const res = await fetch(
                    learning.lessons.homework.store.url({ enrollment: enrollmentId, lesson: lessonId }),
                    {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'X-CSRF-TOKEN': token,
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: fd,
                    },
                );
                const body = (await res.json().catch(() => ({}))) as {
                    ok?: boolean;
                    message?: string;
                    errors?: Record<string, string[]>;
                };
                if (!res.ok || !body.ok) {
                    const fromErrors =
                        body.errors && typeof body.errors === 'object'
                            ? Object.values(body.errors)
                                  .flat()
                                  .filter(Boolean)
                                  .join(' ')
                            : '';
                    const title =
                        typeof body.message === 'string'
                            ? body.message
                            : fromErrors || `No se pudo subir (${res.status})`;
                    appToastQueue.add({ title, variant: 'danger' }, { timeout: 6000 });
                    return;
                }
                appToastQueue.add({ title: 'Archivo subido correctamente.', variant: 'success' }, { timeout: 4000 });
                reloadModules();
            } catch {
                appToastQueue.add({ title: 'Error de red al subir el archivo.', variant: 'danger' }, { timeout: 6000 });
            } finally {
                setUploading(false);
            }
        },
        [can.create, deliverables.length, enrollmentId, lessonId, reloadModules],
    );

    const remove = useCallback(
        async (homeworkId: string) => {
            if (!can.delete) {
                appToastQueue.add({ title: 'No tienes permiso para eliminar entregas.', variant: 'danger' }, { timeout: 6000 });
                return;
            }
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) {
                appToastQueue.add({ title: 'No se encontró el token de seguridad. Recarga la página.', variant: 'danger' }, { timeout: 6000 });
                return;
            }
            setDeletingId(homeworkId);
            try {
                const res = await fetch(
                    learning.lessons.homework.destroy.url({
                        enrollment: enrollmentId,
                        lesson: lessonId,
                        homework: homeworkId,
                    }),
                    {
                        method: 'DELETE',
                        credentials: 'same-origin',
                        headers: {
                            'X-CSRF-TOKEN': token,
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
                if (!res.ok || !body.ok) {
                    appToastQueue.add(
                        { title: typeof body.message === 'string' ? body.message : `No se pudo eliminar (${res.status})`, variant: 'danger' },
                        { timeout: 6000 },
                    );
                    return;
                }
                appToastQueue.add({ title: 'Archivo eliminado.', variant: 'success' }, { timeout: 4000 });
                reloadModules();
            } catch {
                appToastQueue.add({ title: 'Error de red al eliminar.', variant: 'danger' }, { timeout: 6000 });
            } finally {
                setDeletingId(null);
            }
        },
        [can.delete, enrollmentId, lessonId, reloadModules],
    );

    return (
        <div className="border-t border-slate-100/90 bg-linear-to-br from-slate-50/80 via-white to-violet-50/30 px-6 py-6 sm:px-8 sm:py-7">
            <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">Premisa del docente</p>
                <p className="mt-1 text-sm font-semibold text-violet-950">{promptTitle}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-violet-900">
                    {promptText?.trim() || 'Sigue las indicaciones del docente y sube tu archivo de respuesta.'}
                </p>
            </div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600/90">Tu entrega</p>
                    <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Archivos de la tarea</h3>
                    <p className="mt-1 max-w-prose text-sm text-slate-600">
                        Sube tu trabajo en PDF, Word (.doc / .docx), ZIP o RAR (máx. ~25 MB por archivo). Puedes adjuntar
                        hasta {MAX_FILES} archivos.
                    </p>
                </div>
                <label
                    htmlFor="lesson-homework-file"
                    className={can.create ? 'inline-flex cursor-pointer' : 'inline-flex cursor-not-allowed'}
                >
                    <input
                        id="lesson-homework-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.zip,.rar,application/pdf,application/zip"
                        className="sr-only"
                        disabled={!can.create || uploading || deliverables.length >= MAX_FILES}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) {
                                void upload(f);
                            }
                        }}
                    />
                    <span
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
                        style={{
                            background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                        }}
                    >
                        {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                        {uploading ? 'Subiendo…' : 'Subir archivo'}
                    </span>
                </label>
            </div>

            {deliverables.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                    Aún no has subido ningún archivo para esta entrega.
                </p>
            ) : (
                <ul className="space-y-2">
                    {deliverables.map((d) => (
                        <li
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm"
                        >
                            <a
                                href={d.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-violet-800 hover:underline"
                            >
                                <span className="truncate">{d.title}</span>
                                <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                            </a>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                disabled={!can.delete || deletingId === d.id}
                                onClick={() => void remove(d.id)}
                            >
                                {deletingId === d.id ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                ) : (
                                    <Trash2 className="size-4" aria-hidden />
                                )}
                                <span className="sr-only">Eliminar</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
