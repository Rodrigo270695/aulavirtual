import { Clock3 } from 'lucide-react';
import type { RecentActivity } from '@/components/dashboard/types';
import { formatRelative } from '@/components/dashboard/formatters';

interface Props {
    items: RecentActivity[];
}

export function DashboardRecentActivityCard({ items }: Props) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Actividad reciente</h2>
                <p className="text-xs text-slate-500">Últimos eventos registrados en auditoría</p>
            </div>
            <div className="divide-y divide-slate-100">
                {items.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-slate-500">Sin actividad registrada todavía.</p>
                ) : (
                    items.map((row) => (
                        <div key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                                {row.actor_initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-slate-700">
                                    <span className="font-semibold text-slate-900">{row.actor}</span>{' '}
                                    <span>{row.action_label}</span>
                                    {row.subject ? (
                                        <>
                                            {' '}
                                            <span className="font-medium text-blue-600">{row.subject}</span>
                                        </>
                                    ) : null}
                                </p>
                                <p className="truncate text-[11px] text-slate-400">{row.action}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                                <Clock3 className="size-3" />
                                {formatRelative(row.created_at)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </article>
    );
}
