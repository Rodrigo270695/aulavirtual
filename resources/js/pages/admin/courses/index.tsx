/**
 * admin/courses/index — Cursos del catálogo (panel admin).
 */

import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    DollarSign,
    GraduationCap,
    LayoutList,
    MonitorCheck,
    Plus,
    Tag,
    ToggleLeft,
} from 'lucide-react';
import { useState } from 'react';
import { ActionButtons } from '@/components/admin/action-buttons';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CourseFormModal } from '@/pages/admin/courses/course-form-modal';
import { dashboard } from '@/routes';
import coursesRoute from '@/routes/admin/courses';
import type {
    AdminCourse,
    Column,
    CourseCan,
    CourseCatalogOption,
    CourseFilters,
    CourseValueLabelOption,
    PaginatedData,
} from '@/types';

const STATUS_LABEL: Record<string, string> = {
    draft: 'Borrador',
    under_review: 'En revisión',
    published: 'Publicado',
    unpublished: 'Despublicado',
    archived: 'Archivado',
};

const LEVEL_LABEL: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    all_levels: 'Todos los niveles',
};

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'published':
            return 'bg-emerald-50 text-emerald-700';
        case 'under_review':
            return 'bg-amber-50 text-amber-800';
        case 'unpublished':
            return 'bg-slate-100 text-slate-600';
        case 'archived':
            return 'bg-rose-50 text-rose-700';
        default:
            return 'bg-sky-50 text-sky-800';
    }
}

function formatCoursePrice(row: AdminCourse): string {
    if (row.is_free) {
        return 'Gratis';
    }

    const n = typeof row.price === 'string' ? parseFloat(row.price) : Number(row.price);

    if (Number.isNaN(n)) {
        return '—';
    }

    try {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: row.currency || 'USD',
            minimumFractionDigits: 2,
        }).format(n);
    } catch {
        return `${n.toFixed(2)} ${row.currency}`;
    }
}

interface Props {
    courses: PaginatedData<AdminCourse>;
    categoryOptions: CourseCatalogOption[];
    instructorOptions: CourseCatalogOption[];
    statusOptions: CourseValueLabelOption[];
    levelOptions: CourseValueLabelOption[];
    currencyOptions: CourseValueLabelOption[];
    filters: CourseFilters;
    can: CourseCan;
}

export default function CoursesIndex({
    courses,
    categoryOptions,
    instructorOptions,
    statusOptions,
    levelOptions,
    currencyOptions,
    filters,
    can,
}: Props) {
    const canAddTags = can.create || can.edit;
    const [formOpen, setFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null);

    const applyFilter = (patch: Partial<CourseFilters>) => {
        const next: CourseFilters & { page: number } = { ...filters, ...patch, page: 1 };

        if (next.search === '') {
            delete next.search;
        }

        if (next.category_id === '' || next.category_id === undefined) {
            delete next.category_id;
        }

        if (next.instructor_id === '' || next.instructor_id === undefined) {
            delete next.instructor_id;
        }

        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }

        if (next.is_free === '' || next.is_free === undefined) {
            delete next.is_free;
        }

        router.get(coursesRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: CourseFilters & { page: number } = { ...filters, page };

        if (next.search === '') {
            delete next.search;
        }

        if (next.category_id === '' || next.category_id === undefined) {
            delete next.category_id;
        }

        if (next.instructor_id === '' || next.instructor_id === undefined) {
            delete next.instructor_id;
        }

        if (next.status === '' || next.status === undefined) {
            delete next.status;
        }

        if (next.is_free === '' || next.is_free === undefined) {
            delete next.is_free;
        }

        router.get(coursesRoute.index.url(), next, {
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
        setEditingCourse(null);
        setFormOpen(true);
    };

    const openEdit = (row: AdminCourse) => {
        setEditingCourse(row);
        setFormOpen(true);
    };

    const openDelete = (row: AdminCourse) => {
        setDeletingCourse(row);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deletingCourse) {
            return;
        }

        setDeleting(true);
        router.delete(coursesRoute.destroy.url({ course: deletingCourse.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setDeletingCourse(null);
            },
        });
    };

    const columns: Column<AdminCourse>[] = [
        {
            key: 'title',
            sortKey: 'title',
            header: 'Curso',
            sortable: true,
            cardPrimary: true,
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #dbeafe)' }}
                    >
                        <BookOpen className="size-3.5 text-blue-500" />
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
                        <BookOpen className="size-4 text-blue-500" />
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
                <span className="text-sm text-slate-600">{row.category.name}</span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">{row.category.name}</span>
            ),
        },
        {
            key: 'instructor',
            header: 'Instructor',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">
                    {row.instructor.user.first_name} {row.instructor.user.last_name}
                </span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">
                    {row.instructor.user.first_name} {row.instructor.user.last_name}
                </span>
            ),
        },
        {
            key: 'level',
            header: 'Nivel',
            sortable: false,
            cell: (row) => (
                <span className="text-sm text-slate-600">{LEVEL_LABEL[row.level] ?? row.level}</span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-500">{LEVEL_LABEL[row.level] ?? row.level}</span>
            ),
        },
        {
            key: 'status',
            sortKey: 'status',
            header: 'Estado',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) => (
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
                >
                    {STATUS_LABEL[row.status] ?? row.status}
                </span>
            ),
        },
        {
            key: 'price',
            sortKey: 'price',
            header: 'Precio',
            sortable: true,
            cell: (row) => (
                <span className="text-sm font-medium text-slate-700">{formatCoursePrice(row)}</span>
            ),
            cardCell: (row) => (
                <span className="text-xs text-slate-600">{formatCoursePrice(row)}</span>
            ),
        },
        {
            key: 'is_free',
            sortKey: 'is_free',
            header: 'Gratis',
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            cell: (row) =>
                row.is_free ? (
                    <span className="text-[11px] font-semibold text-emerald-600">Sí</span>
                ) : (
                    <span className="text-xs text-slate-400">No</span>
                ),
        },
        {
            key: 'created_at',
            sortKey: 'created_at',
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
                    onFicha={() => router.visit(coursesRoute.ficha.show.url({ course: row.id }))}
                    onModulos={() => router.visit(coursesRoute.modules.index.url({ course: row.id }))}
                    onMatriculas={() =>
                        router.visit(coursesRoute.enrollments.index.url({ course: row.id }))
                    }
                    onEdit={() => openEdit(row)}
                    onDelete={() => openDelete(row)}
                    canFicha={can.fichaView}
                    canModulos={can.modulosView}
                    canMatriculas={can.matriculasView}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    variant="icon"
                    className="justify-end"
                />
            ),
            cardCell: (row) => (
                <ActionButtons
                    onFicha={() => router.visit(coursesRoute.ficha.show.url({ course: row.id }))}
                    onModulos={() => router.visit(coursesRoute.modules.index.url({ course: row.id }))}
                    onMatriculas={() =>
                        router.visit(coursesRoute.enrollments.index.url({ course: row.id }))
                    }
                    onEdit={() => openEdit(row)}
                    onDelete={() => openDelete(row)}
                    canFicha={can.fichaView}
                    canModulos={can.modulosView}
                    canMatriculas={can.matriculasView}
                    canEdit={can.edit}
                    canDelete={can.delete}
                    variant="labeled"
                />
            ),
        },
    ];

    const coursesTotal = courses.total;
    const onScreen = courses.data.length;
    const currentPage = courses.current_page;
    const lastPage = courses.last_page;
    const publicadosPantalla = courses.data.filter((c) => c.status === 'published').length;
    const gratisPantalla = courses.data.filter((c) => c.is_free).length;

    return (
        <>
            <Head title="Cursos" />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title="Gestión de cursos"
                    description="Catálogo de cursos: instructor, categoría, precio y estado de publicación. Los detalles pedagógicos (módulos, lecciones) se gestionan en el módulo de contenido."
                    icon={<BookOpen />}
                    stats={[
                        {
                            label: 'Cursos',
                            value: coursesTotal,
                            icon: <BookOpen className="size-3.5" />,
                            color: 'blue',
                        },
                        {
                            label: 'Publicados (pantalla)',
                            value: publicadosPantalla,
                            icon: <GraduationCap className="size-3.5" />,
                            color: 'green',
                        },
                        {
                            label: 'Gratis (pantalla)',
                            value: gratisPantalla,
                            icon: <DollarSign className="size-3.5" />,
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
                                Nuevo curso
                            </button>
                        ) : undefined
                    }
                />

                <DataTable<AdminCourse>
                    columns={columns}
                    data={courses.data}
                    emptyText="No se encontraron cursos."
                    sortBy={filters.sort_by}
                    sortDir={filters.sort_dir}
                    onSort={handleSort}
                    header={
                        <DataFilters
                            search={filters.search}
                            onSearch={(v) => applyFilter({ search: v })}
                            placeholder="Buscar por título, slug, subtítulo o descripción…"
                        >
                            <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="courses-filter-category"
                                        aria-label="Filtrar por categoría"
                                        value={
                                            filters.category_id != null && String(filters.category_id) !== ''
                                                ? String(filters.category_id)
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ category_id: v })}
                                        allOptionLabel="Todas las categorías"
                                        contentLabel="Categoría"
                                        options={categoryOptions.map((c) => ({
                                            value: c.id,
                                            label: c.label,
                                        }))}
                                        icon={<Tag />}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="courses-filter-instructor"
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
                                            value: i.id,
                                            label: i.label,
                                        }))}
                                        icon={<GraduationCap />}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="courses-filter-status"
                                        aria-label="Filtrar por estado"
                                        value={filters.status ?? ''}
                                        onValueChange={(v) => applyFilter({ status: v })}
                                        allOptionLabel="Todos los estados"
                                        contentLabel="Estado"
                                        options={statusOptions.map((s) => ({
                                            value: s.value,
                                            label: s.label,
                                        }))}
                                        icon={<ToggleLeft />}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <FilterSelect
                                        id="courses-filter-free"
                                        aria-label="Filtrar por gratuito"
                                        value={
                                            filters.is_free === '1' || filters.is_free === '0'
                                                ? filters.is_free
                                                : ''
                                        }
                                        onValueChange={(v) => applyFilter({ is_free: v })}
                                        allOptionLabel="Todos"
                                        contentLabel="Precio"
                                        options={[
                                            { value: '1', label: 'Gratis' },
                                            { value: '0', label: 'De pago' },
                                        ]}
                                        icon={<DollarSign />}
                                    />
                                </div>
                            </div>
                        </DataFilters>
                    }
                    footer={
                        <DataPaginator
                            meta={courses}
                            onPageChange={goToPage}
                            onPerPageChange={(v) => applyFilter({ per_page: v })}
                        />
                    }
                />
            </div>

            <CourseFormModal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingCourse(null);
                }}
                course={editingCourse}
                categoryOptions={categoryOptions}
                instructorOptions={instructorOptions}
                levelOptions={levelOptions}
                statusOptions={statusOptions}
                currencyOptions={currencyOptions}
                canAddTags={canAddTags}
            />

            <ConfirmModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeletingCourse(null);
                }}
                onConfirm={handleDelete}
                loading={deleting}
                title="Eliminar curso"
                description={
                    <>
                        ¿Eliminar el curso{' '}
                        <span className="font-semibold text-slate-800">«{deletingCourse?.title}»</span>?
                        <br />
                        <span className="text-xs text-slate-400">Se aplicará borrado lógico (soft delete).</span>
                    </>
                }
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

CoursesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cursos', href: coursesRoute.index.url() },
    ],
};
