/**
 * Valoración media de curso (solo lectura) — reutilizar en tarjetas, listas y strips.
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function formatCourseAvgRating(avg: number): string {
    if (!Number.isFinite(avg) || avg < 0) {
        return '0.0';
    }
    return avg.toFixed(1);
}

type CourseRatingInlineProps = {
    avgRating: number;
    /** Si se muestra y es > 0, se añade un contador accesible de reseñas. */
    totalReviews?: number;
    showReviewsCount?: boolean;
    /** `inverse`: texto claro sobre fondo oscuro (ej. strip de instructores). */
    tone?: 'default' | 'inverse';
    className?: string;
};

export function CourseRatingInline({
    avgRating,
    totalReviews = 0,
    showReviewsCount = true,
    tone = 'default',
    className,
}: CourseRatingInlineProps) {
    const label = formatCourseAvgRating(avgRating);
    const hasReviews = totalReviews > 0;
    const ariaLabel = hasReviews
        ? `Valoración media ${label} de 5, ${totalReviews} reseña${totalReviews === 1 ? '' : 's'}`
        : `Valoración media ${label} de 5, sin reseñas aún`;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 font-semibold tabular-nums',
                tone === 'default' && 'text-slate-800',
                tone === 'inverse' && 'text-white',
                className,
            )}
            aria-label={ariaLabel}
        >
            <Star
                className={cn(
                    'size-3.5 shrink-0 fill-amber-400 text-amber-400',
                    tone === 'inverse' && 'fill-amber-300 text-amber-300',
                )}
                aria-hidden
            />
            <span aria-hidden>{label}</span>
            {showReviewsCount && hasReviews ? (
                <span
                    className={cn(
                        'ml-0.5 text-[11px] font-medium tabular-nums',
                        tone === 'default' && 'text-slate-500',
                        tone === 'inverse' && 'text-slate-400',
                    )}
                    title={`${totalReviews} reseña${totalReviews === 1 ? '' : 's'}`}
                    aria-hidden
                >
                    ({totalReviews})
                </span>
            ) : null}
        </span>
    );
}
