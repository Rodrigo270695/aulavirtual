/**
 * admin/courses/enrollments — Matrículas de un curso (solo lectura).
 */

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, ClipboardList, Users } from 'lucide-react';
import { useState } from 'react';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { dashboard } from '@/routes';
import coursesRoute from '@/routes/admin/courses';
import { EnrollmentLessonsTrackingModal } from '@/pages/admin/courses/enrollments/enrollment-lessons-tracking-modal';
import type {
    AdminCourseEnrollmentRow,
    Column,
    CourseEnrollmentsCourseSummary,
    CourseEnrollmentsFilters,
    PaginatedData,
} from '@/types';

const ACCESS_LABEL: Record<string, string> = {
    paid: 'De pago',
    free: 'Gratis',
    grant: 'Cortesía',
    trial: 'Prueba',
};

const STATUS_LABEL: Record<string, string> = {
    active: 'Activa',
    expired: 'Expirada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    suspended: 'Suspendida',
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700';
        case 'completed':
            return 'bg-sky-50 text-sky-800';
        case 'expired':
        case 'cancelled':
            return 'bg-slate-100 text-slate-600';
        case 'suspended':
            return 'bg-amber-50 text-amber-800';
        default:
            return 'bg-slate-50 text-slate-600';
    }
}

function formatPct(v: string | number): string {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    if (Number.isNaN(n)) {
        return '—';
    }
    return `${n.toFixed(1)}%`;
}

function pctNumber(v: string | number): number {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    if (Number.isNaN(n)) {
        return 0;
    }
    return Math.min(100, Math.max(0, n));
}

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    return new Date(iso).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface Props {
    course: CourseEnrollmentsCourseSummary;
    enrollments: PaginatedData<AdminCourseEnrollmentRow>;
    filters: CourseEnrollmentsFilters;
}

export default function CourseEnrollmentsIndex({ course, enrollments, filters }: Props) {
    const catLabel = course.category
        ? `${course.category.name} · /${course.category.slug}`
        : '—';

    const [trackingOpen, setTrackingOpen] = useState(false);
    const [trackingUrl, setTrackingUrl] = useState('');
    const [trackingStudentTitle, setTrackingStudentTitle] = useState('');

    const openTracking = (row: AdminCourseEnrollmentRow) => {
        setTrackingUrl(coursesRoute.enrollments.tracking.url({ course: course.id, enrollment: row.id }));
        setTrackingStudentTitle(
            `${row.user.first_name} ${row.user.last_name} — ${row.user.email}`,
        );
        setTrackingOpen(true);
    };

    const goToPage = (page: number) => {
        router.get(
            coursesRoute.enrollments.index.url({ course: course.id }),
            { ...filters, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const onPerPage = (perPage: number) => {
        router.get(
            coursesRoute.enrollments.index.url({ course: course.id }),
            { ...filters, per_page: perPage, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns: Column<AdminCourseEnrollmentRow>[] = [
        {
            key: 'user',
            header: 'Alumno',
            cardPrimary: true,
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-medium text-slate-800">
                        {row.user.first_name} {row.user.last_name}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">{row.user.email}</div>
                </div>
            ),
            cardCell: (row) => (
                <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">
                        {row.user.first_name} {row.user.last_name}
                    </div>
                    <div className="truncate text-xs text-slate-500">{row.user.email}</div>
                </div>
            ),
        },
        {
            key: 'access_type',
            header: 'Acceso',
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {ACCESS_LABEL[row.access_type] ?? row.access_type}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
                >
                    {STATUS_LABEL[row.status] ?? row.status}
                </span>
            ),
        },
        {
            key: 'progress_pct',
            header: 'Seguimiento',
            className: 'text-right',
            headerClassName: 'text-right',
            cell: (row) => {
                const s = row.tracking_summary;
                const w = pctNumber(row.progress_pct);
                return (
                    <div className="ml-auto min-w-40 max-w-[220px] space-y-1">
                        <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-blue-600 to-sky-500 transition-[width]"
                                    style={{ width: `${w}%` }}
                                />
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-slate-800">
                                {formatPct(row.progress_pct)}
                            </span>
                        </div>
                        <div className="text-[11px] leading-tight text-slate-500">
                            {s.lessons_completed}/{s.lessons_total} lecciones
                            {s.homework_lessons_total > 0 && (
                                <>
                                    <br />
                                    <span className="text-slate-400">
                                        Tareas: {s.homework_submitted_lessons}/{s.homework_lessons_total}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                );
            },
            cardCell: (row) => {
                const s = row.tracking_summary;
                const w = pctNumber(row.progress_pct);
                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-blue-600 to-sky-500"
                                    style={{ width: `${w}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
                                {formatPct(row.progress_pct)}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {s.lessons_completed}/{s.lessons_total} lecciones
                            {s.homework_lessons_total > 0
                                ? ` · Tareas ${s.homework_submitted_lessons}/${s.homework_lessons_total}`
                                : ''}
                        </p>
                    </div>
                );
            },
        },
        {
            key: 'tracking_detail',
            header: 'Detalle',
            headerClassName: 'text-right',
            className: 'text-right',
            cardFooter: true,
            cell: (row) => (
                <button
                    type="button"
                    onClick={() => openTracking(row)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/90 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-900"
                >
                    <ClipboardList className="size-3.5 text-blue-500" />
                    Lecciones / tareas
                </button>
            ),
            cardCell: (row) => (
                <button
                    type="button"
                    onClick={() => openTracking(row)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50"
                >
                    <ClipboardList className="size-4 text-blue-500" />
                    Ver lecciones y tareas
                </button>
            ),
        },
        {
            key: 'enrolled_at',
            header: 'Matriculado',
            cell: (row) => (
                <span className="text-xs text-slate-500">{formatDate(row.enrolled_at)}</span>
            ),
        },
        {
            key: 'last_accessed_at',
            header: 'Último acceso',
            cell: (row) => (
                <span className="text-xs text-slate-500">{formatDate(row.last_accessed_at)}</span>
            ),
        },
        {
            key: 'expires_at',
            header: 'Vence',
            cell: (row) => (
                <span className="text-xs text-slate-500">{formatDate(row.expires_at)}</span>
            ),
        },
    ];

    const total = enrollments.total;

    return (
        <>
            <Head title={`Matrículas · ${course.title}`} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={course.title}
                    description={`Alumnos inscritos en este curso. Catálogo: ${catLabel}. Slug público: /${course.slug}. Las altas suelen originarse en compra o registro del estudiante.`}
                    icon={<BookOpen />}
                    stats={[
                        {
                            label: 'Matrículas',
                            value: total,
                            icon: <Users className="size-3.5" />,
                            color: 'teal',
                        },
                    ]}
                    actions={
                        <Link
                            href={coursesRoute.index.url()}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Volver a cursos
                        </Link>
                    }
                />

                <DataTable<AdminCourseEnrollmentRow>
                    columns={columns}
                    data={enrollments.data}
                    emptyText="Nadie está matriculado en este curso todavía."
                    footer={
                        <DataPaginator
                            meta={enrollments}
                            onPageChange={goToPage}
                            onPerPageChange={onPerPage}
                        />
                    }
                />

                <EnrollmentLessonsTrackingModal
                    open={trackingOpen}
                    onClose={() => setTrackingOpen(false)}
                    trackingUrl={trackingUrl}
                    studentTitle={trackingStudentTitle}
                />
            </div>
        </>
    );
}

CourseEnrollmentsIndex.layout = (pageProps: Props) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cursos', href: coursesRoute.index.url() },
        {
            title: `Matrículas · ${pageProps.course.title}`,
            href: coursesRoute.enrollments.index.url({ course: pageProps.course.id }),
        },
    ],
});
