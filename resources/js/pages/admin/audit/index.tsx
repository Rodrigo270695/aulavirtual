/**
 * admin/audit/index — Auditoría: actividad del sistema e inicios de sesión.
 */

import { Head, router } from '@inertiajs/react';
import {
    KeyRound,
    LayoutList,
    MonitorCheck,
    ScrollText,
    UserRound,
} from 'lucide-react';
import { useMemo } from 'react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import * as auditRoute from '@/routes/admin/audit';
import type {
    AdminActivityLogRow,
    AdminLoginHistoryRow,
    AuditFilters,
    AuditSection,
    Column,
    PaginatedData,
} from '@/types';

type AuditRow = AdminActivityLogRow | AdminLoginHistoryRow;

const PER_PAGE_OPTIONS = [25, 50, 75, 100] as const;

const LOGIN_STATUS_STYLE: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    failed: 'bg-rose-100 text-rose-800 border-rose-200',
    blocked: 'bg-amber-100 text-amber-900 border-amber-200',
};

function formatUserLabel(
    user: AdminActivityLogRow['user'] | AdminLoginHistoryRow['user'],
): string {
    if (!user) {
        return '—';
    }
    const name = `${user.first_name} ${user.last_name}`.trim();
    return name ? `${name} · ${user.email}` : user.email;
}

function formatActivityActor(row: AdminActivityLogRow): string {
    if (row.user) {
        return formatUserLabel(row.user);
    }
    if (row.actor_hint) {
        return `Intento: ${row.actor_hint}`;
    }
    return '—';
}

function formatLoginActor(row: AdminLoginHistoryRow): string {
    if (row.user) {
        return formatUserLabel(row.user);
    }
    if (row.login_identifier) {
        return row.login_identifier;
    }
    return '—';
}

interface Props {
    rows: PaginatedData<AuditRow>;
    filters: AuditFilters & { section: AuditSection };
}

export default function AuditIndex({ rows, filters }: Props) {
    const section = filters.section ?? 'activity';

    const applyFilter = (patch: Partial<AuditFilters>) => {
        const next: AuditFilters & { page: number; section: AuditSection } = {
            ...filters,
            ...patch,
            page: 1,
            section: (patch.section as AuditSection | undefined) ?? section,
        };
        if (next.search === '') {
            delete next.search;
        }
        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }
        if (next.section === 'activity') {
            delete next.status;
        }

        router.get(auditRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: AuditFilters & { page: number; section: AuditSection } = {
            ...filters,
            page,
            section,
        };
        if (next.search === '') {
            delete next.search;
        }
        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }
        if (next.section === 'activity') {
            delete next.status;
        }

        router.get(auditRoute.index.url(), next, {
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

    const setSection = (nextSection: AuditSection) => {
        applyFilter({
            section: nextSection,
            sort_by: nextSection === 'activity' ? 'created_at' : 'created_at',
            sort_dir: 'desc',
            status: nextSection === 'activity' ? undefined : filters.status,
        });
    };

    const activityColumns: Column<AdminActivityLogRow>[] = useMemo(
        () => [
            {
                key: 'created_at',
                header: 'Fecha',
                sortable: true,
                cell: (row) => (
                    <span className="text-xs text-slate-600">
                        {row.created_at
                            ? new Date(row.created_at).toLocaleString('es-PE', {
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
                key: 'user',
                header: 'Quién',
                cell: (row) => (
                    <div className="max-w-[240px]">
                        <div className="truncate text-sm font-medium text-slate-800" title={formatActivityActor(row)}>
                            {formatActivityActor(row)}
                        </div>
                    </div>
                ),
            },
            {
                key: 'action',
                header: 'Qué pasó',
                sortable: true,
                cell: (row) => (
                    <div className="max-w-[200px]">
                        <div className="truncate text-sm font-semibold text-slate-800">{row.action_label}</div>
                        <div className="truncate font-mono text-[10px] text-slate-400">{row.action}</div>
                    </div>
                ),
            },
            {
                key: 'subject_type',
                header: 'Sujeto',
                sortable: true,
                cell: (row) => (
                    <div className="max-w-[200px]">
                        <div className="truncate text-xs font-medium text-slate-800" title={row.subject_type ?? ''}>
                            {row.subject_short ?? '—'}
                        </div>
                        {row.subject_id ? (
                            <div className="truncate font-mono text-[10px] text-slate-400">{row.subject_id}</div>
                        ) : null}
                    </div>
                ),
            },
            {
                key: 'ip_address',
                header: 'IP',
                sortable: true,
                cell: (row) => (
                    <span className="font-mono text-xs text-slate-600">{row.ip_address ?? '—'}</span>
                ),
            },
            {
                key: 'user_agent_short',
                header: 'Cliente (UA)',
                cell: (row) => (
                    <span className="max-w-[200px] truncate text-[11px] text-slate-600" title={row.user_agent_short ?? ''}>
                        {row.user_agent_short ?? '—'}
                    </span>
                ),
            },
            {
                key: 'session_tail',
                header: 'Sesión',
                cell: (row) => (
                    <span className="font-mono text-[11px] text-slate-500">{row.session_tail ? `…${row.session_tail}` : '—'}</span>
                ),
            },
            {
                key: 'extra_preview',
                header: 'Detalle',
                cell: (row) => (
                    <span className="max-w-[220px] truncate text-[11px] text-slate-600" title={row.extra_preview ?? ''}>
                        {row.extra_preview ?? '—'}
                    </span>
                ),
            },
            {
                key: 'has_snapshot',
                header: 'Δ datos',
                cell: (row) => (
                    <span
                        className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            row.has_snapshot
                                ? 'border-sky-200 bg-sky-50 text-sky-800'
                                : 'border-slate-200 bg-slate-50 text-slate-500',
                        )}
                    >
                        {row.has_snapshot ? 'Sí' : 'No'}
                    </span>
                ),
            },
        ],
        [],
    );

    const loginColumns: Column<AdminLoginHistoryRow>[] = useMemo(
        () => [
            {
                key: 'created_at',
                header: 'Fecha',
                sortable: true,
                cell: (row) => (
                    <span className="text-xs text-slate-600">
                        {row.created_at
                            ? new Date(row.created_at).toLocaleString('es-PE', {
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
                key: 'user',
                header: 'Quién / cuenta',
                cell: (row) => (
                    <div className="max-w-[240px]">
                        <div className="truncate text-sm font-medium text-slate-800" title={formatLoginActor(row)}>
                            {formatLoginActor(row)}
                        </div>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Estado',
                sortable: true,
                cell: (row) => (
                    <span
                        className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            LOGIN_STATUS_STYLE[row.status] ?? 'border-slate-200 bg-slate-50 text-slate-600',
                        )}
                    >
                        {row.status}
                    </span>
                ),
            },
            {
                key: 'ip_address',
                header: 'IP',
                sortable: true,
                cell: (row) => <span className="font-mono text-xs text-slate-600">{row.ip_address}</span>,
            },
            {
                key: 'browser',
                header: 'Navegador / SO',
                sortable: true,
                cell: (row) => (
                    <div className="max-w-[180px]">
                        <div className="truncate text-xs text-slate-700">{row.browser ?? '—'}</div>
                        <div className="truncate text-[10px] text-slate-400">{row.os ?? ''}</div>
                    </div>
                ),
            },
            {
                key: 'failure_reason',
                header: 'Detalle',
                cell: (row) => (
                    <span className="max-w-[200px] truncate text-xs text-slate-500" title={row.failure_reason ?? ''}>
                        {row.failure_reason ?? '—'}
                    </span>
                ),
            },
        ],
        [],
    );

    const columns = section === 'activity' ? (activityColumns as Column<AuditRow>[]) : (loginColumns as Column<AuditRow>[]);

    const rowsTotal = rows.total;
    const onScreen = rows.data.length;
    const currentPage = rows.current_page;
    const lastPage = rows.last_page;

    const withUserOnPage = rows.data.filter((r) => 'user' in r && r.user).length;
    const failedOnPage =
        section === 'logins'
            ? rows.data.filter((r) => 'status' in r && r.status === 'failed').length
            : 0;
    const snapshotsOnPage =
        section === 'activity'
            ? rows.data.filter((r) => 'has_snapshot' in r && r.has_snapshot).length
            : 0;

    const emptyText =
        section === 'activity'
            ? 'Aún no hay eventos en el registro. A partir de ahora se guardan inicios y cierres de sesión, intentos fallidos y (en el futuro) más acciones del sistema.'
            : 'Aún no hay filas de inicio de sesión. Inicia y cierra sesión para ver entradas aquí (correctos y fallidos).';

    return (
        <>
            <Head title="Auditoría" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Auditoría"
                    description="Vista de solo lectura: actividad (eventos como accesos y errores de autenticación) e historial detallado de inicios de sesión. Los datos se generan automáticamente al usar el login de la aplicación."
                    icon={<ScrollText />}
                    stats={[
                        {
                            label: section === 'activity' ? 'Eventos (total)' : 'Inicios (total)',
                            value: rowsTotal,
                            icon: <ScrollText className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: section === 'activity' ? 'Con cambios (pant.)' : 'Fallidos (pant.)',
                            value: section === 'activity' ? snapshotsOnPage : failedOnPage,
                            icon: <KeyRound className="size-3.5" />,
                            color: section === 'activity' ? 'teal' : 'rose',
                        },
                        {
                            label: 'Con usuario (pant.)',
                            value: withUserOnPage,
                            icon: <UserRound className="size-3.5" />,
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

                <DataTable<AuditRow>
                    columns={columns}
                    data={rows.data}
                    emptyText={emptyText}
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <>
                            <div className="flex flex-wrap gap-2 border-b border-slate-200/80 px-1 pb-3">
                                <button
                                    type="button"
                                    onClick={() => setSection('activity')}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
                                        section === 'activity'
                                            ? 'text-white shadow-sm'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                                    )}
                                    style={
                                        section === 'activity'
                                            ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }
                                            : undefined
                                    }
                                >
                                    <ScrollText className="size-4 shrink-0" />
                                    Actividad
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSection('logins')}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
                                        section === 'logins'
                                            ? 'text-white shadow-sm'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                                    )}
                                    style={
                                        section === 'logins'
                                            ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }
                                            : undefined
                                    }
                                >
                                    <KeyRound className="size-4 shrink-0" />
                                    Inicios de sesión
                                </button>
                            </div>
                            <DataFilters
                                search={filters.search}
                                onSearch={(v) => applyFilter({ search: v })}
                                placeholder={
                                    section === 'activity'
                                        ? 'Buscar por acción, sujeto, IP o usuario…'
                                        : 'Buscar por IP, estado, navegador, usuario…'
                                }
                            >
                                {section === 'logins' ? (
                                    <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                        <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                            <FilterSelect
                                                id="audit-filter-login-status"
                                                aria-label="Filtrar por resultado del inicio"
                                                value={
                                                    filters.status === 'success' ||
                                                    filters.status === 'failed' ||
                                                    filters.status === 'blocked'
                                                        ? filters.status
                                                        : ''
                                                }
                                                onValueChange={(v) => applyFilter({ status: v })}
                                                allOptionLabel="Todos los estados"
                                                contentLabel="Estado"
                                                options={[
                                                    { value: 'success', label: 'Correcto' },
                                                    { value: 'failed', label: 'Fallido' },
                                                    { value: 'blocked', label: 'Bloqueado' },
                                                ]}
                                                icon={<KeyRound />}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </DataFilters>
                        </>
                    }
                    footer={
                        <DataPaginator
                            meta={rows}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                            perPageOptions={[...PER_PAGE_OPTIONS]}
                        />
                    }
                />
            </div>
        </>
    );
}

AuditIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Auditoría', href: auditRoute.index.url() },
    ],
};
