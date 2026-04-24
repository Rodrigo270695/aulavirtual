/**
 * admin/instructor-payouts/index — Listado de liquidaciones a instructores (panel admin).
 */

import { Head, router } from '@inertiajs/react';
import { CircleDollarSign, LayoutList, MonitorCheck, Plus, UserRound, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { InstructorPayoutFormModal } from '@/pages/admin/instructor-payouts/instructor-payout-form-modal';
import { dashboard } from '@/routes';
import * as instructorPayoutsRoute from '@/routes/admin/instructor-payouts';
import type {
    AdminInstructorPayoutRow,
    Column,
    InstructorPayoutCan,
    InstructorPayoutFilters,
    InstructorPayoutInstructorOption,
    PaginatedData,
} from '@/types';

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    paid: 'Pagado',
    failed: 'Fallido',
};

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-sky-50 text-sky-700',
    paid: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
};

const METHOD_LABEL: Record<string, string> = {
    bank_transfer: 'Transferencia',
    paypal: 'PayPal',
    stripe_connect: 'Stripe Connect',
    yape: 'Yape',
    plim: 'Plin',
};

function money(v: string | number): string {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

interface Props {
    payouts: PaginatedData<AdminInstructorPayoutRow>;
    instructorOptions: InstructorPayoutInstructorOption[];
    filters: InstructorPayoutFilters;
    can: InstructorPayoutCan;
}

export default function InstructorPayoutsIndex({ payouts, instructorOptions, filters, can }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingPayout, setEditingPayout] = useState<AdminInstructorPayoutRow | null>(null);

    const applyFilter = (patch: Partial<InstructorPayoutFilters>) => {
        const next: InstructorPayoutFilters & { page: number } = { ...filters, ...patch, page: 1 };
        if (next.search === '') {
            delete next.search;
        }
        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }
        if (next.payout_method === '' || next.payout_method === undefined) {
            delete next.payout_method;
        }
        router.get(instructorPayoutsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: InstructorPayoutFilters & { page: number } = { ...filters, page };
        if (next.search === '') {
            delete next.search;
        }
        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }
        if (next.payout_method === '' || next.payout_method === undefined) {
            delete next.payout_method;
        }
        router.get(instructorPayoutsRoute.index.url(), next, {
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

    const openCreate = () => {
        setEditingPayout(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminInstructorPayoutRow) => {
        setEditingPayout(row);
        setFormOpen(true);
    };

    const columns: Column<AdminInstructorPayoutRow>[] = [
        {
            key: 'name',
            sortKey: 'name',
            header: 'Instructor',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <UserRound className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">
                            {row.instructor?.user ? `${row.instructor.user.first_name} ${row.instructor.user.last_name}` : '—'}
                        </div>
                        <div className="truncate text-[11px] text-slate-400">
                            {row.instructor?.user?.email ?? 'Sin email'}
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
                        <UserRound className="size-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">
                            {row.instructor?.user ? `${row.instructor.user.first_name} ${row.instructor.user.last_name}` : '—'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'period',
            sortKey: 'period_start',
            header: 'Período',
            sortable: true,
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {row.period_start && row.period_end ? `${row.period_start} → ${row.period_end}` : '—'}
                </span>
            ),
        },
        {
            key: 'payout_method',
            header: 'Método',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {row.instructor?.payout_method ? (METHOD_LABEL[row.instructor.payout_method] ?? row.instructor.payout_method) : '—'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[row.status] ?? row.status}
                </span>
            ),
        },
        {
            key: 'gross_sales',
            header: 'Bruto',
            sortable: true,
            cell: (row) => (
                <span className="text-sm font-semibold tabular-nums text-slate-700">
                    {row.currency} {money(row.gross_sales)}
                </span>
            ),
        },
        {
            key: 'platform_fee',
            header: 'Comisión',
            sortable: true,
            cell: (row) => (
                <span className="text-sm tabular-nums text-slate-600">
                    {row.currency} {money(row.platform_fee)}
                </span>
            ),
        },
        {
            key: 'net_amount',
            header: 'Neto',
            sortable: true,
            cell: (row) => (
                <span className="text-sm font-semibold tabular-nums text-slate-800">
                    {row.currency} {money(row.net_amount)}
                </span>
            ),
        },
        {
            key: 'payment_reference',
            header: 'Referencia',
            sortable: false,
            cell: (row) => (
                <span className="block max-w-[180px] truncate text-xs text-slate-500" title={row.payment_reference ?? '—'}>
                    {row.payment_reference ?? '—'}
                </span>
            ),
        },
        {
            key: 'paid_at',
            header: 'Pagado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {row.paid_at
                        ? new Date(row.paid_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
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
                    onEdit={() => openEdit(row)}
                    canEdit={can.edit && row.status !== 'paid'}
                    canDelete={false}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onEdit={() => openEdit(row)}
                    canEdit={can.edit && row.status !== 'paid'}
                    canDelete={false}
                    variant="labeled"
                />
            ),
        },
    ];

    const total = payouts.total;
    const onScreen = payouts.data.length;
    const currentPage = payouts.current_page;
    const lastPage = payouts.last_page;
    const paidOnScreen = payouts.data.filter((p) => p.status === 'paid').length;
    const failedOnScreen = payouts.data.filter((p) => p.status === 'failed').length;

    return (
        <>
            <Head title="Pagos a instructores" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Liquidaciones a Instructores"
                    description="Consulta de pagos salientes por período, con estado y referencia de transferencia o pasarela."
                    icon={<Wallet />}
                    stats={[
                        { label: 'Liquidaciones', value: total, icon: <Wallet className="size-3.5" />, color: 'blue' },
                        { label: 'Pagadas (pantalla)', value: paidOnScreen, icon: <CircleDollarSign className="size-3.5" />, color: 'green' },
                        { label: 'Página', value: `${currentPage}/${lastPage}`, icon: <LayoutList className="size-3.5" />, color: 'orange' },
                        { label: 'En pantalla', value: onScreen, icon: <MonitorCheck className="size-3.5" />, color: 'purple' },
                        { label: 'Fallidas (pantalla)', value: failedOnScreen, icon: <XCircle className="size-3.5" />, color: failedOnScreen > 0 ? 'orange' : 'slate' },
                    ]}
                    actions={can.create ? (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                        >
                            <Plus className="size-4" />
                            Nueva liquidación
                        </button>
                    ) : undefined}
                />

                <DataTable<AdminInstructorPayoutRow>
                    columns={columns}
                    data={payouts.data}
                    emptyText="No se encontraron liquidaciones."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={(
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por instructor, correo o referencia de pago…"
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-48 sm:max-w-xs">
                                    <FilterSelect
                                        id="payouts-filter-status"
                                        aria-label="Filtrar por estado"
                                        value={filters.status != null && String(filters.status) !== '' ? String(filters.status) : ''}
                                        onValueChange={(v) => applyFilter({ status: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: 'pending', label: STATUS_LABEL.pending },
                                            { value: 'processing', label: STATUS_LABEL.processing },
                                            { value: 'paid', label: STATUS_LABEL.paid },
                                            { value: 'failed', label: STATUS_LABEL.failed },
                                        ]}
                                        icon={<Wallet />}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 sm:min-w-48 sm:max-w-xs">
                                    <FilterSelect
                                        id="payouts-filter-method"
                                        aria-label="Filtrar por método de pago"
                                        value={filters.payout_method != null && String(filters.payout_method) !== '' ? String(filters.payout_method) : ''}
                                        onValueChange={(v) => applyFilter({ payout_method: v })}
                                        allOptionLabel="Todos los métodos"
                                        contentLabel="Método"
                                        options={[
                                            { value: 'bank_transfer', label: METHOD_LABEL.bank_transfer },
                                            { value: 'paypal', label: METHOD_LABEL.paypal },
                                            { value: 'stripe_connect', label: METHOD_LABEL.stripe_connect },
                                            { value: 'yape', label: METHOD_LABEL.yape },
                                            { value: 'plim', label: METHOD_LABEL.plim },
                                        ]}
                                        icon={<CircleDollarSign />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    )}
                    footer={(
                        <DataPaginator
                            meta={payouts}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    )}
                />
            </div>

            <InstructorPayoutFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingPayout(null);
                }}
                payout={editingPayout}
                instructorOptions={instructorOptions}
            />
        </>
    );
}

InstructorPayoutsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Pagos a instructores', href: instructorPayoutsRoute.index.url() },
    ],
};
