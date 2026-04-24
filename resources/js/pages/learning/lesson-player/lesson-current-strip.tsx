import { BookOpen } from 'lucide-react';
import type { LessonItem } from './types';

type Props = {
    lesson: LessonItem | null;
};

export function LessonCurrentStrip({ lesson }: Props) {
    if (!lesson) {
        return null;
    }

    return (
        <div className="mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/70 bg-white/85 px-3 py-2.5 shadow-sm lg:hidden">
            <BookOpen className="size-4 shrink-0 text-slate-400" aria-hidden />
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lección actual</p>
                <p className="truncate text-sm font-semibold text-slate-800">{lesson.title}</p>
            </div>
        </div>
    );
}
