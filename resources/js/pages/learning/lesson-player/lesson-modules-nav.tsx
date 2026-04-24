import { Check, Circle, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LessonProgress, ModuleItem, PlatformColors } from './types';
import { lessonNavIconForLesson, lessonSidebarMetaLabel, statusLabelEs } from './utils';

type Props = {
    modules: ModuleItem[];
    activeLessonId: string;
    lessonProgressMap: Record<string, LessonProgress>;
    platform: PlatformColors;
    onSelectLesson: (lessonId: string) => void;
};

export function LessonModulesNav({
    modules,
    activeLessonId,
    lessonProgressMap,
    platform,
    onSelectLesson,
}: Props) {
    return (
        <div className="space-y-5">
            {modules.map((module) => (
                <section key={module.id}>
                    <h2 className="inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-100/90 px-2.5 py-1.5 text-[10px] font-bold uppercase leading-tight tracking-widest text-slate-500 ring-1 ring-slate-200/60">
                        <FolderOpen className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                        <span className="min-w-0 wrap-break-word">{module.title}</span>
                    </h2>
                    <ul className="mt-2 space-y-1">
                        {module.lessons.map((lesson) => {
                            const prog = lessonProgressMap[lesson.id] ?? lesson.progress;
                            const active = activeLessonId === lesson.id;
                            const TypeIcon = lessonNavIconForLesson(lesson);
                            const metaLabel = lessonSidebarMetaLabel(lesson);
                            return (
                                <li key={lesson.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectLesson(lesson.id)}
                                        className={cn(
                                            'w-full rounded-lg border border-transparent px-2.5 py-2 text-left text-sm transition-colors hover:border-slate-200 hover:bg-slate-50',
                                            active &&
                                                'border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/60 ring-offset-0',
                                        )}
                                        style={
                                            active
                                                ? { borderLeft: `3px solid ${platform.color_primary}` }
                                                : undefined
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span
                                                className={cn(
                                                    'font-medium leading-snug',
                                                    active ? 'text-slate-900' : 'text-slate-800',
                                                )}
                                            >
                                                {lesson.title}
                                            </span>
                                            {prog.status === 'completed' ? (
                                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                                                </span>
                                            ) : (
                                                <Circle className="mt-0.5 size-4 shrink-0 text-slate-300" aria-hidden />
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                            <span className="inline-flex items-center gap-1.5">
                                                <TypeIcon className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                                                {metaLabel ? (
                                                    <span className="tabular-nums">{metaLabel}</span>
                                                ) : null}
                                            </span>
                                            {metaLabel ? <span className="text-slate-300" aria-hidden>·</span> : null}
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'h-5 border-0 px-1.5 text-[10px] font-semibold uppercase tracking-wide',
                                                    prog.status === 'completed' &&
                                                        'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
                                                    prog.status === 'in_progress' &&
                                                        'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
                                                    prog.status === 'not_started' && 'bg-slate-100 text-slate-600',
                                                )}
                                            >
                                                {statusLabelEs(prog.status)}
                                            </Badge>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}
