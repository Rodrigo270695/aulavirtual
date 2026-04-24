import { Head, router } from '@inertiajs/react';
import { BookOpenCheck, LayoutList, MonitorCheck, Plus, Star, UserRound, Users } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { InstructorFormModal } from '@/pages/admin/instructors/instructor-form-modal';
import { dashboard } from '@/routes';
import * as instructorsRoute from '@/routes/admin/instructors';
import type {
    AdminInstructor,
    Column,
    InstructorCan,
    InstructorFilters,
    InstructorStatusOption,
    InstructorUserOption,
    PaginatedData,
} from '@/types';

interface Props {
    instructors: PaginatedData<AdminInstructor>;
    userOptions: InstructorUserOption[];
    statusOptions: InstructorStatusOption[];
    filters: InstructorFilters;
    can: InstructorCan;
}

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    active: 'bg-emerald-50 text-emerald-700',
    suspended: 'bg-slate-100 text-slate-600',
    rejected: 'bg-rose-50 text-rose-700',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    active: 'Activo',
    suspended: 'Suspendido',
    rejected: 'Rechazado',
};

export default function InstructorsIndex({ instructors, userOptions, statusOptions, filters, can }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<AdminInstructor | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingInstructor, setDeletingInstructor] = useState<AdminInstructor | null>(null);

    const applyFilter = (patch: Partial<InstructorFilters>) => {
        const next: InstructorFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        if (!next.status) {
            delete next.status;
        }

        router.get(instructorsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: InstructorFilters & { page: number } = { ...filters, page };
        router.get(instructorsRoute.index.url(), next, {
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
        setEditingInstructor(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminInstructor) => {
        setEditingInstructor(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminInstructor) => {
        setDeletingInstructor(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingInstructor) {
            return;
        }

        setDeleting(true);
        router.delete(instructorsRoute.destroy.url(deletingInstructor.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingInstructor(null);
            },
        });
    };

    const columns: Column<AdminInstructor>[] = [
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
                            {row.user.first_name} {row.user.last_name}
                        </div>
                        <div className="truncate text-[11px] text-slate-400">{row.user.email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'professional_title',
            header: 'Título',
            sortable: true,
            cell: (row) => <span className="text-sm text-slate-600">{row.professional_title}</span>,
        },
        {
            key: 'specialization_area',
            header: 'Especialización',
            sortable: false,
            cell: (row) => <span className="text-sm text-slate-600">{row.specialization_area || '—'}</span>,
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
            key: 'total_courses',
            header: 'Cursos',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => <span className="text-sm text-slate-600">{row.total_courses}</span>,
        },
        {
            key: 'avg_rating',
            header: 'Rating',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                    <Star className="size-3.5 text-amber-500" />
                    {Number(row.avg_rating).toFixed(2)}
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

    const total = instructors.total;
    const onScreen = instructors.data.length;
    const currentPage = instructors.current_page;
    const lastPage = instructors.last_page;
    const activos = instructors.data.filter((i) => i.status === 'active').length;

    return (
        <>
            <Head title="Instructores" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Gestión de Instructores"
                    description="Administra el perfil profesional de docentes, su estado de aprobación y configuración de ingresos."
                    icon={<Users />}
                    stats={[
                        { label: 'Instructores', value: total, icon: <Users className="size-3.5" />, color: 'blue' },
                        { label: 'Activos (pantalla)', value: activos, icon: <BookOpenCheck className="size-3.5" />, color: 'green' },
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
                                Nuevo instructor
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminInstructor>
                    columns={columns}
                    data={instructors.data}
                    emptyText="No se encontraron instructores."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por nombre, correo, título o especialización..."
                        >
                            <div className="min-w-0 flex-1 sm:max-w-xs">
                                <FilterSelect
                                    id="instructors-filter-status"
                                    aria-label="Filtrar por estado del instructor"
                                    value={filters.status ?? ''}
                                    onValueChange={(v) => applyFilter({ status: v })}
                                    allOptionLabel="Todos los estados"
                                    contentLabel="Estado"
                                    options={statusOptions}
                                />
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={instructors}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <InstructorFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingInstructor(null);
                }}
                instructor={editingInstructor}
                userOptions={userOptions}
                statusOptions={statusOptions}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingInstructor(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar instructor"
                description={
                    <>
                        ¿Eliminar el perfil docente de{' '}
                        <span className="font-semibold text-slate-800">
                            «{deletingInstructor?.user.first_name} {deletingInstructor?.user.last_name}»
                        </span>
                        ?
                        <br />
                        <span className="text-xs text-slate-400">No se elimina la cuenta de usuario base.</span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

InstructorsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Instructores', href: instructorsRoute.index.url() },
    ],
};
