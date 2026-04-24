import { Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { CourseCatalogMetaStrip } from '@/components/marketplace/course-catalog-meta-strip';
import { cn } from '@/lib/utils';
import cart from '@/routes/cart';
import learning from '@/routes/learning';
import { Button } from '@/components/ui/button';
import type { PlatformSettings } from '@/types/platform';
import type { PublicCourse } from '@/types/public';

type PublicCourseCardProps = {
    platform: PlatformSettings;
    course: PublicCourse;
    /** Tarjeta más destacada visualmente (sección recomendados) */
    featured?: boolean;
};

export function PublicCourseCard({ platform, course, featured = false }: PublicCourseCardProps) {
    const { cartCourseIds = [], enrolledCourseIds = [] } = usePage<{
        cartCourseIds?: string[];
        enrolledCourseIds?: string[];
    }>().props;

    const hasDiscount = course.discount_price !== null && !course.is_free;
    const isEnrolled = enrolledCourseIds.includes(course.id);
    const inCart = cartCourseIds.includes(course.id);

    const addToCart = () => {
        router.post(
            cart.add.url({ course: course.id }),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <article
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300',
                featured
                    ? 'border-slate-200/70 shadow-lg shadow-slate-300/35 ring-1 ring-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/40'
                    : 'border-slate-200/90 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
            )}
        >
            {featured ? (
                <div
                    className="h-1 w-full shrink-0"
                    style={{
                        background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                    }}
                    aria-hidden
                />
            ) : null}
            <div className="relative h-44 overflow-hidden bg-slate-100 sm:h-40">
                {course.cover_image_url ? (
                    <img
                        src={course.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-end justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200"
                        aria-hidden
                    >
                        <div
                            className="mb-6 size-16 rounded-2xl opacity-40"
                            style={{
                                background: `linear-gradient(135deg, ${platform.color_primary}55, ${platform.color_accent}55)`,
                            }}
                        />
                    </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/55 via-transparent to-transparent opacity-80" />
                <div className="absolute left-3 top-3 z-[1] flex flex-wrap gap-2">
                    <span className="rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm">
                        {course.category.name ?? 'Curso'}
                    </span>
                    {featured ? (
                        <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/30"
                            style={{
                                background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                            }}
                        >
                            Destacado
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {course.level_label}
                </p>
                <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-slate-900">
                    {course.title}
                </h3>
                <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                    Por <span className="font-medium text-slate-600">{course.instructor.name || 'Instructor'}</span>
                </p>

                <CourseCatalogMetaStrip
                    className="mt-4"
                    avgRating={course.avg_rating}
                    totalReviews={course.total_reviews}
                    totalEnrolled={course.total_enrolled}
                    totalModules={course.total_modules}
                    durationHours={course.duration_hours}
                    variant="pill"
                    modulesLabel="short"
                />

                <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
                    <div>
                        {course.is_free ? (
                            <span className="text-lg font-extrabold text-emerald-600">Gratis</span>
                        ) : (
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-xl font-extrabold tabular-nums text-slate-900">
                                    {formatCurrency(course.effective_price, course.currency)}
                                </span>
                                {hasDiscount ? (
                                    <span className="text-sm text-slate-400 line-through">
                                        {formatCurrency(course.price, course.currency)}
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {isEnrolled ? (
                        <Button
                            asChild
                            variant="outline"
                            className="h-10 w-full rounded-xl border-2 bg-white font-semibold shadow-sm transition-colors hover:bg-slate-50/90"
                            style={{
                                borderColor: `color-mix(in srgb, ${platform.color_primary} 42%, #e2e8f0)`,
                                color: platform.color_primary,
                            }}
                        >
                            <Link href={learning.index.url()}>Ir a mi aprendizaje</Link>
                        </Button>
                    ) : inCart ? (
                        <Button
                            asChild
                            variant="outline"
                            className="h-10 w-full rounded-xl border-slate-200 font-semibold text-slate-800"
                        >
                            <Link href={cart.index.url()}>Ver carrito</Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={addToCart}
                            className="h-10 w-full rounded-xl font-semibold text-white shadow-md transition-[filter,transform] hover:brightness-[1.03] active:scale-[0.99]"
                            style={{
                                background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                                boxShadow: `0 6px 20px -6px color-mix(in srgb, ${platform.color_primary} 45%, transparent)`,
                            }}
                        >
                            <ShoppingCart className="mr-2 size-4" aria-hidden />
                            Añadir al carrito
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}

function formatCurrency(value: number, currency: string): string {
    try {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}
