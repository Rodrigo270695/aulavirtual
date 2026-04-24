/**
 * admin/refunds/index — Listado de reembolsos (panel admin, solo lectura).
 */

import { Head, router } from '@inertiajs/react';
import {
    CircleCheck,
    LayoutList,
    MonitorCheck,
    RefreshCcw,
    ShieldAlert,
    UserRound,
} from 'lucide-react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { dashboard } from '@/routes';
import * as refundsRoute from '@/routes/admin/refunds';
import type { AdminRefundRow, Column, PaginatedData, RefundFilters } from '@/types';

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    processed: 'Procesado',
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'processed':
            return 'bg-emerald-50 text-emerald-700';
        case 'pending':
            return 'bg-amber-50 text-amber-800';
        case 'approved':
            return 'bg-sky-50 text-sky-700';
        case 'rejected':
            return 'bg-rose-50 text-rose-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

function money(v: string | number): string {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

interface Props {
    refunds: PaginatedData<AdminRefundRow>;
    filters: RefundFilters;
}

export default function RefundsIndex({ refunds, filters }: Props) {
    const applyFilter = (patch: Partial<RefundFilters>) => {
        const next: RefundFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }
        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }
        if (next.gateway === '' || next.gateway === undefined) {
            delete next.gateway;
        }
        if (next.date_from === '' || next.date_from === undefined) {
            delete next.date_from;
        }
        if (next.date_to === '' || next.date_to === undefined) {
            delete next.date_to;
        }

        router.get(refundsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: RefundFilters & { page: number } = { ...filters, page };
        if (next.search === '') {
            delete next.search;
        }
        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }
        if (next.gateway === '' || next.gateway === undefined) {
            delete next.gateway;
        }
        if (next.date_from === '' || next.date_from === undefined) {
            delete next.date_from;
        }
        if (next.date_to === '' || next.date_to === undefined) {
            delete next.date_to;
        }

        router.get(refundsRoute.index.url(), next, {
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

    const columns: Column<AdminRefundRow>[] = [
        {
            key: 'order',
            header: 'Orden',
            sortable: false,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <RefreshCcw className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">{row.order?.order_number ?? '—'}</div>
                        <div className="truncate text-[11px] text-slate-400" title={row.reason}>
                            {row.reason.length > 72 ? `${row.reason.slice(0, 72)}…` : row.reason}
                        </div>
                    </div>
                </div>
            ),
            cardCell: (row) => (
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <RefreshCcw className="size-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{row.order?.order_number ?? '—'}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'user',
            header: 'Cliente',
            sortable: false,
            cell: (row) => (
                row.user ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                        >
                            <UserRound className="size-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800">{row.user.first_name} {row.user.last_name}</div>
                            <div className="truncate text-[11px] text-slate-400">{row.user.email}</div>
                        </div>
                    </div>
                ) : <span className="text-sm text-slate-400">—</span>
            ),
        },
        {
            key: 'courses',
            header: 'Curso(s)',
            sortable: false,
            cell: (row) => {
                const titles = row.order?.item_titles ?? [];
                const count = row.order?.items_count ?? 0;

                if (titles.length === 0) {
                    return <span className="text-sm text-slate-400">—</span>;
                }

                return (
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-700" title={titles.join(' · ')}>
                            {titles[0]}
                        </div>
                        {(count > 1 || titles.length > 1) && (
                            <div className="text-[11px] text-slate-400">
                                +{Math.max(count, titles.length) - 1} curso(s)
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'gateway',
            sortKey: 'gateway',
            header: 'Gateway',
            sortable: true,
            cell: (row) => <span className="text-sm text-slate-700">{row.payment?.gateway ?? '—'}</span>,
        },
        {
            key: 'status',
            sortKey: 'status',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}>
                    {STATUS_LABEL[row.status] ?? row.status}
                </span>
            ),
        },
        {
            key: 'amount',
            sortKey: 'amount',
            header: 'Monto',
            sortable: true,
            cell: (row) => (
                <span className="text-sm font-semibold tabular-nums text-slate-800">
                    {row.payment?.currency ?? 'USD'} {money(row.amount)}
                </span>
            ),
        },
        {
            key: 'gateway_refund_id',
            header: 'Reembolso (ID)',
            sortable: false,
            cell: (row) => (
                <span className="block max-w-[180px] truncate text-xs text-slate-500" title={row.gateway_refund_id ?? '—'}>
                    {row.gateway_refund_id ?? '—'}
                </span>
            ),
        },
        {
            key: 'processed_at',
            sortKey: 'processed_at',
            header: 'Procesado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {row.processed_at
                        ? new Date(row.processed_at).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : '—'}
                </span>
            ),
        },
    ];

    const total = refunds.total;
    const onScreen = refunds.data.length;
    const currentPage = refunds.current_page;
    const lastPage = refunds.last_page;
    const rejectedOnScreen = refunds.data.filter((r) => r.status === 'rejected').length;

    return (
        <>
            <Head title="Reembolsos" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Reembolsos"
                    description="Vista de solo lectura de solicitudes y estados. Ideal para soporte y trazabilidad con pasarela."
                    icon={<RefreshCcw />}
                    stats={[
                        { label: 'Reembolsos', value: total, icon: <RefreshCcw className="size-3.5" />, color: 'blue' },
                        { label: 'Procesados (pant.)', value: refunds.data.filter((r) => r.status === 'processed').length, icon: <CircleCheck className="size-3.5" />, color: 'green' },
                        { label: 'Rechazados (pant.)', value: rejectedOnScreen, icon: <ShieldAlert className="size-3.5" />, color: rejectedOnScreen > 0 ? 'orange' : 'slate' },
                        { label: 'Página', value: `${currentPage}/${lastPage}`, icon: <LayoutList className="size-3.5" />, color: 'orange' },
                        { label: 'En pantalla', value: onScreen, icon: <MonitorCheck className="size-3.5" />, color: 'purple' },
                    ]}
                />

                <DataTable<AdminRefundRow>
                    columns={columns}
                    data={refunds.data}
                    emptyText="No se encontraron reembolsos."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={(
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por orden, email, motivo, gateway o IDs de pasarela…"
                        >
                            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                                <div className="min-w-0 xl:col-span-3">
                                    <FilterSelect
                                        id="refunds-filter-status"
                                        aria-label="Filtrar por estado"
                                        value={filters.status != null && String(filters.status) !== '' ? String(filters.status) : ''}
                                        onValueChange={(v) => applyFilter({ status: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: 'pending', label: STATUS_LABEL.pending },
                                            { value: 'approved', label: STATUS_LABEL.approved },
                                            { value: 'rejected', label: STATUS_LABEL.rejected },
                                            { value: 'processed', label: STATUS_LABEL.processed },
                                        ]}
                                        icon={<RefreshCcw />}
                                    />
                                </div>
                                <div className="min-w-0 xl:col-span-3">
                                    <FilterSelect
                                        id="refunds-filter-gateway"
                                        aria-label="Filtrar por gateway"
                                        value={filters.gateway != null && String(filters.gateway) !== '' ? String(filters.gateway) : ''}
                                        onValueChange={(v) => applyFilter({ gateway: v })}
                                        allOptionLabel="Todos los gateways"
                                        contentLabel="Gateway"
                                        options={[
                                            { value: 'paypal', label: 'PayPal' },
                                            { value: 'free', label: 'Free' },
                                            { value: 'simulated', label: 'Simulated' },
                                        ]}
                                        icon={<RefreshCcw />}
                                    />
                                </div>
                                <DateRangeFilter
                                    className="min-w-0 xl:col-span-6"
                                    from={filters.date_from}
                                    to={filters.date_to}
                                    onFromChange={(v) => applyFilter({ date_from: v })}
                                    onToChange={(v) => applyFilter({ date_to: v })}
                                    onClear={() => applyFilter({ date_from: '', date_to: '' })}
                                    fromId="refunds-filter-date-from"
                                    toId="refunds-filter-date-to"
                                />
                            </div>
                        </DataFilters>
                    )}
                    footer={(
                        <DataPaginator
                            meta={refunds}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    )}
                />
            </div>
        </>
    );
}

RefundsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Reembolsos', href: refundsRoute.index.url() },
    ],
};
