import { BookOpen, Check, ClipboardList, ExternalLink, FileStack, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LessonItem, LessonProgress, PlatformColors, StudentQuizSessionPatch } from './types';
import { LessonHomeworkPanel } from './lesson-homework-panel';
import { LessonQuizPanel } from './lesson-quiz-panel';
import { lessonTypeLabelEs, providerOpenLabel } from './utils';

type Props = {
    enrollmentId: string;
    lesson: LessonItem;
    /** Tras enviar o 422 por intentos, mantiene intentos al cambiar de lección (props Inertia no se refrescan). */
    onQuizSessionChange?: (lessonId: string, patch: StudentQuizSessionPatch) => void;
    activeProgress: LessonProgress | null;
    activeLessonNumber: number | null;
    lessonTotal: number;
    saving: boolean;
    platform: PlatformColors;
    onMarkComplete: () => void;
};

function looksLikeHtml(s: string): boolean {
    return /<\/?[a-z][\s>]/i.test(s);
}

function LessonVideoStage({ lesson }: { lesson: LessonItem }) {
    return (
        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-slate-900/20 ring-offset-2 ring-offset-slate-100/50">
            {lesson.video?.embed_url ? (
                <div>
                    <iframe
                        src={lesson.video.embed_url}
                        title={lesson.title}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                    {lesson.video.provider_page_url ? (
                        <p className="border-t border-slate-800/80 bg-slate-900 px-3 py-2 text-right text-xs">
                            <a
                                href={lesson.video.provider_page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-slate-300 underline decoration-slate-500 underline-offset-2 hover:text-white"
                            >
                                <ExternalLink className="size-3.5" aria-hidden />
                                {providerOpenLabel(lesson.video.source)}
                            </a>
                        </p>
                    ) : null}
                </div>
            ) : lesson.video?.url ? (
                <video controls className="aspect-video w-full bg-black" src={lesson.video.url} />
            ) : lesson.video ? (
                <div className="flex min-h-[200px] items-center justify-center px-6 py-10 text-center text-sm text-slate-400">
                    No se puede mostrar el vídeo aquí. Si sigue igual, coméntalo al instructor.
                </div>
            ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                    <BookOpen className="size-10 text-slate-600" aria-hidden />
                    <p className="text-sm text-slate-400">Esta lección aún no incluye vídeo.</p>
                </div>
            )}
        </div>
    );
}

function LessonNonVideoPrimary({
    lesson,
    enrollmentId,
    onQuizSessionChange,
}: {
    lesson: LessonItem;
    enrollmentId: string;
    onQuizSessionChange?: (lessonId: string, patch: StudentQuizSessionPatch) => void;
}) {
    const type = lesson.lesson_type.toLowerCase();
    const raw = lesson.content_text?.trim() ?? '';

    const shellClass =
        'rounded-2xl border border-slate-200/90 bg-linear-to-br from-white via-slate-50/60 to-white px-5 py-6 shadow-inner shadow-slate-200/40 sm:px-7 sm:py-8';

    if (type === 'article') {
        if (raw) {
            return (
                <div className={shellClass}>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Contenido</p>
                    {looksLikeHtml(raw) ? (
                        <div
                            className="max-w-none text-[15px] leading-relaxed text-slate-700 [&_a]:font-medium [&_a]:text-violet-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:text-slate-100 [&_strong]:text-slate-900 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
                            // Contenido definido por el equipo del curso (administración).
                            dangerouslySetInnerHTML={{ __html: raw }}
                        />
                    ) : (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">{raw}</p>
                    )}
                </div>
            );
        }
        return (
            <div className={cn(shellClass, 'text-center')}>
                <FileText className="mx-auto size-10 text-slate-300" aria-hidden />
                <p className="mt-3 text-sm font-medium text-slate-700">Artículo</p>
                <p className="mt-2 text-sm text-slate-500">
                    No hay texto o HTML adicional en esta lección. Revisa la descripción arriba o los materiales.
                </p>
            </div>
        );
    }

    if (type === 'quiz') {
        if (lesson.quiz) {
            return (
                <LessonQuizPanel
                    enrollmentId={enrollmentId}
                    lessonId={lesson.id}
                    quiz={lesson.quiz}
                    onQuizSessionChange={onQuizSessionChange}
                />
            );
        }
        return (
            <div className={cn(shellClass, 'text-center')}>
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-200/80">
                    <ClipboardList className="size-6" aria-hidden />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-800">Cuestionario</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Esta lección es de tipo cuestionario, pero aún no hay uno activo configurado o el instructor lo tiene
                    desactivado. Revisa los materiales o contacta con el curso.
                </p>
            </div>
        );
    }

    if (type === 'document') {
        const count = lesson.documents.length;
        return (
            <div className={cn(shellClass, 'text-center')}>
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-800 ring-1 ring-sky-200/80">
                    <FileStack className="size-6" aria-hidden />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-800">Documento</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {count > 0
                        ? `Esta lección incluye ${count} documento${count === 1 ? '' : 's'} en «Materiales de la lección» (debajo).`
                        : 'Los archivos del instructor aparecerán en «Materiales de la lección» cuando estén publicados.'}
                </p>
            </div>
        );
    }

    return (
        <div className={cn(shellClass, 'text-center')}>
            <BookOpen className="mx-auto size-10 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-slate-700">{lessonTypeLabelEs(lesson.lesson_type)}</p>
            <p className="mt-2 text-sm text-slate-500">Esta lección no muestra un reproductor de vídeo.</p>
            {raw ? (
                <div className="mt-5 border-t border-slate-200/80 pt-5 text-left text-sm text-slate-700">
                    {looksLikeHtml(raw) ? (
                        <div
                            className="max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: raw }}
                        />
                    ) : (
                        <p className="whitespace-pre-wrap">{raw}</p>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export function LessonArticle({
    enrollmentId,
    lesson,
    onQuizSessionChange,
    activeProgress,
    activeLessonNumber,
    lessonTotal,
    saving,
    platform,
    onMarkComplete,
}: Props) {
    const type = lesson.lesson_type.toLowerCase();
    const hasPlayableVideo = Boolean(lesson.video?.embed_url || lesson.video?.url);
    const showVideoStage = type === 'video' || hasPlayableVideo;

    return (
        <article className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-300/20">
            <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.08] blur-2xl"
                style={{ backgroundColor: platform.color_primary }}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full opacity-[0.07] blur-2xl"
                style={{ backgroundColor: platform.color_accent }}
                aria-hidden
            />
            <div className="relative border-b border-slate-100/90 bg-linear-to-br from-white via-slate-50/40 to-white px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="h-6 rounded-lg border-slate-200/80 bg-white/90 px-2.5 text-[11px] font-semibold text-slate-600 shadow-sm"
                            >
                                {lessonTypeLabelEs(lesson.lesson_type)}
                            </Badge>
                            {activeLessonNumber !== null && lessonTotal > 0 ? (
                                <span className="rounded-lg border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-slate-500 shadow-sm">
                                    Lección {activeLessonNumber} de {lessonTotal}
                                </span>
                            ) : null}
                            {lesson.has_homework ? (
                                <span className="rounded-lg border border-violet-200/80 bg-violet-50/90 px-2.5 py-1 text-[11px] font-semibold text-violet-800 shadow-sm">
                                    Entrega
                                </span>
                            ) : null}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem] sm:leading-snug">
                            {lesson.title}
                        </h2>
                        {lesson.description?.trim() ? (
                            <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                                {lesson.description.trim()}
                            </p>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        disabled={saving || activeProgress?.status === 'completed'}
                        onClick={onMarkComplete}
                        className={cn(
                            'h-11 shrink-0 rounded-xl px-5 font-semibold shadow-md transition hover:opacity-95 active:scale-[0.98] sm:min-w-[200px]',
                            activeProgress?.status === 'completed'
                                ? 'border border-emerald-200/90 bg-emerald-50 text-emerald-800 shadow-emerald-100/50 hover:bg-emerald-50'
                                : 'border-0 text-white shadow-slate-400/25',
                        )}
                        style={
                            activeProgress?.status === 'completed'
                                ? undefined
                                : {
                                      background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                                  }
                        }
                    >
                        {saving ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                Guardando…
                            </span>
                        ) : activeProgress?.status === 'completed' ? (
                            <span className="inline-flex items-center gap-2">
                                <Check className="size-4" aria-hidden />
                                Lección completada
                            </span>
                        ) : (
                            'Marcar como completada'
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative px-6 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-5">
                {showVideoStage ? (
                    <LessonVideoStage lesson={lesson} />
                ) : (
                    <LessonNonVideoPrimary
                        lesson={lesson}
                        enrollmentId={enrollmentId}
                        onQuizSessionChange={onQuizSessionChange}
                    />
                )}
            </div>
            {lesson.has_homework && lesson.homework_can.view ? (
                <LessonHomeworkPanel
                    enrollmentId={enrollmentId}
                    lessonId={lesson.id}
                    can={lesson.homework_can}
                    promptTitle={lesson.homework_title ?? lesson.title}
                    promptText={lesson.homework_instructions}
                    deliverables={lesson.homework_deliverables}
                    platform={platform}
                />
            ) : null}
        </article>
    );
}
