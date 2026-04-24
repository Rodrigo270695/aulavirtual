import { Head, router } from '@inertiajs/react';
import { LayoutList, MonitorCheck, Plus, Tag, Ticket, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CouponFormModal } from '@/pages/admin/coupons/coupon-form-modal';
import { CouponUsagesModal } from '@/pages/admin/coupons/coupon-usages-modal';
import { dashboard } from '@/routes';
import * as couponsRoute from '@/routes/admin/coupons';
import type { AdminCoupon, Column, CouponCan, CouponFilters, CourseCatalogOption, PaginatedData } from '@/types';

interface Props {
    coupons: PaginatedData<AdminCoupon>;
    courseOptions: CourseCatalogOption[];
    categoryOptions: CourseCatalogOption[];
    packageOptions: CourseCatalogOption[];
    specializationOptions: CourseCatalogOption[];
    filters: CouponFilters;
    can: CouponCan;
}

function money(v: string | number): string {
    const n = Number(v);

    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

export default function CouponsIndex({
    coupons,
    courseOptions,
    categoryOptions,
    packageOptions,
    specializationOptions,
    filters,
    can,
}: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
    const [usagesOpen, setUsagesOpen] = useState(false);
    const [usagesCoupon, setUsagesCoupon] = useState<AdminCoupon | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingCoupon, setDeletingCoupon] = useState<AdminCoupon | null>(null);

    const applyFilter = (patch: Partial<CouponFilters>) => {
        const next: CouponFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        if (next.discount_type === '' || next.discount_type === undefined) {
            delete next.discount_type;
        }

        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }

        router.get(couponsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: CouponFilters & { page: number } = { ...filters, page };

        if (next.search === '') {
            delete next.search;
        }

        if (next.discount_type === '' || next.discount_type === undefined) {
            delete next.discount_type;
        }

        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }

        router.get(couponsRoute.index.url(), next, {
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
        setEditingCoupon(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminCoupon) => {
        setEditingCoupon(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminCoupon) => {
        setDeletingCoupon(row);
        setDeleteOpen(true);
    };

    const openUsages = (row: AdminCoupon) => {
        setUsagesCoupon(row);
        setUsagesOpen(true);
    };

    const handleDelete = () => {
        if (!deletingCoupon) {
            return;
        }

        setDeleting(true);
        router.delete(couponsRoute.destroy.url({ coupon: deletingCoupon.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingCoupon(null);
            },
        });
    };

    const columns: Column<AdminCoupon>[] = [
        {
            key: 'code',
            sortKey: 'code',
            header: 'Cupón',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <Ticket className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">{row.code}</div>
                        <div className="truncate text-[11px] text-slate-400">{row.description || 'Sin descripción'}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'discount_type',
            sortKey: 'discount_type',
            header: 'Descuento',
            sortable: true,
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {row.discount_type === 'percentage' ? `${money(row.discount_value)}%` : `USD ${money(row.discount_value)}`}
                </span>
            ),
        },
        {
            key: 'applies_to',
            header: 'Aplica a',
            sortable: false,
            cell: (row) => <span className="text-sm text-slate-600">{row.applies_to}</span>,
        },
        {
            key: 'current_uses',
            sortKey: 'current_uses',
            header: 'Usos',
            sortable: true,
            cell: (row) => (
                <button
                    type="button"
                    onClick={() => openUsages(row)}
                    className="cursor-pointer text-sm font-medium text-blue-700 underline-offset-2 transition hover:text-blue-900 hover:underline"
                >
                    {row.current_uses} / {row.max_uses ?? '∞'}
                </button>
            ),
            cardCell: (row) => (
                <button
                    type="button"
                    onClick={() => openUsages(row)}
                    className="cursor-pointer text-sm font-medium text-blue-700 underline-offset-2 transition hover:text-blue-900 hover:underline"
                >
                    {row.current_uses} / {row.max_uses ?? '∞'}
                </button>
            ),
        },
        {
            key: 'valid_until',
            sortKey: 'valid_until',
            header: 'Vigencia',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-500">
                    {row.valid_from ? new Date(row.valid_from).toLocaleDateString('es-PE') : '—'} →{' '}
                    {row.valid_until ? new Date(row.valid_until).toLocaleDateString('es-PE') : 'Sin fin'}
                </span>
            ),
        },
        {
            key: 'is_active',
            sortKey: 'is_active',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) =>
                row.is_active ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Activo
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Inactivo
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
                    onDelete={() => openDelete(row)}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onEdit={() => openEdit(row)}
                    onDelete={() => openDelete(row)}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    variant="labeled"
                />
            ),
        },
    ];

    const couponsTotal = coupons.total;
    const onScreen = coupons.data.length;
    const currentPage = coupons.current_page;
    const lastPage = coupons.last_page;
    const activeOnScreen = coupons.data.filter((c) => c.is_active).length;

    return (
        <>
            <Head title="Cupones" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Gestión de Cupones"
                    description="Crea, activa y controla cupones de descuento para checkout."
                    icon={<Ticket />}
                    stats={[
                        { label: 'Cupones', value: couponsTotal, icon: <Ticket className="size-3.5" />, color: 'blue' },
                        { label: 'Activos (pantalla)', value: activeOnScreen, icon: <Tag className="size-3.5" />, color: 'green' },
                        { label: 'Página', value: `${currentPage}/${lastPage}`, icon: <LayoutList className="size-3.5" />, color: 'orange' },
                        { label: 'En pantalla', value: onScreen, icon: <MonitorCheck className="size-3.5" />, color: 'purple' },
                    ]}
                    actions={
                        can.create ? (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                            >
                                <Plus className="size-4" />
                                Nuevo cupón
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminCoupon>
                    columns={columns}
                    data={coupons.data}
                    emptyText="No se encontraron cupones."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por código o descripción…"
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-48 sm:max-w-xs">
                                    <FilterSelect
                                        id="coupons-filter-type"
                                        aria-label="Filtrar por tipo de descuento"
                                        value={filters.discount_type ? String(filters.discount_type) : ''}
                                        onValueChange={(v) => applyFilter({ discount_type: v })}
                                        allOptionLabel="Todos los tipos"
                                        contentLabel="Tipo descuento"
                                        options={[
                                            { value: 'percentage', label: 'Porcentaje' },
                                            { value: 'fixed_amount', label: 'Monto fijo' },
                                        ]}
                                        icon={<Tag />}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                    <FilterSelect
                                        id="coupons-filter-active"
                                        aria-label="Filtrar por estado"
                                        value={filters.is_active === '1' || filters.is_active === '0' ? filters.is_active : ''}
                                        onValueChange={(v) => applyFilter({ is_active: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: '1', label: 'Activo' },
                                            { value: '0', label: 'Inactivo' },
                                        ]}
                                        icon={<ToggleLeft />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={coupons}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <CouponFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingCoupon(null);
                }}
                coupon={editingCoupon}
                courseOptions={courseOptions}
                categoryOptions={categoryOptions}
                packageOptions={packageOptions}
                specializationOptions={specializationOptions}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingCoupon(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar cupón"
                description={
                    <>
                        ¿Eliminar el cupón <span className="font-semibold text-slate-800">«{deletingCoupon?.code}»</span>?
                        <br />
                        <span className="text-xs text-slate-400">Se aplicará borrado lógico (soft delete).</span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />

            <CouponUsagesModal
                open={usagesOpen}
                onClose={() => {
                    setUsagesOpen(false);
                    setUsagesCoupon(null);
                }}
                usagesUrl={usagesCoupon ? couponsRoute.usages.url({ coupon: usagesCoupon.id }) : ''}
                couponLabel={usagesCoupon ? `Cupón ${usagesCoupon.code}` : ''}
            />
        </>
    );
}

CouponsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cupones', href: couponsRoute.index.url() },
    ],
};

