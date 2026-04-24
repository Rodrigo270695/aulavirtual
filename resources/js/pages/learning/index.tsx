import { Link, router } from '@inertiajs/react';
import { BookOpen, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { FilterSelect } from '@/components/admin/filter-select';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import learning from '@/routes/learning';
import { CourseCatalogMetaStrip } from '@/components/marketplace/course-catalog-meta-strip';
import { cn } from '@/lib/utils';
import type {
    LearningFilterOptionCategory,
    LearningFilterOptionInstructor,
    LearningMenuRow,
    LearningPageFilters,
} from '@/types/learning';
import type { PlatformSettings } from '@/types/platform';
import { usePlatform } from '@/hooks/use-platform';

const SORT_OPTIONS: Array<{ value: LearningPageFilters['sort']; label: string }> = [
    { value: 'recent', label: 'Visitados recientemente' },
    { value: 'enrolled_newest', label: 'Matrícula más reciente' },
    { value: 'title_asc', label: 'Título (A-Z)' },
    { value: 'title_desc', label: 'Título (Z-A)' },
    { value: 'progress_desc', label: 'Progreso (mayor)' },
    { value: 'progress_asc', label: 'Progreso (menor)' },
];

const PROGRESS_FILTER_OPTIONS = [
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed', label: 'Completados' },
];

type LearningPageProps = {
    enrollments: LearningMenuRow[];
    filterOptions: {
        categories: LearningFilterOptionCategory[];
        instructors: LearningFilterOptionInstructor[];
    };
    filters: LearningPageFilters;
    totalEnrollmentCount: number;
};

function isCompleted(row: LearningMenuRow): boolean {
    return row.completed_at !== null || row.progress_pct >= 99.5;
}

function CourseCard({
    row,
    platform,
}: {
    row: LearningMenuRow;
    platform: PlatformSettings;
}) {
    const { course } = row;
    const done = isCompleted(row);
    const ctaLabel = done ? 'Ver curso' : row.progress_pct > 0 ? 'Continuar curso' : 'Empezar curso';

    return (
        <article
            className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md',
            )}
        >
            <div className="relative h-36 bg-slate-100">
                {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div
                        className="flex h-full w-full items-end justify-center bg-gradient-to-br from-slate-200 to-slate-100"
                        aria-hidden
                    >
                        <div
                            className="mb-4 size-14 rounded-2xl opacity-50"
                            style={{
                                background: `linear-gradient(135deg, ${platform.color_primary}55, ${platform.color_accent}55)`,
                            }}
                        />
                    </div>
                )}
                {done ? (
                    <span className="absolute left-3 top-3 rounded-md bg-emerald-600/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                        Completado
                    </span>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h2 className="line-clamp-2 min-h-10 text-base font-bold leading-snug text-slate-900">{course.title}</h2>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {course.instructor.name ? `Por ${course.instructor.name}` : null}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                    {row.last_accessed_at
                        ? `Última visita: ${new Date(row.last_accessed_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                          })}`
                        : 'Aún sin abrir en el aula'}
                </p>
                <CourseCatalogMetaStrip
                    className="mt-3"
                    avgRating={course.avg_rating}
                    totalReviews={course.total_reviews}
                    totalEnrolled={course.total_enrolled}
                    totalModules={course.total_modules}
                    durationHours={course.duration_hours}
                    variant="pill"
                    modulesLabel="long"
                />
                <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                        <span>Progreso</span>
                        <span className="tabular-nums">{Math.round(row.progress_pct)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, Math.max(0, row.progress_pct))}%`,
                                background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                            }}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <Button asChild type="button" variant="outline" className="h-10 w-full rounded-xl border-slate-200 text-slate-700">
                        <Link href={`/mi-aprendizaje/${row.enrollment_id}/aula`}>{ctaLabel}</Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}

export default function LearningIndex({
    enrollments,
    filterOptions,
    filters,
    totalEnrollmentCount,
}: LearningPageProps) {
    const platform = usePlatform();
    const searchFieldId = useId();
    const [qDraft, setQDraft] = useState(filters.q);

    useEffect(() => {
        setQDraft(filters.q);
    }, [filters.q]);

    const apply = useCallback(
        (patch: Partial<LearningPageFilters>) => {
            const merged: LearningPageFilters = { ...filters, ...patch };
            const query: Record<string, string> = {};
            const qt = merged.q.trim();
            if (qt !== '') {
                query.q = qt;
            }

            if (merged.category !== '') {
                query.category = merged.category;
            }

            if (merged.progress !== 'all') {
                query.progress = merged.progress;
            }

            if (merged.instructor !== '') {
                query.instructor = merged.instructor;
            }

            if (merged.sort !== 'recent') {
                query.sort = merged.sort;
            }

            router.get(learning.index.url(), query, { preserveScroll: true, replace: true });
        },
        [filters],
    );

    const submitSearch = useCallback(() => {
        apply({ q: qDraft.trim() });
    }, [apply, qDraft]);

    const resetFilters = useCallback(() => {
        router.get(
            learning.index.url(),
            { sort: 'recent' },
            { preserveScroll: true, replace: true },
        );
    }, []);

    const categorySelectOptions = filterOptions.categories.map((c) => ({
        value: c.slug,
        label: c.name,
    }));

    const instructorSelectOptions = filterOptions.instructors.map((i) => ({
        value: i.id,
        label: i.name,
    }));

    const hasNoCoursesEver = totalEnrollmentCount === 0;
    const hasNoFilterResults = !hasNoCoursesEver && enrollments.length === 0;

    return (
        <MarketplaceShell title="Mi aprendizaje">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                            <BookOpen className="size-7 text-violet-600" aria-hidden />
                            Mi aprendizaje
                        </h1>
                        <p className="mt-2 max-w-2xl text-slate-600">
                            Orden por defecto: <strong className="font-semibold text-slate-800">visitados recientemente</strong>{' '}
                            primero; luego puedes filtrar y ordenar como prefieras.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link href={home.url()}>Explorar más cursos</Link>
                    </Button>
                </div>

                {!hasNoCoursesEver ? (
                    <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
                            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    <SlidersHorizontal className="size-3.5" aria-hidden />
                                    Filtros
                                </span>
                                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    <FilterSelect
                                        size="md"
                                        className="min-w-0 w-full"
                                        aria-label="Categoría"
                                        value={filters.category}
                                        onValueChange={(v) => apply({ category: v })}
                                        allOptionLabel="Todas las categorías"
                                        options={categorySelectOptions}
                                    />
                                    <FilterSelect
                                        size="md"
                                        className="min-w-0 w-full"
                                        aria-label="Progreso"
                                        value={filters.progress === 'all' ? '' : filters.progress}
                                        onValueChange={(v) =>
                                            apply({
                                                progress: (v === '' ? 'all' : v) as LearningPageFilters['progress'],
                                            })
                                        }
                                        allOptionLabel="Todos los progresos"
                                        options={PROGRESS_FILTER_OPTIONS}
                                    />
                                    <FilterSelect
                                        size="md"
                                        className="min-w-0 w-full sm:col-span-2 lg:col-span-1"
                                        aria-label="Instructor"
                                        value={filters.instructor}
                                        onValueChange={(v) => apply({ instructor: v })}
                                        allOptionLabel="Todos los instructores"
                                        options={instructorSelectOptions}
                                    />
                                </div>
                            </div>
                            <form
                                className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center xl:max-w-md xl:flex-1"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    submitSearch();
                                }}
                            >
                                <label htmlFor={searchFieldId} className="sr-only">
                                    Buscar mis cursos
                                </label>
                                <input
                                    id={searchFieldId}
                                    type="search"
                                    value={qDraft}
                                    onChange={(e) => setQDraft(e.target.value)}
                                    placeholder="Buscar mis cursos"
                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none ring-offset-2 transition focus:ring-2 focus:ring-violet-300/70"
                                />
                                <Button
                                    type="submit"
                                    className="shrink-0 rounded-xl font-semibold text-white shadow-md"
                                    style={{
                                        background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                                    }}
                                >
                                    <Search className="mr-1.5 size-4" aria-hidden />
                                    Buscar
                                </Button>
                            </form>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold tabular-nums text-slate-900">{enrollments.length}</span>{' '}
                                {enrollments.length === 1 ? 'curso' : 'cursos'}
                                {totalEnrollmentCount !== enrollments.length ? (
                                    <span className="text-slate-400">
                                        {' '}
                                        (de {totalEnrollmentCount} en total)
                                    </span>
                                ) : null}
                            </p>
                            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Ordenar
                                </span>
                                <div className="min-w-0 flex-1 sm:max-w-[20rem] sm:flex-initial">
                                    <FilterSelect
                                        size="md"
                                        className="min-w-0 w-full"
                                        aria-label="Ordenar"
                                        value={filters.sort}
                                        onValueChange={(v) => apply({ sort: v as LearningPageFilters['sort'] })}
                                        options={SORT_OPTIONS}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {hasNoCoursesEver ? (
                    <div className="mt-12 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                        <Sparkles className="mx-auto size-10 text-violet-400" aria-hidden />
                        <p className="mt-4 text-lg font-semibold text-slate-800">Aún no tienes cursos</p>
                        <p className="mt-2 text-sm text-slate-600">
                            Matricúlate desde el catálogo y vuelve aquí; aparecerán ordenados por la última visita al
                            aula.
                        </p>
                        <Button
                            asChild
                            className="mt-6 rounded-xl font-semibold text-white"
                            style={{
                                background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                            }}
                        >
                            <Link href={home.url()}>Ir al catálogo</Link>
                        </Button>
                    </div>
                ) : hasNoFilterResults ? (
                    <div className="mt-10 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-14 text-center">
                        <p className="text-base font-medium text-slate-700">Ningún curso coincide con los filtros.</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Prueba otra categoría, instructor o búsqueda; o restablece los filtros.
                        </p>
                        <Button type="button" variant="outline" className="mt-6 rounded-xl" onClick={resetFilters}>
                            Quitar filtros
                        </Button>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {enrollments.map((row) => (
                            <CourseCard key={row.enrollment_id} row={row} platform={platform} />
                        ))}
                    </div>
                )}
            </main>
        </MarketplaceShell>
    );
}
