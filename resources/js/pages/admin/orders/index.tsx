/**
 * admin/orders/index — Listado de órdenes (panel admin).
 */

import { Head, router } from '@inertiajs/react';
import { CircleCheck, LayoutList, MonitorCheck, ShoppingCart, UserRound } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { OrderItemsModal } from '@/pages/admin/orders/order-items-modal';
import { dashboard } from '@/routes';
import * as ordersRoute from '@/routes/admin/orders';
import type { AdminOrderRow, Column, OrderCan, OrderFilters, PaginatedData } from '@/types';

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'paid':
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
    orders: PaginatedData<AdminOrderRow>;
    filters: OrderFilters;
    can: OrderCan;
}

export default function OrdersIndex({ orders, filters, can }: Props) {
    const [itemsOpen, setItemsOpen] = useState(false);
    const [itemsOrder, setItemsOrder] = useState<AdminOrderRow | null>(null);

    const applyFilter = (patch: Partial<OrderFilters>) => {
        const next: OrderFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }

        if (next.date_from === '' || next.date_from === undefined) {
            delete next.date_from;
        }

        if (next.date_to === '' || next.date_to === undefined) {
            delete next.date_to;
        }

        router.get(ordersRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: OrderFilters & { page: number } = { ...filters, page };

        if (next.search === '') {
            delete next.search;
        }

        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }

        if (next.date_from === '' || next.date_from === undefined) {
            delete next.date_from;
        }

        if (next.date_to === '' || next.date_to === undefined) {
            delete next.date_to;
        }

        router.get(ordersRoute.index.url(), next, {
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

    const openItems = (row: AdminOrderRow) => {
        setItemsOrder(row);
        setItemsOpen(true);
    };

    const columns: Column<AdminOrderRow>[] = [
        {
            key: 'order_number',
            sortKey: 'order_number',
            header: 'Orden',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <ShoppingCart className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">{row.order_number}</div>
                        <div className="truncate text-[11px] text-slate-400">
                            {row.billing_email || row.user?.email || '—'}
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
                        <ShoppingCart className="size-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{row.order_number}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'user',
            header: 'Cliente',
            sortable: false,
            cell: (row) => {
                if (row.user) {
                    return (
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                                >
                                    <UserRound className="size-3.5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-slate-800">
                                        {row.user.first_name} {row.user.last_name}
                                    </div>
                                    <div className="truncate text-[11px] text-slate-400">{row.user.email}</div>
                                </div>
                            </div>
                        </div>
                    );
                }

                return <span className="text-sm text-slate-400">—</span>;
            },
        },
        {
            key: 'status',
            sortKey: 'status',
            header: 'Estado',
            sortable: true,
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
            key: 'total',
            sortKey: 'total',
            header: 'Total',
            sortable: true,
            cell: (row) => (
                <span className="text-sm font-semibold tabular-nums text-slate-800">
                    {row.currency} {money(row.total)}
                </span>
            ),
        },
        {
            key: 'items_count',
            sortKey: 'items_count',
            header: 'Ítems',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className="text-sm tabular-nums text-slate-600">{row.items_count}</span>
            ),
        },
        {
            key: 'paid_at',
            sortKey: 'paid_at',
            header: 'Pagado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {row.paid_at
                        ? new Date(row.paid_at).toLocaleString('es-PE', {
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
        {
            key: 'created_at',
            sortKey: 'created_at',
            header: 'Creada',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {row.created_at
                        ? new Date(row.created_at).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                          })
                        : '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            headerClassName: 'text-right',
            className: 'text-right',
            cardFooter: true,
            cell: (row) => (
                <ActionButtons
                    onView={() => openItems(row)}
                    canView={can.items}
                    canEdit={false}
                    canDelete={false}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onView={() => openItems(row)}
                    canView={can.items}
                    canEdit={false}
                    canDelete={false}
                    variant="labeled"
                />
            ),
        },
    ];

    const ordersTotal = orders.total;
    const onScreen = orders.data.length;
    const currentPage = orders.current_page;
    const lastPage = orders.last_page;
    const pagadasPantalla = orders.data.filter((o) => o.status === 'paid').length;

    return (
        <>
            <Head title="Órdenes" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Órdenes de compra"
                    description="Consulta de órdenes generadas en el flujo del estudiante. Usa «Ver ítems» para revisar las líneas de cada orden (requiere permiso aparte)."
                    icon={<ShoppingCart />}
                    stats={[
                        {
                            label: 'Órdenes',
                            value: ordersTotal,
                            icon: <ShoppingCart className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Pagadas (pant.)',
                            value: pagadasPantalla,
                            icon: <CircleCheck className="size-3.5" />,
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
                    ]}
                />

                <DataTable<AdminOrderRow>
                    columns={columns}
                    data={orders.data}
                    emptyText="No se encontraron órdenes."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por número, correo de facturación o cliente…"
                        >
                            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
                                <div className="min-w-0 xl:col-span-3">
                                    <FilterSelect
                                        id="orders-filter-status"
                                        aria-label="Filtrar por estado"
                                        value={
                                            filters.status != null && String(filters.status) !== ''
                                                ? String(filters.status)
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ status: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: 'pending', label: STATUS_LABEL.pending },
                                            { value: 'paid', label: STATUS_LABEL.paid },
                                            { value: 'failed', label: STATUS_LABEL.failed },
                                            { value: 'cancelled', label: STATUS_LABEL.cancelled },
                                            { value: 'refunded', label: STATUS_LABEL.refunded },
                                        ]}
                                        icon={<ShoppingCart />}
                                    />
                                </div>
                                <DateRangeFilter
                                    className="min-w-0 xl:col-span-9"
                                    from={filters.date_from}
                                    to={filters.date_to}
                                    onFromChange={(v) => applyFilter({ date_from: v })}
                                    onToChange={(v) => applyFilter({ date_to: v })}
                                    onClear={() => applyFilter({ date_from: '', date_to: '' })}
                                    fromId="orders-filter-date-from"
                                    toId="orders-filter-date-to"
                                />
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={orders}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <OrderItemsModal
                open={itemsOpen}
                onClose={() => {
                    setItemsOpen(false);
                    setItemsOrder(null);
                }}
                itemsUrl={itemsOrder ? ordersRoute.items.url({ order: itemsOrder.id }) : ''}
                orderLabel={itemsOrder ? `Orden ${itemsOrder.order_number}` : ''}
            />
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Órdenes', href: ordersRoute.index.url() },
    ],
};
