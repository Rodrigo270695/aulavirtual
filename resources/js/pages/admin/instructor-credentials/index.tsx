import { Head, router } from '@inertiajs/react';
import { BadgeCheck, FileBadge2, LayoutList, MonitorCheck, Plus, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CredentialFormModal } from '@/pages/admin/instructor-credentials/credential-form-modal';
import { dashboard } from '@/routes';
import * as credentialsRoute from '@/routes/admin/instructor-credentials';
import type {
    AdminInstructorCredential,
    Column,
    CredentialCan,
    CredentialFilters,
    CredentialTypeOption,
    InstructorUserOption,
    PaginatedData,
} from '@/types';

interface Props {
    credentials: PaginatedData<AdminInstructorCredential>;
    instructorOptions: InstructorUserOption[];
    credentialTypeOptions: CredentialTypeOption[];
    canManageAll: boolean;
    filters: CredentialFilters;
    can: CredentialCan;
}

const TYPE_LABEL: Record<string, string> = {
    degree: 'Grado',
    certification: 'Certificación',
    award: 'Premio',
    publication: 'Publicación',
};

export default function InstructorCredentialsIndex({
    credentials,
    instructorOptions,
    credentialTypeOptions,
    canManageAll,
    filters,
    can,
}: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState<AdminInstructorCredential | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingCredential, setDeletingCredential] = useState<AdminInstructorCredential | null>(null);

    const applyFilter = (patch: Partial<CredentialFilters>) => {
        const next: CredentialFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (!next.search) {
delete next.search;
}

        if (!next.credential_type) {
delete next.credential_type;
}

        if (!next.is_verified) {
delete next.is_verified;
}

        router.get(credentialsRoute.index.url(), next, { preserveState: true, preserveScroll: true, replace: true });
    };

    const goToPage = (page: number) => {
        const next: CredentialFilters & { page: number } = { ...filters, page };
        router.get(credentialsRoute.index.url(), next, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (key: string) => {
        const sameCol = filters.sort_by === key;
        applyFilter({ sort_by: key, sort_dir: sameCol && filters.sort_dir === 'asc' ? 'desc' : 'asc' });
    };

    const handleDelete = () => {
        if (!deletingCredential) {
return;
}

        setDeleting(true);
        router.delete(credentialsRoute.destroy.url({ instructorCredential: deletingCredential.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingCredential(null);
            },
        });
    };

    const columns: Column<AdminInstructorCredential>[] = [
        {
            key: 'title',
            header: 'Credencial',
            sortKey: 'title',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-medium text-slate-800">{row.title}</div>
                    <div className="truncate text-[11px] text-slate-400">{row.institution}</div>
                </div>
            ),
        },
        {
            key: 'instructor',
            header: 'Instructor',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {row.instructor?.user
                        ? `${row.instructor.user.first_name} ${row.instructor.user.last_name}`
                        : '—'}
                </span>
            ),
        },
        {
            key: 'credential_type',
            header: 'Tipo',
            sortable: true,
            cell: (row) => (
                <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                    {TYPE_LABEL[row.credential_type] ?? row.credential_type}
                </span>
            ),
        },
        {
            key: 'is_verified',
            header: 'Verificada',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                row.is_verified
                    ? <BadgeCheck className="mx-auto size-4 text-emerald-500" />
                    : <span className="text-xs text-slate-400">Pendiente</span>
            ),
        },
        {
            key: 'created_at',
            header: 'Registro',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {new Date(row.created_at).toLocaleDateString('es-PE')}
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
                    onEdit={() => {
                        setEditingCredential(row);
                        setFormOpen(true);
                    }}
                    onDelete={() => {
                        setDeletingCredential(row);
                        setDeleteOpen(true);
                    }}
                    canEdit={can.edit && (canManageAll || !row.is_verified)}
                    canDelete={can.delete && (canManageAll || !row.is_verified)}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onEdit={() => {
                        setEditingCredential(row);
                        setFormOpen(true);
                    }}
                    onDelete={() => {
                        setDeletingCredential(row);
                        setDeleteOpen(true);
                    }}
                    canEdit={can.edit && (canManageAll || !row.is_verified)}
                    canDelete={can.delete && (canManageAll || !row.is_verified)}
                    variant="labeled"
                />
            ),
        },
    ];

    const total = credentials.total;
    const onScreen = credentials.data.length;
    const verifiedCount = credentials.data.filter((c) => c.is_verified).length;

    return (
        <>
            <Head title="Credenciales docentes" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Credenciales de Instructores"
                    description="Gestiona títulos, certificaciones, publicaciones y su estado de verificación."
                    icon={<FileBadge2 />}
                    stats={[
                        { label: 'Credenciales', value: total, icon: <FileBadge2 className="size-3.5" />, color: 'blue' },
                        { label: 'Verificadas (pantalla)', value: verifiedCount, icon: <BadgeCheck className="size-3.5" />, color: 'green' },
                        { label: 'Página', value: `${credentials.current_page}/${credentials.last_page}`, icon: <LayoutList className="size-3.5" />, color: 'orange' },
                        { label: 'En pantalla', value: onScreen, icon: <MonitorCheck className="size-3.5" />, color: 'purple' },
                    ]}
                    actions={
                        can.create ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCredential(null);
                                    setFormOpen(true);
                                }}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                            >
                                <Plus className="size-4" />
                                Nueva credencial
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminInstructorCredential>
                    columns={columns}
                    data={credentials.data}
                    emptyText="No se encontraron credenciales docentes."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por título, institución o instructor..."
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-48 sm:max-w-xs">
                                    <FilterSelect
                                        id="credentials-filter-type"
                                        aria-label="Filtrar por tipo de credencial"
                                        value={filters.credential_type ?? ''}
                                        onValueChange={(v) => applyFilter({ credential_type: v })}
                                        allOptionLabel="Todos los tipos"
                                        contentLabel="Tipo"
                                        options={credentialTypeOptions}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                    <FilterSelect
                                        id="credentials-filter-verified"
                                        aria-label="Filtrar por verificación"
                                        value={filters.is_verified ?? ''}
                                        onValueChange={(v) => applyFilter({ is_verified: v })}
                                        allOptionLabel="Todas"
                                        contentLabel="Verificación"
                                        options={[
                                            { value: '1', label: 'Verificadas' },
                                            { value: '0', label: 'Pendientes' },
                                        ]}
                                        icon={<UserCheck />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={credentials}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <CredentialFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingCredential(null);
                }}
                credential={editingCredential}
                instructorOptions={instructorOptions}
                credentialTypeOptions={credentialTypeOptions}
                canManageAll={canManageAll}
                canVerify={can.verify}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingCredential(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar credencial"
                description={
                    <>
                        ¿Eliminar la credencial{' '}
                        <span className="font-semibold text-slate-800">«{deletingCredential?.title}»</span>?
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

InstructorCredentialsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Credenciales docentes', href: credentialsRoute.index.url() },
    ],
};
