import { Head, router } from '@inertiajs/react';
import { Archive, Bell, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Clock3, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { DataTable } from '@/components/admin/data-table';
import { FilterSelect } from '@/components/admin/filter-select';
import { PageHeader } from '@/components/admin/page-header';
import { appToastQueue } from '@/lib/app-toast-queue';
import { dashboard } from '@/routes';
import notificationsRoute from '@/routes/admin/notifications';
import type { Column, PaginatedData } from '@/types';

const NOTIFICATIONS_PER_PAGE_OPTIONS = [25, 50, 75, 100] as const;

interface NotificationRow {
    id: string;
    notification_type: string;
    title: string;
    body: string;
    category: string;
    priority: string;
    action_url: string | null;
    action_text: string | null;
    read_at: string | null;
    archived_at: string | null;
    created_at: string | null;
}

interface NotificationPreferenceRow {
    notification_type: string;
    label: string;
    description: string;
    email_enabled: boolean;
    push_enabled: boolean;
    in_app_enabled: boolean;
    frequency: 'instant' | 'daily_digest' | 'weekly_digest';
}

interface Props {
    notifications: PaginatedData<NotificationRow>;
    filters: {
        search?: string;
        tab: 'all' | 'unread' | 'archived';
        category: 'all' | 'commerce' | 'learning' | 'community' | 'system';
        per_page: number;
    };
    categories: string[];
    preferences: NotificationPreferenceRow[];
    can: { edit: boolean };
}

function categoryLabel(category: string): string {
    switch (category) {
        case 'commerce':
            return 'Comercio';
        case 'learning':
            return 'Aprendizaje';
        case 'community':
            return 'Comunidad';
        case 'system':
            return 'Sistema';
        default:
            return category;
    }
}

export default function AdminNotificationsIndex({ notifications, filters, categories, preferences, can }: Props) {
    const [prefs, setPrefs] = useState<NotificationPreferenceRow[]>(preferences);
    const [expandedPreference, setExpandedPreference] = useState<string | null>(preferences[0]?.notification_type ?? null);
    const [preferencesPanelOpen, setPreferencesPanelOpen] = useState(true);
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const unreadCount = notifications.data.filter((n) => !n.read_at).length;
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    const applyFilter = (patch: Partial<Props['filters']>) => {
        const next: Props['filters'] & { page: number } = { ...filters, ...patch, page: 1 };
        if (!next.search) {
            delete next.search;
        }

        router.get(notificationsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const goToPage = (page: number) => {
        const next: Props['filters'] & { page: number } = { ...filters, page };
        if (!next.search) {
            delete next.search;
        }

        router.get(notificationsRoute.index.url(), next, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const requestAction = async (url: string, actionId: string, okMessage: string) => {
        setProcessingAction(actionId);
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('No se pudo completar la acción.');
            }

            appToastQueue.add({ title: okMessage, description: 'La bandeja se actualizó correctamente.' });
            router.reload({ only: ['notifications', 'notificationsBell'] });
        } catch {
            appToastQueue.add({
                title: 'Ocurrió un error',
                description: 'No se pudo completar la acción. Intenta nuevamente.',
                tone: 'danger',
            });
        } finally {
            setProcessingAction(null);
        }
    };

    const markRead = async (id: string) => {
        await requestAction(notificationsRoute.read.url({ notification: id }), `read:${id}`, 'Notificación marcada como leída');
    };

    const archive = async (id: string) => {
        await requestAction(notificationsRoute.archive.url({ notification: id }), `archive:${id}`, 'Notificación archivada');
    };

    const markAllRead = async () => {
        await requestAction(notificationsRoute.readAll.url(), 'read_all', 'Todas las notificaciones quedaron leídas');
    };

    const updatePreference = (type: string, patch: Partial<NotificationPreferenceRow>) => {
        setPrefs((prev) => prev.map((row) => (row.notification_type === type ? { ...row, ...patch } : row)));
    };

    const savePreferences = () => {
        setSavingPreferences(true);
        router.put(notificationsRoute.preferences.update.url(), { preferences: prefs }, {
            preserveScroll: true,
            onSuccess: () => appToastQueue.add({ title: 'Preferencias guardadas', description: 'Tu configuración fue actualizada.' }),
            onError: () => appToastQueue.add({
                title: 'No se pudo guardar',
                description: 'Revisa los datos e intenta otra vez.',
                tone: 'danger',
            }),
            onFinish: () => setSavingPreferences(false),
        });
    };

    const columns: Column<NotificationRow>[] = [
        {
            key: 'title',
            header: 'Notificación',
            cardPrimary: true,
            cell: (row) => (
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${row.read_at ? 'bg-slate-300' : 'bg-blue-500'}`} />
                        <span className="truncate font-semibold text-slate-800">{row.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.body}</p>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Categoría',
            cell: (row) => (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {categoryLabel(row.category)}
                </span>
            ),
        },
        {
            key: 'priority',
            header: 'Prioridad',
            cell: (row) => (
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {row.priority}
                </span>
            ),
        },
        {
            key: 'state',
            header: 'Estado',
            cell: (row) => (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    row.archived_at
                        ? 'bg-slate-100 text-slate-600'
                        : row.read_at
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                }`}
                >
                    {row.archived_at ? 'Archivada' : row.read_at ? 'Leída' : 'No leída'}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: 'Fecha',
            cell: (row) => (
                <span className="text-xs text-slate-500">
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
            key: 'actions',
            header: 'Acciones',
            cardFooter: true,
            className: 'text-right',
            headerClassName: 'text-right',
            cell: (row) => (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {row.action_url ? (
                        <a
                            href={row.action_url}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            {row.action_text || 'Ver detalle'}
                        </a>
                    ) : null}
                    {!row.read_at ? (
                        <button
                            type="button"
                            onClick={() => markRead(row.id)}
                            disabled={processingAction !== null}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                        >
                            Marcar leída
                        </button>
                    ) : null}
                    {!row.archived_at ? (
                        <button
                            type="button"
                            onClick={() => archive(row.id)}
                            disabled={processingAction !== null}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <Archive className="size-3" />
                            Archivar
                        </button>
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-5 p-6">
            <Head title="Notificaciones" />

            <PageHeader
                title="Centro de notificaciones"
                description="Administra avisos del sistema, comercio y aprendizaje desde una bandeja unificada."
                icon={<Bell />}
                stats={[
                    { label: 'No leídas visibles', value: unreadCount, color: 'blue', icon: <Bell /> },
                    { label: 'Resultados', value: notifications.total, color: 'teal', icon: <ShieldCheck /> },
                    { label: 'Frecuencia', value: 'Configurada', color: 'purple', icon: <Clock3 /> },
                ]}
                actions={(
                    <button
                        type="button"
                        onClick={markAllRead}
                        disabled={processingAction !== null}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        <CheckCheck className="size-3.5" />
                        Marcar todas leídas
                    </button>
                )}
            />

            <div className={`relative transition-all duration-300 ${preferencesPanelOpen ? 'lg:pr-92' : 'lg:pr-11'}`}>
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                    <section className="min-w-0 flex-1 space-y-4">
                    <DataTable
                        columns={columns}
                        data={notifications.data}
                        emptyText="No hay notificaciones para este filtro."
                        header={(
                            <DataFilters
                                search={filters.search}
                                onSearch={(value) => applyFilter({ search: value })}
                                placeholder="Buscar por título, contenido o tipo..."
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: 'all', label: 'Todas' },
                                            { key: 'unread', label: 'No leídas' },
                                            { key: 'archived', label: 'Archivadas' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => applyFilter({ tab: tab.key as Props['filters']['tab'] })}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                                    filters.tab === tab.key
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="w-full md:w-64">
                                        <FilterSelect
                                            id="admin-notifications-filter-category"
                                            aria-label="Filtrar por categoría de notificación"
                                            value={filters.category === 'all' ? '' : filters.category}
                                            onValueChange={(v) => applyFilter({ category: (v || 'all') as Props['filters']['category'] })}
                                            allOptionLabel="Todas las categorías"
                                            contentLabel="Categoría"
                                            options={categories
                                                .filter((category) => category !== 'all')
                                                .map((category) => ({
                                                    value: category,
                                                    label: categoryLabel(category),
                                                }))}
                                            icon={<Bell />}
                                        />
                                    </div>
                                </div>
                            </DataFilters>
                        )}
                        footer={(
                            <DataPaginator
                                meta={notifications}
                                onPageChange={goToPage}
                                onPerPageChange={(value) => applyFilter({ per_page: value })}
                                perPageOptions={[...NOTIFICATIONS_PER_PAGE_OPTIONS]}
                            />
                        )}
                    />
                    </section>

                    {!preferencesPanelOpen && (
                        <div
                            className="mt-3 flex w-full shrink-0 flex-row items-center justify-end border-t border-slate-200/90 pt-3 sm:justify-center lg:mt-0 lg:ml-3 lg:w-11 lg:flex-col lg:justify-center lg:self-stretch lg:border-l lg:border-t-0 lg:rounded-xl lg:border-slate-200/90 lg:bg-linear-to-b lg:from-slate-50 lg:to-white lg:pt-0 lg:shadow-sm"
                        >
                            <button
                                type="button"
                                onClick={() => setPreferencesPanelOpen(true)}
                                className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                                aria-label="Mostrar preferencias"
                                title="Mostrar preferencias"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                        </div>
                    )}
                </div>

                <aside
                    className={`space-y-4 mt-4 lg:mt-0 lg:absolute lg:right-0 lg:top-0 lg:w-88 lg:transition-all lg:duration-300 ${
                        preferencesPanelOpen
                            ? 'lg:translate-x-0 lg:opacity-100'
                            : 'max-lg:hidden lg:pointer-events-none lg:translate-x-[110%] lg:opacity-0'
                    }`}
                >
                    {preferencesPanelOpen && (
                        <button
                            type="button"
                            onClick={() => setPreferencesPanelOpen(false)}
                            className="hidden lg:inline-flex absolute -left-4 top-1/2 z-20 size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                            aria-label="Ocultar preferencias"
                            title="Ocultar preferencias"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    )}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Preferencias</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Configuración por tipo para inbox, correo y push.
                                </p>
                            </div>
                            {preferencesPanelOpen && (
                                <button
                                    type="button"
                                    onClick={() => setPreferencesPanelOpen(false)}
                                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
                                    aria-label="Ocultar preferencias"
                                    title="Ocultar preferencias"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            )}
                        </div>
                        <div className="mt-3 space-y-3">
                            {prefs.map((pref) => (
                                <div
                                    key={pref.notification_type}
                                    className="overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50/50 transition"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setExpandedPreference((prev) => (
                                            prev === pref.notification_type ? null : pref.notification_type
                                        ))}
                                        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50/70"
                                    >
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-slate-800">{pref.label}</h3>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{pref.description}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    pref.in_app_enabled ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
                                                }`}
                                                >
                                                    In-app
                                                </span>
                                                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    pref.email_enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'
                                                }`}
                                                >
                                                    Email
                                                </span>
                                                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    pref.push_enabled ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500'
                                                }`}
                                                >
                                                    Push
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`mt-0.5 size-4 shrink-0 text-slate-400 transition-transform ${
                                                expandedPreference === pref.notification_type ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    <div className={`grid transition-all duration-300 ${
                                        expandedPreference === pref.notification_type ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                    }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="border-t border-slate-200/80 bg-white/80 px-3 py-3">
                                                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                                                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={pref.in_app_enabled}
                                                            disabled={!can.edit}
                                                            onChange={(e) => updatePreference(pref.notification_type, { in_app_enabled: e.target.checked })}
                                                            className="accent-blue-600"
                                                        />
                                                        In-app
                                                    </label>
                                                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={pref.email_enabled}
                                                            disabled={!can.edit}
                                                            onChange={(e) => updatePreference(pref.notification_type, { email_enabled: e.target.checked })}
                                                            className="accent-blue-600"
                                                        />
                                                        <Mail className="size-3.5" /> Email
                                                    </label>
                                                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 px-2 py-1.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={pref.push_enabled}
                                                            disabled={!can.edit}
                                                            onChange={(e) => updatePreference(pref.notification_type, { push_enabled: e.target.checked })}
                                                            className="accent-blue-600"
                                                        />
                                                        <Smartphone className="size-3.5" /> Push
                                                    </label>
                                                </div>
                                                <div className="mt-2">
                                                    <FilterSelect
                                                        id={`notif-pref-frequency-${pref.notification_type}`}
                                                        aria-label={`Frecuencia para ${pref.label}`}
                                                        value={pref.frequency}
                                                        onValueChange={(v) => updatePreference(pref.notification_type, {
                                                            frequency: v as NotificationPreferenceRow['frequency'],
                                                        })}
                                                        contentLabel="Frecuencia"
                                                        disabled={!can.edit}
                                                        options={[
                                                            { value: 'instant', label: 'Instantáneo' },
                                                            { value: 'daily_digest', label: 'Resumen diario' },
                                                            { value: 'weekly_digest', label: 'Resumen semanal' },
                                                        ]}
                                                        icon={<Bell />}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={savePreferences}
                            disabled={!can.edit || savingPreferences}
                            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            {savingPreferences ? 'Guardando...' : 'Guardar preferencias'}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

AdminNotificationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Notificaciones', href: notificationsRoute.index.url() },
    ],
};
