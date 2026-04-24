/**
 * admin/certificates/{id}/verifications — Log de consultas públicas de verificación.
 */

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Award, ClipboardList, LayoutList, MonitorCheck } from 'lucide-react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { dashboard } from '@/routes';
import * as certificatesRoute from '@/routes/admin/certificates';
import verificationsRoute from '@/routes/admin/certificates/verifications';
import type {
    AdminCertificateVerificationRow,
    CertificateVerificationLogCertificate,
    CertificateVerificationLogFilters,
    Column,
    PaginatedData,
} from '@/types';

interface Props {
    certificate: CertificateVerificationLogCertificate;
    verifications: PaginatedData<AdminCertificateVerificationRow>;
    filters: CertificateVerificationLogFilters;
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

function truncateAgent(agent: string | null, max = 120): string {
    if (!agent) {
        return '—';
    }

    const t = agent.trim();

    return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default function CertificateVerificationsIndex({ certificate, verifications, filters }: Props) {
    const applyFilter = (patch: Partial<CertificateVerificationLogFilters>) => {
        const next: CertificateVerificationLogFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        router.get(verificationsRoute.index.url({ certificate: certificate.id }), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: CertificateVerificationLogFilters & { page: number } = { ...filters, page };

        if (next.search === '') {
            delete next.search;
        }

        router.get(verificationsRoute.index.url({ certificate: certificate.id }), next, {
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

    const columns: Column<AdminCertificateVerificationRow>[] = [
        {
            key: 'verified_at',
            sortKey: 'verified_at',
            header: 'Consulta',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <span className="text-xs text-slate-600">{formatDate(row.verified_at)}</span>
            ),
            cardCell: (row) => (
                <span className="text-sm font-medium text-slate-800">{formatDate(row.verified_at)}</span>
            ),
        },
        {
            key: 'ip_address',
            sortKey: 'ip_address',
            header: 'IP',
            sortable: true,
            cell: (row) => (
                <span className="font-mono text-xs text-slate-600">{row.ip_address ?? '—'}</span>
            ),
        },
        {
            key: 'user_agent',
            header: 'User agent',
            cell: (row) => (
                <span className="line-clamp-2 max-w-md text-xs text-slate-500" title={row.user_agent ?? undefined}>
                    {truncateAgent(row.user_agent)}
                </span>
            ),
            cardCell: (row) => (
                <p className="text-xs text-slate-500">{truncateAgent(row.user_agent, 200)}</p>
            ),
        },
    ];

    const total = verifications.total;
    const onScreen = verifications.data.length;
    const currentPage = verifications.current_page;
    const lastPage = verifications.last_page;

    const statusLabel = certificate.is_revoked ? 'Revocado' : 'Vigente';

    return (
        <>
            <Head title={`Consultas · ${certificate.verification_code}`} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={certificate.student_name}
                    description={`Certificado ${certificate.verification_code} · ${certificate.course_title}. Cada fila es una apertura de la página pública de verificación (código QR o enlace). Estado: ${statusLabel}.`}
                    icon={<Award />}
                    stats={[
                        {
                            label: 'Consultas (total)',
                            value: total,
                            icon: <ClipboardList className="size-3.5" />,
                            color: 'teal',
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
                    ]}
                    actions={
                        <Link
                            href={certificatesRoute.index.url()}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Volver a emitidos
                        </Link>
                    }
                />

                <DataTable<AdminCertificateVerificationRow>
                    columns={columns}
                    data={verifications.data}
                    emptyText="Todavía no hay consultas registradas para este certificado."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por IP o user agent…"
                        />
                    }
                    footer={
                        <DataPaginator
                            meta={verifications}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>
        </>
    );
}

CertificateVerificationsIndex.layout = (pageProps: Props) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Certificados emitidos', href: certificatesRoute.index.url() },
        {
            title: `Consultas · ${pageProps.certificate.verification_code}`,
            href: verificationsRoute.index.url({ certificate: pageProps.certificate.id }),
        },
    ],
});
