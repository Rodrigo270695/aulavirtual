/**
 * admin/categories/index — Categorías jerárquicas y registro de etiquetas (modal).
 */

import { Head, router } from '@inertiajs/react';
import {
    CornerDownRight,
    FolderOpen,
    FolderTree,
    LayoutList,
    MonitorCheck,
    Plus,
    Tag,
    ToggleLeft,
} from 'lucide-react';
import { createElement, useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ImagePreviewButton } from '@/components/ui/image-preview-button';
import { getCategoryLucideIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import { CategoryFormModal } from '@/pages/admin/categories/category-form-modal';
import { dashboard } from '@/routes';
import * as categoriesRoute from '@/routes/admin/categories';
import type { AdminCategory, CategoryCan, CategoryFilters, CategoryParentOption, Column, PaginatedData } from '@/types';

interface Props {
    categories: PaginatedData<AdminCategory>;
    parentOptions: CategoryParentOption[];
    tagsCount: number;
    filters: CategoryFilters;
    can: CategoryCan;
}

function CategoryTableThumb({ row, variant }: { row: AdminCategory; variant: 'table' | 'card' }) {
    const coverSrc = row.cover_image ? `/storage/${row.cover_image}` : null;
    const LucideGlyph = getCategoryLucideIcon(row.icon);
    const box = variant === 'table' ? 'size-7' : 'size-8';
    const glyph = variant === 'table' ? 'size-3.5' : 'size-4';

    const fallback = LucideGlyph
        ? createElement(LucideGlyph, {
              className: cn('text-blue-500', glyph),
              'aria-hidden': true,
          })
        : <FolderOpen className={cn('text-blue-500', glyph)} aria-hidden />;

    return (
        <ImagePreviewButton
            src={coverSrc}
            alt={`Portada de ${row.name}`}
            fallback={fallback}
            className={cn(
                box,
                !coverSrc && 'border-transparent bg-linear-to-br from-indigo-50 to-sky-100',
            )}
        />
    );
}

export default function CategoriesIndex({ categories, parentOptions, tagsCount, filters, can }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null);

    const applyFilter = (patch: Partial<CategoryFilters>) => {
        const next: CategoryFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }

        router.get(categoriesRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: CategoryFilters & { page: number } = { ...filters, page };

        if (next.search === '') {
            delete next.search;
        }

        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }

        router.get(categoriesRoute.index.url(), next, {
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
        setEditingCategory(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminCategory) => {
        setEditingCategory(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminCategory) => {
        setDeletingCategory(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingCategory) {
            return;
        }

        setDeleting(true);
        router.delete(categoriesRoute.destroy.url({ category: deletingCategory.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingCategory(null);
            },
        });
    };

    const columns: Column<AdminCategory>[] = [
        {
            key: 'name',
            sortKey: 'name',
            header: 'Categoría',
            sortable: true,
            cardPrimary: true,
            cell: (row) => {
                const depth = row.depth ?? 0;

                return (
                    <div
                        className={cn(
                            'flex items-center gap-2',
                            depth > 0 && 'border-l-2 border-slate-200 pl-2',
                        )}
                        style={
                            depth > 0
                                ? { marginLeft: `${Math.min(depth, 12) * 0.65}rem` }
                                : undefined
                        }
                    >
                        {depth > 0 ? (
                            <CornerDownRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                        ) : null}
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <CategoryTableThumb row={row} variant="table" />
                            <div className="min-w-0">
                                <div className="font-medium text-slate-800">{row.name}</div>
                                <div className="truncate text-[11px] text-slate-400">/{row.slug}</div>
                            </div>
                        </div>
                    </div>
                );
            },
            cardCell: (row) => {
                const depth = row.depth ?? 0;

                return (
                    <div
                        className={cn(
                            'flex min-w-0 items-center gap-2',
                            depth > 0 && 'border-l-2 border-slate-200 pl-2',
                        )}
                        style={
                            depth > 0
                                ? { marginLeft: `${Math.min(depth, 12) * 0.65}rem` }
                                : undefined
                        }
                    >
                        {depth > 0 ? (
                            <CornerDownRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                        ) : null}
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <CategoryTableThumb row={row} variant="card" />
                            <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-800">{row.name}</div>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'parent',
            header: 'Padre',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {row.parent ? row.parent.name : <span className="text-slate-400">Raíz</span>}
                </span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">{row.parent ? row.parent.name : 'Raíz'}</span>
            ),
        },
        {
            key: 'is_active',
            header: 'Estado',
            sortKey: 'is_active',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) =>
                row.is_active ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Activa
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Inactiva
                    </span>
                ),
        },
        {
            key: 'created_at',
            header: 'Registro',
            sortKey: 'created_at',
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

    const total = categories.total;
    const onScreen = categories.data.length;
    const currentPage = categories.current_page;
    const lastPage = categories.last_page;
    const activasPantalla = categories.data.filter((c) => c.is_active).length;
    const hijasPantalla = categories.data.filter((c) => c.parent_id !== null).length;
    const canAddTags = can.edit || can.create;

    return (
        <>
            <Head title="Categorías" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Categorías y etiquetas"
                    description="Categorías jerárquicas. Las etiquetas se guardan con cada categoría."
                    icon={<FolderTree />}
                    stats={[
                        {
                            label: 'Categorías',
                            value: total,
                            icon: <FolderOpen className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Etiquetas',
                            value: tagsCount,
                            icon: <Tag className="size-3.5" />,
                            color: 'purple',
                        },
                        {
                            label: 'Activas (pantalla)',
                            value: activasPantalla,
                            icon: <ToggleLeft className="size-3.5" />,
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
                            label: 'Con padre (pant.)',
                            value: hijasPantalla,
                            icon: <FolderTree className="size-3.5" />,
                            color: hijasPantalla > 0 ? 'blue' : 'slate',
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
                                Nueva categoría
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminCategory>
                    columns={columns}
                    data={categories.data}
                    emptyText="No se encontraron categorías."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por nombre, slug o descripción…"
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                    <FilterSelect
                                        id="categories-filter-active"
                                        aria-label="Filtrar por estado"
                                        value={
                                            filters.is_active === '1' || filters.is_active === '0'
                                                ? filters.is_active
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ is_active: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={[
                                            { value: '1', label: 'Activas' },
                                            { value: '0', label: 'Inactivas' },
                                        ]}
                                        icon={<ToggleLeft />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={categories}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <CategoryFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingCategory(null);
                }}
                category={editingCategory}
                parentOptions={parentOptions}
                canAddTags={canAddTags}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingCategory(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar categoría"
                description={
                    <>
                        ¿Eliminar la categoría{' '}
                        <span className="font-semibold text-slate-800">«{deletingCategory?.name}»</span>?
                        <br />
                        <span className="text-xs text-slate-400">No podrás eliminarla si tiene subcategorías.</span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Categorías', href: categoriesRoute.index.url() },
    ],
};
