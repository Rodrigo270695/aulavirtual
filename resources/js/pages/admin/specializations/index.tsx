/**
 * admin/specializations/index — Especializaciones (rutas de aprendizaje).
 */

import { Head, router } from '@inertiajs/react';
import {
    BookMarked,
    GraduationCap,
    LayoutList,
    MonitorCheck,
    Plus,
    Tags,
    UserRound,
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
import * as specializationsRoute from '@/routes/admin/specializations';
import { SpecializationFormModal } from '@/pages/admin/specializations/specialization-form-modal';
import type {
    AdminSpecialization,
    Column,
    CourseCatalogOption,
    CourseValueLabelOption,
    PaginatedData,
    SpecializationCan,
    SpecializationFilters,
} from '@/types';

interface Props {
    specializations: PaginatedData<AdminSpecialization>;
    categoryOptions: CourseCatalogOption[];
    instructorOptions: CourseCatalogOption[];
    courseOptions: CourseCatalogOption[];
    statusOptions: CourseValueLabelOption[];
    difficultyOptions: CourseValueLabelOption[];
    filters: SpecializationFilters;
    can: SpecializationCan;
}

function formatPrice(v: string | number): string {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status: string) {
    if (status === 'published') {
        return (
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Publicada
            </span>
        );
    }
    if (status === 'archived') {
        return (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                Archivada
            </span>
        );
    }
    return (
        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            Borrador
        </span>
    );
}

export default function SpecializationsIndex({
    specializations,
    categoryOptions,
    instructorOptions,
    courseOptions,
    statusOptions,
    difficultyOptions,
    filters,
    can,
}: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminSpecialization | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingRow, setDeletingRow] = useState<AdminSpecialization | null>(null);

    const applyFilter = (patch: Partial<SpecializationFilters>) => {
        const next: SpecializationFilters & { page: number } = { ...filters, ...patch, page: 1 };
        if (next.search === '') delete next.search;
        if (next.category_id === '' || next.category_id === undefined) delete next.category_id;
        if (next.instructor_id === '' || next.instructor_id === undefined) delete next.instructor_id;
        if (next.status === '' || next.status === undefined) delete next.status;
        router.get(specializationsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: SpecializationFilters & { page: number } = { ...filters, page };
        if (next.search === '') delete next.search;
        if (next.category_id === '' || next.category_id === undefined) delete next.category_id;
        if (next.instructor_id === '' || next.instructor_id === undefined) delete next.instructor_id;
        if (next.status === '' || next.status === undefined) delete next.status;
        router.get(specializationsRoute.index.url(), next, {
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

    const openEdit = (row: AdminSpecialization) => {
        setEditing(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminSpecialization) => {
        setDeletingRow(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingRow) return;
        setDeleting(true);
        router.delete(specializationsRoute.destroy.url({ specialization: deletingRow.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingRow(null);
            },
        });
    };

    const columns: Column<AdminSpecialization>[] = [
        {
            key: 'title',
            sortKey: 'title',
            header: 'Especialización',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <BookMarked className="size-3.5 text-blue-500" />
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
                        <BookMarked className="size-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{row.title}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Categoría',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">{row.category?.name ?? '—'}</span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">{row.category?.name ?? '—'}</span>
            ),
        },
        {
            key: 'instructor',
            header: 'Instructor',
            sortable: false,
            cell: (row) => {
                const u = row.instructor.user;
                return (
                    <span className="text-sm text-slate-600">
                        {u.first_name} {u.last_name}
                    </span>
                );
            },
            cardCell: (row) => {
                const u = row.instructor.user;
                return (
                    <span className="text-xs text-slate-500">
                        {u.first_name} {u.last_name}
                    </span>
                );
            },
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
            key: 'status',
            sortKey: 'status',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => statusBadge(row.status),
        },
        {
            key: 'price',
            sortKey: 'price',
            header: 'Precio',
            sortable: true,
            cell: (row) => (
                <span className="text-sm tabular-nums text-slate-700">{formatPrice(row.price)}</span>
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

    const total = specializations.total;
    const onScreen = specializations.data.length;
    const currentPage = specializations.current_page;
    const lastPage = specializations.last_page;
    const publishedOnPage = specializations.data.filter((s) => s.status === 'published').length;
    const cursosEnRutas = specializations.data.reduce((acc, s) => acc + s.courses_count, 0);

    return (
        <>
            <Head title="Especializaciones" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Especializaciones"
                    description="Rutas de aprendizaje que agrupan varios cursos en orden. Precio y categoría propios del programa; los cursos siguen existiendo en el catálogo."
                    icon={<GraduationCap />}
                    stats={[
                        {
                            label: 'Especializaciones',
                            value: total,
                            icon: <BookMarked className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Publicadas (pant.)',
                            value: publishedOnPage,
                            icon: <Tags className="size-3.5" />,
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
                            label: 'Cursos en rutas',
                            value: cursosEnRutas,
                            icon: <UserRound className="size-3.5" />,
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
                                Nueva especialización
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminSpecialization>
                    columns={columns}
                    data={specializations.data}
                    emptyText="No se encontraron especializaciones."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por título, slug o descripción…"
                        >
                            <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="spec-filter-category"
                                        aria-label="Filtrar por categoría"
                                        value={filters.category_id != null && String(filters.category_id) !== '' ? String(filters.category_id) : ''}
                                        onValueChange={(v) => applyFilter({ category_id: v })}
                                        allOptionLabel="Todas las categorías"
                                        contentLabel="Categoría"
                                        options={categoryOptions.map((c) => ({
                                            value: String(c.id),
                                            label: c.label,
                                        }))}
                                        icon={<Tags />}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="spec-filter-instructor"
                                        aria-label="Filtrar por instructor"
                                        value={
                                            filters.instructor_id != null && String(filters.instructor_id) !== ''
                                                ? String(filters.instructor_id)
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ instructor_id: v })}
                                        allOptionLabel="Todos los instructores"
                                        contentLabel="Instructor"
                                        options={instructorOptions.map((i) => ({
                                            value: String(i.id),
                                            label: i.label,
                                        }))}
                                        icon={<UserRound />}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="spec-filter-status"
                                        aria-label="Filtrar por estado"
                                        value={filters.status != null && String(filters.status) !== '' ? String(filters.status) : ''}
                                        onValueChange={(v) => applyFilter({ status: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={statusOptions.map((s) => ({
                                            value: s.value,
                                            label: s.label,
                                        }))}
                                        icon={<BookMarked />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={specializations}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <SpecializationFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                specialization={editing}
                categoryOptions={categoryOptions}
                instructorOptions={instructorOptions}
                courseOptions={courseOptions}
                statusOptions={statusOptions}
                difficultyOptions={difficultyOptions}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar especialización"
                description={
                    <>
                        ¿Eliminar{' '}
                        <span className="font-semibold text-slate-800">«{deletingRow?.title}»</span>? Se quitarán las
                        vinculaciones con cursos.
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

SpecializationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Especializaciones', href: specializationsRoute.index.url() },
    ],
};
