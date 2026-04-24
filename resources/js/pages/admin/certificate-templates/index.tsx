/**
 * admin/certificate-templates/index — Plantillas de certificados (panel admin).
 */

import { Head, Link, router } from '@inertiajs/react';
import { Award, FileText, LayoutList, MonitorCheck, Plus, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { FilterSelect } from '@/components/admin/filter-select';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { dashboard } from '@/routes';
import * as certificateTemplatesRoute from '@/routes/admin/certificate-templates';
import type {
    AdminCertificateTemplate,
    CertificateTemplateCan,
    CertificateTemplateFilters,
    Column,
    PaginatedData,
} from '@/types';

interface Props {
    templates: PaginatedData<AdminCertificateTemplate>;
    filters: CertificateTemplateFilters;
    can: CertificateTemplateCan;
}

function scopeLabel(row: AdminCertificateTemplate): string {
    if (row.course) {
        return `Curso: ${row.course.title}`;
    }
    if (row.specialization) {
        return `Especialización: ${row.specialization.title}`;
    }
    return 'Global';
}

export default function CertificateTemplatesIndex({
    templates,
    filters,
    can,
}: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingRow, setDeletingRow] = useState<AdminCertificateTemplate | null>(null);

    const applyFilter = (patch: Partial<CertificateTemplateFilters>) => {
        const next: CertificateTemplateFilters & { page: number } = { ...filters, ...patch, page: 1 };
        if (next.search === '') {
            delete next.search;
        }
        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }
        router.get(certificateTemplatesRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: CertificateTemplateFilters & { page: number } = { ...filters, page };
        if (next.search === '') {
            delete next.search;
        }
        if (next.is_active === '' || next.is_active === undefined) {
            delete next.is_active;
        }
        router.get(certificateTemplatesRoute.index.url(), next, {
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

    const openDelete = (row: AdminCertificateTemplate) => {
        setDeletingRow(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingRow) {
            return;
        }

        setDeleting(true);
        router.delete(certificateTemplatesRoute.destroy.url({ certificate_template: deletingRow.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingRow(null);
            },
        });
    };

    const columns: Column<AdminCertificateTemplate>[] = [
        {
            key: 'name',
            sortKey: 'name',
            header: 'Plantilla',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <FileText className="size-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-800">{row.name}</div>
                        <div className="truncate text-[11px] text-slate-400">{scopeLabel(row)}</div>
                    </div>
                </div>
            ),
            cardCell: (row) => (
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <FileText className="size-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{row.name}</div>
                    </div>
                </div>
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
            sortKey: 'created_at',
            header: 'Creada',
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
                    onEdit={() => router.get(certificateTemplatesRoute.edit.url({ certificate_template: row.id }))}
                    onDelete={() => openDelete(row)}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onEdit={() => router.get(certificateTemplatesRoute.edit.url({ certificate_template: row.id }))}
                    onDelete={() => openDelete(row)}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    variant="labeled"
                />
            ),
        },
    ];

    const total = templates.total;
    const onScreen = templates.data.length;
    const currentPage = templates.current_page;
    const lastPage = templates.last_page;
    const activasPantalla = templates.data.filter((t) => t.is_active).length;
    const inactivasPantalla = templates.data.filter((t) => !t.is_active).length;

    return (
        <>
            <Head title="Plantillas de certificado" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Plantillas de certificado"
                    description="Diseño HTML/CSS de diplomas, alcance por curso o especialización, y metadatos para PDF. Las emisiones concretas se gestionan aparte."
                    icon={<Award />}
                    stats={[
                        {
                            label: 'Plantillas',
                            value: total,
                            icon: <FileText className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Activas (pantalla)',
                            value: activasPantalla,
                            icon: <Award className="size-3.5" />,
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
                            label: 'Inactivas (pant.)',
                            value: inactivasPantalla,
                            icon: <ToggleLeft className="size-3.5" />,
                            color: inactivasPantalla > 0 ? 'orange' : 'slate',
                        },
                    ]}
                    actions={
                        can.create ? (
                            <Link
                                href={certificateTemplatesRoute.create.url()}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                            >
                                <Plus className="size-4" />
                                Nueva plantilla
                            </Link>
                        ) : undefined
                    }
                />

                <DataTable<AdminCertificateTemplate>
                    columns={columns}
                    data={templates.data}
                    emptyText="No hay plantillas de certificado."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por nombre o contenido HTML…"
                        >
                            <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-nowrap">
                                <div className="min-w-0 flex-1 sm:min-w-40 sm:max-w-xs">
                                    <FilterSelect
                                        id="cert-templates-filter-active"
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
                                            { value: '1', label: 'Activa' },
                                            { value: '0', label: 'Inactiva' },
                                        ]}
                                        icon={<ToggleLeft />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={templates}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingRow(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar plantilla"
                description={
                    <>
                        ¿Eliminar la plantilla{' '}
                        <span className="font-semibold text-slate-800">«{deletingRow?.name}»</span>?
                        <br />
                        <span className="text-xs text-slate-400">
                            No podrás borrarla si ya hay certificados emitidos con esta plantilla.
                        </span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

CertificateTemplatesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Plantillas de certificado', href: certificateTemplatesRoute.index.url() },
    ],
};
