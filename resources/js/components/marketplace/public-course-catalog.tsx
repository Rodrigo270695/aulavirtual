import { Compass, SlidersHorizontal } from 'lucide-react';
import { DataPaginator } from '@/components/admin/data-paginator';
import { FilterSelect } from '@/components/admin/filter-select';
import { PublicCourseCard } from '@/components/marketplace/public-course-card';
import type { PaginatedData } from '@/types';
import type { PlatformSettings } from '@/types/platform';
import type { PublicCatalogFilters, PublicCourse } from '@/types/public';

type PublicCourseCatalogProps = {
    platform: PlatformSettings;
    filters: PublicCatalogFilters;
    courses: PaginatedData<PublicCourse>;
    onChangeFilter: (key: keyof PublicCatalogFilters, value: string) => void;
    onChangePage: (page: number) => void;
};

const LEVEL_OPTIONS = [
    { value: 'all', label: 'Todos los niveles' },
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
    { value: 'all_levels', label: 'General' },
];

const PRICE_OPTIONS = [
    { value: 'all', label: 'Todos los precios' },
    { value: 'free', label: 'Solo gratis' },
    { value: 'paid', label: 'Solo de pago' },
];

const SORT_OPTIONS = [
    { value: 'popular', label: 'Más populares' },
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'newest', label: 'Más recientes' },
    { value: 'price_low', label: 'Precio: menor a mayor' },
    { value: 'price_high', label: 'Precio: mayor a menor' },
];

const LEVEL_FILTER_OPTIONS = LEVEL_OPTIONS.filter((o) => o.value !== 'all');
const PRICE_FILTER_OPTIONS = PRICE_OPTIONS.filter((o) => o.value !== 'all');

export function PublicCourseCatalog({
    platform,
    filters,
    courses,
    onChangeFilter,
    onChangePage,
}: PublicCourseCatalogProps) {
    return (
        <section id="explorar" className="relative py-10 sm:py-14">
            <div
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-linear-to-b from-slate-100/90 to-transparent"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute right-[10%] top-24 -z-10 size-72 rounded-full opacity-30 blur-3xl"
                style={{
                    background: `radial-gradient(circle, ${platform.color_primary}33, transparent 65%)`,
                }}
                aria-hidden
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-2xl ring-1 ring-slate-100/90"
                    style={{
                        boxShadow: `0 28px 56px -18px rgba(15, 23, 42, 0.1), 0 0 0 1px ${platform.color_primary}08, inset 0 1px 0 0 rgba(255,255,255,0.95)`,
                    }}
                >
                    <div
                        className="h-1 w-full"
                        style={{
                            background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent}, ${platform.color_primary})`,
                        }}
                        aria-hidden
                    />

                    <div
                        className="flex flex-col gap-5 border-b border-slate-100/95 bg-linear-to-br from-slate-50/95 via-white to-slate-50/40 px-5 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-3.5">
                            <span
                                className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white/60"
                                style={{
                                    background: `linear-gradient(145deg, ${platform.color_primary}, ${platform.color_accent})`,
                                    boxShadow: `0 14px 32px -12px ${platform.color_primary}77`,
                                }}
                            >
                                <Compass className="size-5" aria-hidden />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Catálogo
                                </p>
                                <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    Explora cursos
                                </h2>
                                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                                    Ajusta nivel, precio y orden para acotar resultados.
                                </p>
                            </div>
                        </div>
                        <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 lg:w-auto lg:max-w-[min(100%,42rem)] lg:shrink-0">
                            <span className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm sm:py-2">
                                <SlidersHorizontal className="size-3.5 text-slate-400" aria-hidden />
                                Filtros
                            </span>
                            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 rounded-2xl bg-slate-100/70 p-2 ring-1 ring-slate-200/60 sm:grid-cols-3 sm:gap-2 lg:min-w-0">
                                <FilterSelect
                                    size="md"
                                    className="min-w-0 w-full"
                                    value={filters.level === 'all' ? '' : filters.level}
                                    onValueChange={(v) => onChangeFilter('level', v === '' ? 'all' : v)}
                                    allOptionLabel="Todos los niveles"
                                    options={LEVEL_FILTER_OPTIONS}
                                    aria-label="Nivel"
                                />
                                <FilterSelect
                                    size="md"
                                    className="min-w-0 w-full"
                                    value={filters.price === 'all' ? '' : filters.price}
                                    onValueChange={(v) => onChangeFilter('price', v === '' ? 'all' : v)}
                                    allOptionLabel="Todos los precios"
                                    options={PRICE_FILTER_OPTIONS}
                                    aria-label="Precio"
                                />
                                <FilterSelect
                                    size="md"
                                    className="min-w-0 w-full"
                                    value={filters.sort}
                                    onValueChange={(v) => onChangeFilter('sort', v)}
                                    options={SORT_OPTIONS}
                                    aria-label="Ordenar resultados"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-linear-to-b from-white to-slate-50/30 p-5 sm:p-8">
                        {courses.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                    {courses.data.map((course) => (
                                        <PublicCourseCard
                                            key={course.id}
                                            platform={platform}
                                            course={course}
                                        />
                                    ))}
                                </div>
                                <DataPaginator
                                    meta={courses}
                                    onPageChange={onChangePage}
                                    omitWhenSinglePage
                                    resourceName="cursos"
                                    activePageBackground={`linear-gradient(145deg, ${platform.color_primary}, ${platform.color_accent})`}
                                    className="mt-8 border-t border-slate-200/80 pt-6"
                                />
                            </>
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-14 text-center">
                                <p className="text-base font-medium text-slate-600">
                                    No hay cursos con los filtros actuales.
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Prueba otra categoría, nivel o tipo de precio.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
