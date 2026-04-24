/**
 * admin/roles/index — Vista de gestión de roles.
 */

import { Head, router } from '@inertiajs/react';
import { KeyRound, LayoutList, MonitorCheck, Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { RoleFormModal } from '@/pages/admin/roles/role-form-modal';
import { RolePermissionsModal } from '@/pages/admin/roles/role-permissions-modal';
import { dashboard } from '@/routes';
import * as rolesRoute from '@/routes/admin/roles';
import type { Column, PaginatedData, Permission, Role, RoleCan, RoleFilters } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    roles: PaginatedData<Role>;
    permissions: Permission[];
    filters: RoleFilters;
    can: RoleCan;
}

const PROTECTED_ROLE_NAMES = ['superadmin', 'student', 'instructor'];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RolesIndex({ roles, permissions, filters, can }: Props) {
    const [formOpen, setFormOpen]               = useState(false);
    const [permsOpen, setPermsOpen]             = useState(false);
    const [deleteOpen, setDeleteOpen]           = useState(false);
    const [deleting, setDeleting]               = useState(false);
    const [editingRole, setEditingRole]         = useState<Role | null>(null);
    const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole]       = useState<Role | null>(null);

    // ── Filtros y paginación ──────────────────────────────────────────────────

    const applyFilter = (patch: Partial<RoleFilters>) => {
        router.get(
            rolesRoute.index.url(),
            { ...filters, ...patch, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const goToPage = (page: number) => {
        router.get(
            rolesRoute.index.url(),
            { ...filters, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (key: string) => {
        const samCol = filters.sort_by === key;
        applyFilter({
            sort_by:  key,
            sort_dir: samCol && filters.sort_dir === 'asc' ? 'desc' : 'asc',
        });
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────

    const openCreate = () => {
        setEditingRole(null);
        setFormOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditingRole(role);
        setFormOpen(true);
    };

    const openPermissions = (role: Role) => {
        setPermissionsRole(role);
        setPermsOpen(true);
    };

    const openDelete = (role: Role) => {
        setDeletingRole(role);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingRole) {
            return;
        }

        setDeleting(true);
        router.delete(rolesRoute.destroy.url(deletingRole.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingRole(null);
            },
        });
    };

    // ── Columnas ──────────────────────────────────────────────────────────────

    const columns: Column<Role>[] = [
        {
            key: 'name',
            header: 'Rol',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <ShieldCheck className="size-3.5 text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-800">{row.name}</span>
                </div>
            ),
            /* En card: el texto siempre trunca, nunca empuja nada */
            cardCell: (row) => (
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <ShieldCheck className="size-4 text-blue-500" />
                    </div>
                    <span className="truncate font-semibold text-slate-800">{row.name}</span>
                </div>
            ),
        },
        {
            key: 'permissions_count',
            header: 'Permisos',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-semibold text-blue-700">
                    {row.permissions_count}
                </span>
            ),
        },
        {
            key: 'users_count',
            header: 'Usuarios',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span className="text-sm text-slate-600">{row.users_count}</span>
            ),
        },
        {
            key: 'created_at',
            header: 'Creado',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-slate-400">
                    {new Date(row.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', year: 'numeric',
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
            /* Tabla desktop: iconos compactos */
            cell: (row) => (
                <ActionButtons
                    onPermissions={() => openPermissions(row)}
                    onEdit={() => openEdit(row)}
                    onDelete={() => openDelete(row)}
                    canPermissions={can.permissions}
                    canEdit={can.edit && !PROTECTED_ROLE_NAMES.includes(row.name)}
                    canDelete={can.delete && !PROTECTED_ROLE_NAMES.includes(row.name)}
                    variant="icon"
                    className="justify-end"
                />
            ),
            /* Card móvil: botones con etiqueta, más táctiles */
            cardCell: (row) => (
                <ActionButtons
                    onPermissions={() => openPermissions(row)}
                    onEdit={() => openEdit(row)}
                    onDelete={() => openDelete(row)}
                    canPermissions={can.permissions}
                    canEdit={can.edit && !PROTECTED_ROLE_NAMES.includes(row.name)}
                    canDelete={can.delete && !PROTECTED_ROLE_NAMES.includes(row.name)}
                    variant="labeled"
                />
            ),
        },
    ];

    // ── Estadísticas para el header ───────────────────────────────────────────

    const rolesTotal        = roles.total;
    const permissionsTotal  = permissions.length;
    const onScreen          = roles.data.length;
    const currentPage       = roles.current_page;
    const lastPage          = roles.last_page;
    const sinPermisos       = roles.data.filter((r) => r.permissions_count === 0).length;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Roles" />

            <div className="flex flex-col gap-5 p-6">

                {/* Cabecera */}
                <PageHeader
                    title="Gestión de Roles"
                    description="Administra los roles y sus permisos en la plataforma."
                    icon={<ShieldCheck />}
                    stats={[
                        {
                            label: 'Roles',
                            value: rolesTotal,
                            icon: <ShieldCheck className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Tipos de permiso',
                            value: permissionsTotal,
                            icon: <KeyRound className="size-3.5" />,
                            color: 'purple',
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
                            color: 'green',
                        },
                        {
                            label: 'Sin permisos',
                            value: sinPermisos,
                            icon: <ShieldOff className="size-3.5" />,
                            color: sinPermisos > 0 ? 'rose' : 'slate',
                        },
                    ]}
                    actions={
                        can.create ? (
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                            >
                                <Plus className="size-4" />
                                Nuevo rol
                            </button>
                        ) : undefined
                    }
                />

                {/* Tabla con filtros y paginador integrados */}
                <DataTable<Role>
                    columns={columns}
                    data={roles.data}
                    emptyText="No se encontraron roles."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por nombre de rol..."
                        />
                    }
                    footer={
                        <DataPaginator
                            meta={roles}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            {/* Modal: crear / editar nombre */}
            <RoleFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                role={editingRole}
            />

            {/* Modal: gestión de permisos */}
            <RolePermissionsModal
                open={permsOpen}
                onClose={() => setPermsOpen(false)}
                role={permissionsRole}
                permissions={permissions}
            />

            {/* Modal: confirmación de eliminación */}
            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingRole(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar rol"
                description={
                    <>
                        ¿Estás seguro de que deseas eliminar el rol{' '}
                        <span className="font-semibold text-slate-800">«{deletingRole?.name}»</span>?
                        <br />
                        <span className="text-xs text-slate-400">Esta acción no se puede deshacer.</span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Roles',     href: rolesRoute.index.url() },
    ],
};
