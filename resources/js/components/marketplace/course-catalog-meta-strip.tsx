/**
 * Fila de métricas de catálogo: valoración, alumnos, módulos, duración.
 * Un solo componente para welcome, Mi aprendizaje y cualquier tarjeta de `PublicCourse`.
 */

import { Clock, Layers, Users } from 'lucide-react';
import { CourseRatingInline } from '@/components/marketplace/course-rating-inline';
import { formatCourseDurationHours } from '@/lib/format-course-duration';
import { cn } from '@/lib/utils';

const SEP = <span className="text-slate-300" aria-hidden>·</span>;

export type CourseCatalogMetaStripProps = {
    avgRating: number;
    totalReviews?: number;
    showRating?: boolean;
    showReviewsCount?: boolean;
    totalEnrolled: number;
    totalModules: number;
    durationHours: number;
    /**
     * `pill` — caja gris del catálogo (welcome).
     * `plain` — fila simple con separadores (listados compactos).
     */
    variant?: 'pill' | 'plain';
    /** `short` → «2 mód.» · `long` → «2 módulos» */
    modulesLabel?: 'short' | 'long';
    className?: string;
};

export function CourseCatalogMetaStrip({
    avgRating,
    totalReviews = 0,
    showRating = true,
    showReviewsCount = true,
    totalEnrolled,
    totalModules,
    durationHours,
    variant = 'pill',
    modulesLabel = 'short',
    className,
}: CourseCatalogMetaStripProps) {
    const modulesText = modulesLabel === 'long' ? `${totalModules} módulos` : `${totalModules} mód.`;

    const inner = (
        <>
            {showRating ? (
                <>
                    <CourseRatingInline
                        avgRating={avgRating}
                        totalReviews={totalReviews}
                        showReviewsCount={showReviewsCount}
                    />
                    {SEP}
                </>
            ) : null}
            <span className="inline-flex items-center gap-1 font-medium">
                <Users className="size-3.5 text-slate-400" aria-hidden />
                {totalEnrolled.toLocaleString('es-ES')}
            </span>
            {SEP}
            <span className="inline-flex items-center gap-1">
                <Layers className="size-3.5 text-slate-400" aria-hidden />
                {modulesText}
            </span>
            {SEP}
            <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="size-3.5 text-slate-400" aria-hidden />
                {formatCourseDurationHours(durationHours)}
            </span>
        </>
    );

    if (variant === 'plain') {
        return (
            <div
                className={cn(
                    'flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:gap-2 sm:text-xs',
                    className,
                )}
            >
                {inner}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2 rounded-xl bg-slate-50/90 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100/90',
                className,
            )}
        >
            {inner}
        </div>
    );
}
