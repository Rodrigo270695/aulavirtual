import { ExternalLink, FileText, Link2, Sparkles } from 'lucide-react';
import type { LessonItem, PlatformColors } from './types';
import { resourceTypeLabelEs } from './utils';

type Props = {
    lesson: LessonItem;
    platform: PlatformColors;
};

export function LessonMaterials({ lesson, platform }: Props) {
    const hasDocs = lesson.documents.length > 0;
    const hasResources = lesson.resources.length > 0;

    if (!hasDocs && !hasResources) {
        return (
            <p className="text-center text-sm text-slate-500 sm:text-left">
                No hay materiales adicionales en esta lección.
            </p>
        );
    }

    return (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-300/15 sm:p-8">
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent"
                aria-hidden
            />
            <div className="flex flex-col gap-3 border-b border-slate-100/90 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                    <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                        }}
                    >
                        <Sparkles className="size-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                            Materiales de la lección
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">PDFs y enlaces seleccionados por tu instructor.</p>
                    </div>
                </div>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 ring-1 ring-slate-100/80 sm:p-5">
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        <FileText className="size-3.5 text-slate-400" aria-hidden />
                        Documentos
                    </h4>
                    {!hasDocs ? (
                        <p className="mt-4 rounded-lg border border-dashed border-slate-200/80 bg-white/60 px-3 py-4 text-center text-sm text-slate-500">
                            Sin documentos adjuntos.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-2.5">
                            {lesson.documents.map((doc) => (
                                <li key={doc.id}>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3.5 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span
                                                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                                                style={{
                                                    background: `linear-gradient(145deg, ${platform.color_primary}, ${platform.color_accent})`,
                                                }}
                                            >
                                                <FileText className="size-5 opacity-95" aria-hidden />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-slate-900 group-hover:underline group-hover:decoration-slate-300 group-hover:underline-offset-2">
                                                    {doc.title}
                                                </span>
                                                {doc.is_downloadable ? (
                                                    <span className="mt-0.5 block text-xs font-medium text-emerald-600/90">
                                                        Descarga permitida
                                                    </span>
                                                ) : null}
                                            </span>
                                        </span>
                                        <ExternalLink className="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-700" aria-hidden />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 ring-1 ring-slate-100/80 sm:p-5">
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        <Link2 className="size-3.5 text-slate-400" aria-hidden />
                        Enlaces y recursos
                    </h4>
                    {!hasResources ? (
                        <p className="mt-4 rounded-lg border border-dashed border-slate-200/80 bg-white/60 px-3 py-4 text-center text-sm text-slate-500">
                            Sin enlaces adicionales.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-2.5">
                            {lesson.resources.map((resource) => (
                                <li key={resource.id}>
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3.5 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-md ring-1 ring-slate-700/50">
                                                <Link2 className="size-5" aria-hidden />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-slate-900 group-hover:underline group-hover:decoration-slate-300 group-hover:underline-offset-2">
                                                    {resource.title}
                                                </span>
                                                <span className="mt-0.5 block text-xs font-medium text-slate-500">
                                                    {resourceTypeLabelEs(resource.resource_type)}
                                                </span>
                                            </span>
                                        </span>
                                        <ExternalLink className="size-4 shrink-0 text-slate-400 transition group-hover:text-slate-700" aria-hidden />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
