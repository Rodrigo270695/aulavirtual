import { Head, Link, router } from '@inertiajs/react';
import { Award, ClipboardList, ExternalLink, LayoutList, MonitorCheck, Plus, ShieldCheck, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { CertificateEmitModal } from '@/pages/admin/certificates/certificate-emit-modal';
import { dashboard } from '@/routes';
import * as certificatesRoute from '@/routes/admin/certificates';
import * as certificateVerificationsRoute from '@/routes/admin/certificates/verifications';
import type {
    AdminCertificate,
    CertificateEmitidosCan,
    CertificateFilters,
    CertificateTemplateOption,
    Column,
    EnrollmentCertificateOption,
    PaginatedData,
} from '@/types';

interface Props {
    certificates: PaginatedData<AdminCertificate>;
    enrollmentOptions: EnrollmentCertificateOption[];
    templateOptions: CertificateTemplateOption[];
    filters: CertificateFilters;
    can: CertificateEmitidosCan;
}

export default function CertificatesIndex({
    certificates,
    enrollmentOptions,
    templateOptions,
    filters,
    can,
}: Props) {
    const [emitOpen, setEmitOpen] = useState(false);

    const applyFilter = (patch: Partial<CertificateFilters>) => {
        const next: CertificateFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        if (next.is_revoked === '' || next.is_revoked === undefined) {
            delete next.is_revoked;
        }

        router.get(certificatesRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: CertificateFilters & { page: number } = { ...filters, page };

        if (next.search === '') {
            delete next.search;
        }

        if (next.is_revoked === '' || next.is_revoked === undefined) {
            delete next.is_revoked;
        }

        router.get(certificatesRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (key: string) => {
        const sameCol = filters.sort_by === key;
        applyFilter({
            sort_by: key,
            sort_dir: sameCol && filters.sort_dir === 'asc' ? 'desc' : 'asc',
        });
    };

    const columns: Column<AdminCertificate>[] = [
        {
            key: 'student_name',
            sortKey: 'student_name',
            header: 'Estudiante',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">{row.student_name}</div>
                    <div className="truncate text-[11px] text-slate-400">{row.course_title}</div>
                </div>
            ),
            cardCell: (row) => (
                <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">{row.student_name}</div>
                    <div className="truncate text-xs text-slate-500">{row.course_title}</div>
                </div>
            ),
        },
        {
            key: 'verification_code',
            header: 'Código',
            sortable: false,
            cell: (row) => <span className="font-mono text-xs text-slate-600">{row.verification_code}</span>,
        },
        {
            key: 'is_revoked',
            sortKey: 'is_revoked',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) =>
                row.is_revoked ? (
                    <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        Revocado
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Vigente
                    </span>
                ),
        },
        {
            key: 'issued_at',
            sortKey: 'issued_at',
            header: 'Emitido',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-500">
                    {new Date(row.issued_at).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Verificación',
            className: 'text-right',
            headerClassName: 'text-right',
            cardFooter: true,
            cell: (row) => (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {can.verifications ? (
                        <Link
                            href={certificateVerificationsRoute.index.url({ certificate: row.id })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/90 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-900"
                        >
                            <ClipboardList className="size-3.5 text-blue-500" />
                            Consultas
                        </Link>
                    ) : null}
                    <a
                        href={row.verification_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                    >
                        Pública
                        <ExternalLink className="size-3.5" />
                    </a>
                </div>
            ),
            cardCell: (row) => (
                <div className="flex flex-col gap-2">
                    {can.verifications ? (
                        <Link
                            href={certificateVerificationsRoute.index.url({ certificate: row.id })}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50"
                        >
                            <ClipboardList className="size-4 text-blue-500" />
                            Ver consultas registradas
                        </Link>
                    ) : null}
                    <a
                        href={row.verification_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                    >
                        Abrir verificación pública
                        <ExternalLink className="size-3.5" />
                    </a>
                </div>
            ),
        },
    ];

    const total = certificates.total;
    const onScreen = certificates.data.length;
    const currentPage = certificates.current_page;
    const lastPage = certificates.last_page;
    const revokedCount = certificates.data.filter((r) => r.is_revoked).length;
    const activeCount = certificates.data.filter((r) => !r.is_revoked).length;

    return (
        <>
            <Head title="Certificados emitidos" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Certificados emitidos"
                    description="Emite certificados desde matrículas completadas. Cada certificado incluye código único y URL pública para validación en línea."
                    icon={<Award />}
                    stats={[
                        {
                            label: 'Total',
                            value: total,
                            icon: <Award className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Vigentes (pant.)',
                            value: activeCount,
                            icon: <ShieldCheck className="size-3.5" />,
                            color: 'green',
                        },
                        {
                            label: 'Página',
                            value: `${currentPage}/${lastPage}`,
                            icon: <LayoutList className="size-3.5" />,
                            color: 'orange',
                        },
                        {
                            label: 'En pantalla',
                            value: onScreen,
                            icon: <MonitorCheck className="size-3.5" />,
                            color: 'purple',
                        },
                        {
                            label: 'Revocados (pant.)',
                            value: revokedCount,
                            icon: <ToggleLeft className="size-3.5" />,
                            color: revokedCount > 0 ? 'orange' : 'slate',
                        },
                    ]}
                    actions={
                        can.emit ? (
                            <button
                                type="button"
                                onClick={() => setEmitOpen(true)}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                            >
                                <Plus className="size-4" />
                                Emitir certificado
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminCertificate>
                    columns={columns}
                    data={certificates.data}
                    emptyText="No hay certificados emitidos."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por alumno, curso o código..."
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                    <FilterSelect
                                        id="certificates-filter-revoked"
                                        aria-label="Filtrar por estado"
                                        value={
                                            filters.is_revoked === '1' || filters.is_revoked === '0'
                                                ? filters.is_revoked
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ is_revoked: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: '0', label: 'Vigente' },
                                            { value: '1', label: 'Revocado' },
                                        ]}
                                        icon={<ToggleLeft />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={certificates}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <CertificateEmitModal
                open={emitOpen}
                onClose={() => setEmitOpen(false)}
                enrollmentOptions={enrollmentOptions}
                templateOptions={templateOptions}
            />
        </>
    );
}

CertificatesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Certificados emitidos', href: certificatesRoute.index.url() },
    ],
};

