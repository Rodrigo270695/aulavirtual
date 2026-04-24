import { Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import learning from '@/routes/learning';
import { cn } from '@/lib/utils';
import type { LearningEnrollment } from './types';

type Props = {
    enrollment: LearningEnrollment;
    className?: string;
};

export function LearningBreadcrumbNav({ enrollment, className }: Props) {
    return (
        <nav className={cn('min-w-0', className)} aria-label="Ruta de navegación">
            <div className="flex h-full min-h-13 min-w-0 flex-wrap items-center gap-1 px-2 py-1.5 sm:gap-0.5 sm:px-3 sm:py-2 lg:h-auto lg:min-h-0">
                <Link
                    href={learning.index.url()}
                    className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/45 focus-visible:ring-offset-1 sm:px-3 sm:py-2"
                >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">
                        <ArrowLeft className="size-4" aria-hidden />
                    </span>
                    Mi aprendizaje
                </Link>
                <ChevronRight className="mx-0.5 size-3.5 shrink-0 text-slate-300 sm:size-4" aria-hidden />
                <span className="sr-only">Curso actual:</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 sm:flex-initial">
                    {enrollment.course.title}
                </span>
            </div>
        </nav>
    );
}
