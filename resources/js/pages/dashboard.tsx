import { Head } from '@inertiajs/react';
import { DashboardBreakdownsSection } from '@/components/dashboard/breakdowns-section';
import { DashboardCourseStatusChartCard } from '@/components/dashboard/course-status-chart-card';
import { DashboardHighlightsGrid } from '@/components/dashboard/highlights-grid';
import { DashboardRecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { DashboardStatsGrid } from '@/components/dashboard/stats-grid';
import { DashboardTopCoursesCard } from '@/components/dashboard/top-courses-card';
import { DashboardTrendChartCard } from '@/components/dashboard/trend-chart-card';
import type {
    DashboardBreakdownItem,
    CourseStatusPoint,
    DashboardHighlight,
    DashboardStat,
    RecentActivity,
    TopCourse,
    TrendPoint,
} from '@/components/dashboard/types';
import { dashboard } from '@/routes';

interface Props {
    stats: DashboardStat[];
    highlights: DashboardHighlight[];
    breakdowns: {
        enrollment_status: DashboardBreakdownItem[];
        payment_status_month: DashboardBreakdownItem[];
        course_levels: DashboardBreakdownItem[];
    };
    charts: {
        trend: TrendPoint[];
        course_status: CourseStatusPoint[];
    };
    top_courses: TopCourse[];
    recent_activity: RecentActivity[];
}

export default function Dashboard({ stats, highlights, breakdowns, charts, top_courses, recent_activity }: Props) {
    const currency = top_courses[0]?.currency ?? 'USD';

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                <DashboardStatsGrid stats={stats} currency={currency} />
                <DashboardHighlightsGrid items={highlights} />

                <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
                    <DashboardTrendChartCard trend={charts.trend} currency={currency} />
                    <DashboardCourseStatusChartCard items={charts.course_status} />
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <DashboardRecentActivityCard items={recent_activity} />
                    <DashboardTopCoursesCard items={top_courses} />
                </section>

                <DashboardBreakdownsSection
                    enrollmentStatus={breakdowns.enrollment_status}
                    paymentStatusMonth={breakdowns.payment_status_month}
                    courseLevels={breakdowns.course_levels}
                    currency={currency}
                />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
