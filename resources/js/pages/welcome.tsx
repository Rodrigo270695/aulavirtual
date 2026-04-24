import { Head, router } from '@inertiajs/react';
import { PublicCourseCatalog } from '@/components/marketplace/public-course-catalog';
import { PublicFooter } from '@/components/marketplace/public-footer';
import { PublicHero } from '@/components/marketplace/public-hero';
import { PublicInstructorStrip } from '@/components/marketplace/public-instructor-strip';
import { PublicNavbar } from '@/components/marketplace/public-navbar';
import { PlatformFaviconHead } from '@/components/platform-favicon-head';
import { usePlatform } from '@/hooks/use-platform';
import { home } from '@/routes';
import type { PublicCatalogFilters, PublicCatalogPageProps } from '@/types/public';

export default function Welcome({
    canRegister = true,
    courses,
    topInstructors,
    filters,
    stats: _stats,
}: PublicCatalogPageProps) {
    const platform = usePlatform();
    const pageTitle = `${platform.app_name} · Explora cursos`;

    const navigateWithFilters = (
        next: PublicCatalogFilters,
        page?: number,
        opts?: { isPageChange?: boolean },
    ) => {
        const query: Record<string, string | number> = {
            sort: next.sort,
        };

        if (next.q) {
            query.q = next.q;
        }

        if (next.category) {
            query.category = next.category;
        }

        if (next.level && next.level !== 'all') {
            query.level = next.level;
        }

        if (next.price && next.price !== 'all') {
            query.price = next.price;
        }

        if (page && page > 1) {
            query.page = page;
        }

        const isPageChange = opts?.isPageChange === true;

        router.get(home.url(), query, {
            preserveScroll: !isPageChange,
            preserveState: true,
            replace: true,
            onFinish: () => {
                if (isPageChange) {
                    document.getElementById('explorar')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }
            },
        });
    };

    const updateFilter = (key: keyof PublicCatalogFilters, value: string) => {
        const nextFilters = {
            ...filters,
            [key]: value,
        };

        navigateWithFilters(nextFilters);
    };

    return (
        <>
            <Head title={pageTitle} />
            <PlatformFaviconHead />

            <div className="flex min-h-screen flex-col bg-[#f4f7fb] text-slate-900 antialiased">
                <PublicNavbar
                    platform={platform}
                    canRegister={canRegister}
                    searchQuery={filters.q}
                    onSearch={(query) => updateFilter('q', query)}
                />
                <PublicHero
                    platform={platform}
                    initialQuery={filters.q}
                    onSearch={(query) => updateFilter('q', query)}
                />
                <PublicCourseCatalog
                    platform={platform}
                    filters={filters}
                    courses={courses}
                    onChangeFilter={updateFilter}
                    onChangePage={(page) => navigateWithFilters(filters, page, { isPageChange: true })}
                />
                <PublicInstructorStrip platform={platform} instructors={topInstructors} />
                <PublicFooter platform={platform} canRegister={canRegister} />
            </div>
        </>
    );
}
