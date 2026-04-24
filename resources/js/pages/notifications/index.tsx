import { router } from '@inertiajs/react';
import { Archive, Bell, CheckCheck, Clock3, Inbox } from 'lucide-react';
import { useState } from 'react';
import { DataFilters } from '@/components/admin/data-filters';
import { DataPaginator } from '@/components/admin/data-paginator';
import { FilterSelect } from '@/components/admin/filter-select';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { appToastQueue } from '@/lib/app-toast-queue';
import { cn } from '@/lib/utils';
import notificationsRoute from '@/routes/notifications';
import type { PaginatedData } from '@/types';

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

interface Props {
    notifications: PaginatedData<NotificationRow>;
    filters: {
        search?: string;
        tab: 'all' | 'unread' | 'archived';
        category: 'all' | 'commerce' | 'learning' | 'community' | 'system';
        per_page: number;
    };
    categories: string[];
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

function categoryChipClass(category: string): string {
    switch (category) {
        case 'commerce':
            return 'border-sky-200 bg-sky-50 text-sky-800';
        case 'learning':
            return 'border-emerald-200 bg-emerald-50 text-emerald-800';
        case 'community':
            return 'border-violet-200 bg-violet-50 text-violet-800';
        case 'system':
            return 'border-slate-200 bg-slate-100 text-slate-700';
        default:
            return 'border-slate-200 bg-slate-50 text-slate-600';
    }
}

function formatWhen(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return '';
    }

    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationsIndex({ notifications, filters, categories }: Props) {
    const [busy, setBusy] = useState<string | null>(null);

    const unreadOnScreen = notifications.data.filter((n) => !n.read_at).length;

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

    const markRead = async (id: string) => {
        setBusy(id);

        try {
            const res = await fetch(notificationsRoute.read.url({ notification: id }), {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('mark_read_failed');
            }

            router.reload({ only: ['notifications', 'notificationsBell'] });
        } catch {
            appToastQueue.add(
                { title: 'No se pudo marcar la notificación como leída.', variant: 'danger' },
                { timeout: 5000 },
            );
        } finally {
            setBusy(null);
        }
    };

    const archive = async (id: string) => {
        setBusy(id);

        try {
            const res = await fetch(notificationsRoute.archive.url({ notification: id }), {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('archive_failed');
            }

            router.reload({ only: ['notifications', 'notificationsBell'] });
        } catch {
            appToastQueue.add(
                { title: 'No se pudo archivar la notificación.', variant: 'danger' },
                { timeout: 5000 },
            );
        } finally {
            setBusy(null);
        }
    };

    const markAllRead = async () => {
        setBusy('__all__');

        try {
            const res = await fetch(notificationsRoute.readAll.url(), {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('mark_all_failed');
            }

            router.reload({ only: ['notifications', 'notificationsBell'] });
        } catch {
            appToastQueue.add(
                { title: 'No se pudieron marcar todas como leídas.', variant: 'danger' },
                { timeout: 5000 },
            );
        } finally {
            setBusy(null);
        }
    };

    return (
        <MarketplaceShell title="Notificaciones">
            <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 pb-16 sm:px-6 lg:px-8">
                <header className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-blue-500/[0.07] blur-3xl"
                    />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                <Bell className="size-3.5" />
                                Tu bandeja
                            </div>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                Centro de notificaciones
                            </h1>
                            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
                                Avisos sobre compras, cursos y actividad de tu cuenta. Todo en un solo lugar, con el mismo
                                estilo claro del campus.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={markAllRead}
                            disabled={busy === '__all__'}
                            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 disabled:opacity-50"
                        >
                            <CheckCheck className="size-3.5 text-blue-600" />
                            Marcar todas leídas
                        </button>
                    </div>
                    <div className="relative mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            No leídas en esta página: {unreadOnScreen}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            Total con filtro: {notifications.total}
                        </span>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                    <DataFilters
                        search={filters.search}
                        onSearch={(value) => applyFilter({ search: value })}
                        placeholder="Buscar en tus notificaciones…"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                                        className={cn(
                                            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                                            filters.tab === tab.key
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="w-full min-w-0 sm:w-56 sm:shrink-0">
                                <FilterSelect
                                    id="student-notifications-category"
                                    aria-label="Filtrar por categoría"
                                    value={filters.category === 'all' ? '' : filters.category}
                                    onValueChange={(v) => applyFilter({ category: (v || 'all') as Props['filters']['category'] })}
                                    allOptionLabel="Todas las categorías"
                                    contentLabel="Categoría"
                                    options={categories
                                        .filter((c) => c !== 'all')
                                        .map((c) => ({
                                            value: c,
                                            label: categoryLabel(c),
                                        }))}
                                    icon={<Bell />}
                                />
                            </div>
                        </div>
                    </DataFilters>

                    <div className="mt-5 space-y-3">
                        {notifications.data.length === 0 && (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
                                <div className="flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <Inbox className="size-7 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">No hay notificaciones</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Prueba otro filtro o vuelve más tarde cuando tengas novedades.
                                    </p>
                                </div>
                            </div>
                        )}

                        {notifications.data.map((row) => (
                            <article
                                key={row.id}
                                className={cn(
                                    'group relative overflow-hidden rounded-2xl border transition-shadow hover:shadow-md',
                                    row.read_at
                                        ? 'border-slate-200/90 bg-white'
                                        : 'border-blue-200/80 bg-linear-to-br from-white to-blue-50/60',
                                )}
                            >
                                <div
                                    className={cn(
                                        'absolute left-0 top-0 h-full w-1 rounded-l-2xl',
                                        row.read_at ? 'bg-slate-200' : 'bg-blue-500',
                                    )}
                                />
                                <div className="pl-4 pr-4 py-4 sm:pl-5">
                                    <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                                        <h2 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900">
                                            {row.title}
                                        </h2>
                                        <span
                                            className={cn(
                                                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                                categoryChipClass(row.category),
                                            )}
                                        >
                                            {categoryLabel(row.category)}
                                        </span>
                                    </div>
                                    {row.created_at ? (
                                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                            <Clock3 className="size-3" />
                                            {formatWhen(row.created_at)}
                                        </p>
                                    ) : null}
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{row.body}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                                        {row.action_url ? (
                                            <a
                                                href={row.action_url}
                                                className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                            >
                                                {row.action_text || 'Ver detalle'}
                                            </a>
                                        ) : null}
                                        {!row.read_at ? (
                                            <button
                                                type="button"
                                                disabled={busy === row.id}
                                                onClick={() => markRead(row.id)}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                Marcar leída
                                            </button>
                                        ) : null}
                                        {!row.archived_at ? (
                                            <button
                                                type="button"
                                                disabled={busy === row.id}
                                                onClick={() => archive(row.id)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                <Archive className="size-3.5" />
                                                Archivar
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4">
                        <DataPaginator
                            meta={notifications}
                            onPageChange={goToPage}
                            onPerPageChange={(value) => applyFilter({ per_page: value })}
                            perPageOptions={[...NOTIFICATIONS_PER_PAGE_OPTIONS]}
                        />
                    </div>
                </section>
            </main>
        </MarketplaceShell>
    );
}
