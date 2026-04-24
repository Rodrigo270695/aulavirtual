/**
 * admin/users/index — Listado de usuarios (panel admin).
 */

import { Head, router, usePage } from '@inertiajs/react';
import {
    LayoutList,
    MailCheck,
    MonitorCheck,
    Plus,
    Shield,
    ToggleLeft,
    UserRound,
    Users as UsersIcon,
    UserX,
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
import * as usersRoute from '@/routes/admin/users';
import { UserFormModal } from '@/pages/admin/users/user-form-modal';
import type { AdminUser, Column, PaginatedData, RoleOption, UserCan, UserFilters } from '@/types';

const DOCUMENT_LABEL: Record<string, string> = {
    dni: 'DNI',
    ce: 'CE',
    passport: 'Pasaporte',
    cedula: 'Cédula',
    ruc: 'RUC',
};

function formatAdminDocument(row: AdminUser): string {
    if (!row.document_number?.trim()) {
        return '—';
    }
    const kind = row.document_type ? DOCUMENT_LABEL[row.document_type] ?? row.document_type : '';
    return kind ? `${kind} ${row.document_number}` : row.document_number;
}

function formatAdminPhone(row: AdminUser): string {
    const line = [row.phone_country_code, row.phone_number].filter(Boolean).join(' ').trim();
    return line || '—';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    users: PaginatedData<AdminUser>;
    roleOptions: RoleOption[];
    filters: UserFilters;
    can: UserCan;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function UsersIndex({ users, roleOptions, filters, can }: Props) {
    const { auth } = usePage<{ auth: { user: { id: string } | null } }>().props;
    const currentUserId = auth.user?.id ?? null;

    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

    const applyFilter = (patch: Partial<UserFilters>) => {
        const next: UserFilters & { page: number } = { ...filters, ...patch, page: 1 };
        if (next.search === '') {
            delete next.search;
        }
        if (next.role_id === '' || next.role_id === undefined) {
            delete next.role_id;
        }
        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }
        router.get(usersRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: UserFilters & { page: number } = { ...filters, page };
        if (next.search === '') {
            delete next.search;
        }
        if (next.role_id === '' || next.role_id === undefined) {
            delete next.role_id;
        }
        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }
        router.get(usersRoute.index.url(), next, {
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
        setEditingUser(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminUser) => {
        setEditingUser(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminUser) => {
        setDeletingUser(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingUser) {
            return;
        }

        setDeleting(true);
        router.delete(usersRoute.destroy.url(deletingUser.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingUser(null);
            },
        });
    };

    const columns: Column<AdminUser>[] = [
        {
            key: 'name',
            sortKey: 'name',
            header: 'Usuario',
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
                            {row.first_name} {row.last_name}
                        </div>
                        {row.username && (
                            <div className="truncate text-[11px] text-slate-400">@{row.username}</div>
                        )}
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
                            {row.first_name} {row.last_name}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            header: 'Correo',
            sortable: true,
            cell: (row) => (
                <span className="text-sm text-slate-600">{row.email}</span>
            ),
            cardCell: (row) => (
                <span className="text-slate-600" title={row.email}>
                    {row.email}
                </span>
            ),
        },
        {
            key: 'document',
            header: 'Documento',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600" title={formatAdminDocument(row)}>
                    {formatAdminDocument(row)}
                </span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">{formatAdminDocument(row)}</span>
            ),
        },
        {
            key: 'phone',
            header: 'Celular',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">{formatAdminPhone(row)}</span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">{formatAdminPhone(row)}</span>
            ),
        },
        {
            key: 'roles_count',
            header: 'Roles',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <div className="flex flex-wrap justify-center gap-1">
                    {row.roles.slice(0, 2).map((r) => (
                        <span
                            key={r.id}
                            className="inline-flex h-6 max-w-28 items-center truncate rounded-full bg-violet-50 px-2 text-[11px] font-semibold text-violet-700"
                            title={r.name}
                        >
                            {r.name}
                        </span>
                    ))}
                    {row.roles.length > 2 && (
                        <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-500">
                            +{row.roles.length - 2}
                        </span>
                    )}
                    {row.roles.length === 0 && (
                        <span className="text-xs text-slate-400">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'is_active',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => {
                if (row.is_banned) {
                    return (
                        <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Baneado
                        </span>
                    );
                }
                if (!row.is_active) {
                    return (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Inactivo
                        </span>
                    );
                }
                return (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Activo
                    </span>
                );
            },
        },
        {
            key: 'email_verified_at',
            header: 'Verif.',
            sortable: false,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) =>
                row.email_verified_at ? (
                    <MailCheck className="mx-auto size-4 text-emerald-500" aria-label="Verificado" />
                ) : (
                    <span className="text-xs text-slate-300">—</span>
                ),
        },
        {
            key: 'created_at',
            header: 'Registro',
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
                    canEdit={can.edit && !row.is_immutable_demo}
                    canDelete={can.delete && row.id !== currentUserId && !row.is_immutable_demo}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onEdit={() => openEdit(row)}
                    onDelete={() => openDelete(row)}
                    canEdit={can.edit && !row.is_immutable_demo}
                    canDelete={can.delete && row.id !== currentUserId && !row.is_immutable_demo}
                    variant="labeled"
                />
            ),
        },
    ];

    const usersTotal = users.total;
    const onScreen = users.data.length;
    const currentPage = users.current_page;
    const lastPage = users.last_page;
    const sinRoles = users.data.filter((u) => u.roles_count === 0).length;
    const verificadosPantalla = users.data.filter((u) => u.email_verified_at).length;

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Gestión de Usuarios"
                    description="Cuentas, roles y estado. Documento y celular suelen completarlos los usuarios en su perfil; aquí ves lo registrado y puedes corregir si hace falta."
                    icon={<UsersIcon />}
                    stats={[
                        {
                            label: 'Usuarios',
                            value: usersTotal,
                            icon: <UsersIcon className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Verif. (pantalla)',
                            value: verificadosPantalla,
                            icon: <MailCheck className="size-3.5" />,
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
                            label: 'Sin roles',
                            value: sinRoles,
                            icon: <UserX className="size-3.5" />,
                            color: sinRoles > 0 ? 'orange' : 'slate',
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
                                Nuevo usuario
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminUser>
                    columns={columns}
                    data={users.data}
                    emptyText="No se encontraron usuarios."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por nombre, correo, usuario, documento o celular…"
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-48 sm:max-w-xs">
                                    <FilterSelect
                                        id="users-filter-role"
                                        aria-label="Filtrar por rol"
                                        value={
                                            filters.role_id != null && String(filters.role_id) !== ''
                                                ? String(filters.role_id)
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ role_id: v })}
                                        allOptionLabel="Todos los roles"
                                        contentLabel="Rol"
                                        options={roleOptions.map((r) => ({
                                            value: String(r.id),
                                            label: r.name,
                                        }))}
                                        icon={<Shield />}
                                    />
                                </div>
                                <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                    <FilterSelect
                                        id="users-filter-active"
                                        aria-label="Filtrar por estado de cuenta"
                                        value={
                                            filters.is_active === '1' || filters.is_active === '0'
                                                ? filters.is_active
                                                : ''
                                        }
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
                            meta={users}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <UserFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser}
                roleOptions={roleOptions}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingUser(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar usuario"
                description={
                    <>
                        ¿Eliminar la cuenta de{' '}
                        <span className="font-semibold text-slate-800">
                            «{deletingUser?.first_name} {deletingUser?.last_name}»
                        </span>{' '}
                        ({deletingUser?.email})?
                        <br />
                        <span className="text-xs text-slate-400">Se aplicará borrado lógico (soft delete).</span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Usuarios', href: usersRoute.index.url() },
    ],
};
