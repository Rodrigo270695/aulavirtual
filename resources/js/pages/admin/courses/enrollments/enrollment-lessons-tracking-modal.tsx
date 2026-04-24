/**
 * Modal: lecciones del curso, progreso del alumno y archivos de tarea subidos.
 */

import { ExternalLink, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { appToastQueue } from '@/lib/app-toast-queue';
import type { AdminEnrollmentTrackingResponse } from '@/types';

const PROGRESS_STATUS_LABEL: Record<string, string> = {
    not_started: 'Sin iniciar',
    in_progress: 'En curso',
    completed: 'Completada',
};

function progressBadgeClass(status: string): string {
    switch (status) {
        case 'completed':
            return 'bg-emerald-50 text-emerald-700';
        case 'in_progress':
            return 'bg-sky-50 text-sky-800';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

function formatShortDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface Props {
    open: boolean;
    onClose: () => void;
    trackingUrl: string;
    studentTitle: string;
}

export function EnrollmentLessonsTrackingModal({ open, onClose, trackingUrl, studentTitle }: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AdminEnrollmentTrackingResponse | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setData(null);
        try {
            const res = await fetch(trackingUrl, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const body = (await res.json().catch(() => null)) as AdminEnrollmentTrackingResponse | null;
            if (!res.ok || !body?.modules) {
                appToastQueue.add(
                    { title: 'No se pudo cargar el seguimiento. Intenta de nuevo.', variant: 'danger' },
                    { timeout: 6000 },
                );
                return;
            }
            setData(body);
        } finally {
            setLoading(false);
        }
    }, [trackingUrl]);

    useEffect(() => {
        if (open) {
            void load();
        } else {
            setData(null);
        }
    }, [open, load]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Seguimiento y tareas"
            description={studentTitle}
            size="2xl"
        >
            {loading && (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
                    <Loader2 className="size-8 animate-spin text-blue-500" />
                    <span className="text-sm">Cargando lecciones…</span>
                </div>
            )}

            {!loading && data && (
                <div className="space-y-4">
                    <div
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #fff 45%)' }}
                    >
                        <div className="flex min-w-32 flex-col">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Progreso curso
                            </span>
                            <span className="text-lg font-bold tabular-nums text-slate-800">
                                {Number(data.enrollment.progress_pct).toFixed(1)}%
                            </span>
                        </div>
                        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
                        <div className="flex flex-col text-slate-700">
                            <span className="font-medium tabular-nums text-slate-800">
                                {data.summary.lessons_completed}/{data.summary.lessons_total} lecciones completadas
                            </span>
                            {data.summary.homework_lessons_total > 0 && (
                                <span className="text-xs text-slate-500">
                                    Entregas de tarea: {data.summary.homework_submitted_lessons}/
                                    {data.summary.homework_lessons_total} lecciones con tarea
                                </span>
                            )}
                        </div>
                    </div>

                    {data.modules.map((mod) => (
                        <section key={mod.id} className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{mod.title}</h3>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {mod.lessons.map((lesson) => (
                                    <li key={lesson.id} className="px-3 py-2.5">
                                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-medium text-slate-800">{lesson.title}</span>
                                                    {!lesson.is_published && (
                                                        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                                            Borrador
                                                        </span>
                                                    )}
                                                    {lesson.has_homework && (
                                                        <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                                                            Tarea
                                                        </span>
                                                    )}
                                                </div>
                                                {lesson.homework_title && (
                                                    <p className="mt-0.5 text-[11px] text-slate-500">{lesson.homework_title}</p>
                                                )}
                                            </div>
                                            <span
                                                className={`shrink-0 self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${progressBadgeClass(lesson.progress.status)}`}
                                            >
                                                {PROGRESS_STATUS_LABEL[lesson.progress.status] ??
                                                    lesson.progress.status}
                                                {lesson.progress.status !== 'not_started' && (
                                                    <span className="ml-1 font-normal tabular-nums opacity-90">
                                                        · {lesson.progress.watch_pct.toFixed(0)}% visto
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {lesson.has_homework && (
                                            <div className="mt-2 rounded-lg bg-slate-50/80 px-2.5 py-2">
                                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                    Archivos subidos
                                                </p>
                                                {lesson.deliverables.length === 0 ? (
                                                    <p className="text-xs text-slate-400">Sin entregas aún.</p>
                                                ) : (
                                                    <ul className="space-y-1">
                                                        {lesson.deliverables.map((d) => (
                                                            <li key={d.id}>
                                                                <a
                                                                    href={d.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                                >
                                                                    <span className="truncate">{d.original_filename}</span>
                                                                    <ExternalLink className="size-3 shrink-0 opacity-70" />
                                                                </a>
                                                                <span className="ml-2 text-[10px] text-slate-400">
                                                                    {formatShortDate(d.created_at)}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </Modal>
    );
}
