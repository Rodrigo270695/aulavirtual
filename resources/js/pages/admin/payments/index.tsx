/**
 * admin/payments/index — Listado de pagos (panel admin).
 */

import { Head, router } from '@inertiajs/react';
import { CircleCheck, CreditCard, LayoutList, MonitorCheck, ShieldAlert, UserRound } from 'lucide-react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { dashboard } from '@/routes';
import * as paymentsRoute from '@/routes/admin/payments';
import type { AdminPaymentRow, Column, PaginatedData, PaymentFilters } from '@/types';

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'completed':
            return 'bg-emerald-50 text-emerald-700';
        case 'pending':
            return 'bg-amber-50 text-amber-800';
        case 'failed':
            return 'bg-rose-50 text-rose-700';
        case 'cancelled':
            return 'bg-slate-100 text-slate-600';
        case 'refunded':
            return 'bg-violet-50 text-violet-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

function money(v: string | number): string {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

interface Props {
    payments: PaginatedData<AdminPaymentRow>;
    filters: PaymentFilters;
}

export default function PaymentsIndex({ payments, filters }: Props) {
    const applyFilter = (patch: Partial<PaymentFilters>) => {
        const next: PaymentFilters & { page: number } = { ...filters, ...patch, page: 1 };

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

        router.get(paymentsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: PaymentFilters & { page: number } = { ...filters, page };
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

        router.get(paymentsRoute.index.url(), next, {
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

    const columns: Column<AdminPaymentRow>[] = [
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
                        <CreditCard className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">{row.order?.order_number ?? '—'}</div>
                        <div className="truncate text-[11px] text-slate-400">{row.gateway_order_id ?? 'Sin gateway_order_id'}</div>
                    </div>
                </div>
            ),
            cardCell: (row) => (
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <CreditCard className="size-4 text-blue-500" />
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
            cell: (row) => <span className="text-sm text-slate-700">{row.gateway}</span>,
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
                    {row.currency} {money(row.amount)}
                </span>
            ),
        },
        {
            key: 'gateway_transaction_id',
            header: 'Txn',
            sortable: false,
            cell: (row) => (
                <span className="block max-w-[180px] truncate text-xs text-slate-500" title={row.gateway_transaction_id ?? '—'}>
                    {row.gateway_transaction_id ?? '—'}
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

    const total = payments.total;
    const onScreen = payments.data.length;
    const currentPage = payments.current_page;
    const lastPage = payments.last_page;
    const failedOnScreen = payments.data.filter((p) => p.status === 'failed').length;

    return (
        <>
            <Head title="Pagos" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Pagos de órdenes"
                    description="Vista de solo lectura de cobros y estado de pasarela. Ideal para soporte y trazabilidad."
                    icon={<CreditCard />}
                    stats={[
                        { label: 'Pagos', value: total, icon: <CreditCard className="size-3.5" />, color: 'blue' },
                        { label: 'Completados (pant.)', value: payments.data.filter((p) => p.status === 'completed').length, icon: <CircleCheck className="size-3.5" />, color: 'green' },
                        { label: 'Fallidos (pant.)', value: failedOnScreen, icon: <ShieldAlert className="size-3.5" />, color: failedOnScreen > 0 ? 'orange' : 'slate' },
                        { label: 'Página', value: `${currentPage}/${lastPage}`, icon: <LayoutList className="size-3.5" />, color: 'orange' },
                        { label: 'En pantalla', value: onScreen, icon: <MonitorCheck className="size-3.5" />, color: 'purple' },
                    ]}
                />

                <DataTable<AdminPaymentRow>
                    columns={columns}
                    data={payments.data}
                    emptyText="No se encontraron pagos."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={(
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por orden, email, gateway o transaction id…"
                        >
                            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                                <div className="min-w-0 xl:col-span-3">
                                    <FilterSelect
                                        id="payments-filter-status"
                                        aria-label="Filtrar por estado"
                                        value={filters.status != null && String(filters.status) !== '' ? String(filters.status) : ''}
                                        onValueChange={(v) => applyFilter({ status: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: 'pending', label: STATUS_LABEL.pending },
                                            { value: 'completed', label: STATUS_LABEL.completed },
                                            { value: 'failed', label: STATUS_LABEL.failed },
                                            { value: 'cancelled', label: STATUS_LABEL.cancelled },
                                            { value: 'refunded', label: STATUS_LABEL.refunded },
                                        ]}
                                        icon={<CreditCard />}
                                    />
                                </div>
                                <div className="min-w-0 xl:col-span-3">
                                    <FilterSelect
                                        id="payments-filter-gateway"
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
                                        icon={<CreditCard />}
                                    />
                                </div>
                                <DateRangeFilter
                                    className="min-w-0 xl:col-span-6"
                                    from={filters.date_from}
                                    to={filters.date_to}
                                    onFromChange={(v) => applyFilter({ date_from: v })}
                                    onToChange={(v) => applyFilter({ date_to: v })}
                                    onClear={() => applyFilter({ date_from: '', date_to: '' })}
                                    fromId="payments-filter-date-from"
                                    toId="payments-filter-date-to"
                                />
                            </div>
                        </DataFilters>
                    )}
                    footer={(
                        <DataPaginator
                            meta={payments}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    )}
                />
            </div>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Pagos', href: paymentsRoute.index.url() },
    ],
};
