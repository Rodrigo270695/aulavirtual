/**
 * admin/packages/index — Paquetes de cursos (precio promocional).
 */

import { Head, router } from '@inertiajs/react';
import {
    Boxes,
    LayoutList,
    MonitorCheck,
    Package as PackageIcon,
    Plus,
    Tag,
    ToggleLeft,
} from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { FilterSelect } from '@/components/admin/filter-select';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { dashboard } from '@/routes';
import * as packagesRoute from '@/routes/admin/packages';
import { PackageFormModal } from '@/pages/admin/packages/package-form-modal';
import type {
    AdminPackage,
    Column,
    PackageCan,
    PackageCourseOption,
    PackageFilters,
    PaginatedData,
} from '@/types';

interface Props {
    packages: PaginatedData<AdminPackage>;
    courseOptions: PackageCourseOption[];
    filters: PackageFilters;
    can: PackageCan;
}

function formatMoney(v: string | number): string {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(v: string | number): string {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n)) return '—';
    return `${n.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

export default function PackagesIndex({ packages, courseOptions, filters, can }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminPackage | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingRow, setDeletingRow] = useState<AdminPackage | null>(null);

    const applyFilter = (patch: Partial<PackageFilters>) => {
        const next: PackageFilters & { page: number } = { ...filters, ...patch, page: 1 };
        if (next.search === '') delete next.search;
        if (next.is_active === '' || next.is_active === undefined) delete next.is_active;
        router.get(packagesRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: PackageFilters & { page: number } = { ...filters, page };
        if (next.search === '') delete next.search;
        if (next.is_active === '' || next.is_active === undefined) delete next.is_active;
        router.get(packagesRoute.index.url(), next, {
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
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminPackage) => {
        setEditing(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminPackage) => {
        setDeletingRow(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingRow) return;
        setDeleting(true);
        router.delete(packagesRoute.destroy.url({ package: deletingRow.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingRow(null);
            },
        });
    };

    const columns: Column<AdminPackage>[] = [
        {
            key: 'title',
            sortKey: 'title',
            header: 'Paquete',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <PackageIcon className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">{row.title}</div>
                        <div className="truncate text-[11px] text-slate-400">/{row.slug}</div>
                    </div>
                </div>
            ),
            cardCell: (row) => (
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <PackageIcon className="size-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{row.title}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'courses_count',
            sortKey: 'courses_count',
            header: 'Cursos',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className="text-sm font-semibold tabular-nums text-slate-700">{row.courses_count}</span>
            ),
        },
        {
            key: 'original_price',
            sortKey: 'original_price',
            header: 'Ref.',
            sortable: true,
            cell: (row) => (
                <span className="text-sm tabular-nums text-slate-600">{formatMoney(row.original_price)}</span>
            ),
        },
        {
            key: 'package_price',
            sortKey: 'package_price',
            header: 'Precio pack',
            sortable: true,
            cell: (row) => (
                <span className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(row.package_price)}</span>
            ),
        },
        {
            key: 'discount_pct',
            sortKey: 'discount_pct',
            header: 'Ahorro',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className="text-sm font-semibold text-emerald-700">{formatPct(row.discount_pct)}</span>
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
            key: 'created_at',
            header: 'Creado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {new Date(row.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
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

    const total = packages.total;
    const onScreen = packages.data.length;
    const currentPage = packages.current_page;
    const lastPage = packages.last_page;
    const activosPantalla = packages.data.filter((p) => p.is_active).length;
    const cursosEnPacks = packages.data.reduce((acc, p) => acc + p.courses_count, 0);

    return (
        <>
            <Head title="Paquetes" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Paquetes de cursos"
                    description="Combos con precio inferior a la suma individual. El porcentaje de ahorro y el precio de referencia se recalculan al guardar según los cursos del paquete."
                    icon={<Boxes />}
                    stats={[
                        {
                            label: 'Paquetes',
                            value: total,
                            icon: <PackageIcon className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Activos (pant.)',
                            value: activosPantalla,
                            icon: <Tag className="size-3.5" />,
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
                            label: 'Cursos en packs',
                            value: cursosEnPacks,
                            icon: <Boxes className="size-3.5" />,
                            color: 'slate',
                        },
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
                                Nuevo paquete
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminPackage>
                    columns={columns}
                    data={packages.data}
                    emptyText="No se encontraron paquetes."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por título, slug o descripción…"
                        >
                            <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                <FilterSelect
                                    id="packages-filter-active"
                                    aria-label="Filtrar por estado"
                                    value={
                                        filters.is_active === '1' || filters.is_active === '0' ? filters.is_active : ''
                                    }
                                    onValueChange={(v) => applyFilter({ is_active: v })}
                                    allOptionLabel="Todos"
                                    contentLabel="Estado"
                                    options={[
                                        { value: '1', label: 'Activos' },
                                        { value: '0', label: 'Inactivos' },
                                    ]}
                                    icon={<ToggleLeft />}
                                />
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={packages}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <PackageFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} pkg={editing} courseOptions={courseOptions} />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar paquete"
                description={
                    <>
                        ¿Eliminar el paquete{' '}
                        <span className="font-semibold text-slate-800">«{deletingRow?.title}»</span>? Se desvincularán
                        los cursos.
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

PackagesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Paquetes', href: packagesRoute.index.url() },
    ],
};
