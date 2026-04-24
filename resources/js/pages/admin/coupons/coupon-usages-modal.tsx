import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { appToastQueue } from '@/lib/app-toast-queue';
import type { AdminCouponUsagesPayload } from '@/types';

function money(v: string | number): string {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function formatDateTime(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface Props {
    open: boolean;
    onClose: () => void;
    usagesUrl: string;
    couponLabel: string;
}

export function CouponUsagesModal({ open, onClose, usagesUrl, couponLabel }: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AdminCouponUsagesPayload | null>(null);

    const load = useCallback(async () => {
        if (!usagesUrl) {
            return;
        }

        setLoading(true);
        setData(null);

        try {
            const res = await fetch(usagesUrl, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const body = (await res.json().catch(() => null)) as AdminCouponUsagesPayload | null;
            if (!res.ok || !body?.usages || !Array.isArray(body.usages)) {
                appToastQueue.add(
                    { title: 'No se pudieron cargar los usos del cupón.', variant: 'danger' },
                    { timeout: 6000 },
                );
                return;
            }

            setData(body);
        } finally {
            setLoading(false);
        }
    }, [usagesUrl]);

    useEffect(() => {
        if (open && usagesUrl) {
            void load();
        } else {
            setData(null);
        }
    }, [open, usagesUrl, load]);

    return (
        <Modal open={open} onClose={onClose} title="Usos del cupón" description={couponLabel} size="2xl">
            {loading && (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
                    <Loader2 className="size-8 animate-spin text-blue-500" />
                    <span className="text-sm">Cargando usos…</span>
                </div>
            )}

            {!loading && data && (
                <div className="space-y-4">
                    <div
                        className="flex flex-wrap gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #fff 45%)' }}
                    >
                        <div className="min-w-32">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Código</span>
                            <div className="font-bold text-slate-800">{data.coupon.code}</div>
                        </div>
                        <div className="hidden h-10 w-px bg-slate-200 sm:block" />
                        <div className="min-w-28">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Usos</span>
                            <div className="font-semibold tabular-nums text-slate-700">
                                {data.coupon.current_uses} / {data.coupon.max_uses ?? '∞'}
                            </div>
                        </div>
                        <div className="min-w-28">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Límite por usuario</span>
                            <div className="font-semibold tabular-nums text-slate-700">{data.coupon.max_uses_per_user}</div>
                        </div>
                    </div>

                    {data.usages.length === 0 && (
                        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-8 text-center text-sm text-slate-400">
                            Este cupón aún no tiene registros en <code>coupon_usages</code>.
                        </div>
                    )}

                    {data.usages.length > 0 && (
                        <>
                            <div className="space-y-3 lg:hidden">
                                {data.usages.map((row) => (
                                    <article key={row.id} className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
                                        <div className="mb-2 min-w-0">
                                            <h4 className="truncate text-sm font-semibold text-slate-800">
                                                {row.user ? `${row.user.first_name} ${row.user.last_name}` : 'Usuario no disponible'}
                                            </h4>
                                            <p className="truncate text-[11px] text-slate-400">{row.user?.email ?? '—'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                                            <span className="text-slate-500">Orden</span>
                                            <span className="truncate text-right text-slate-700">{row.order?.order_number ?? '—'}</span>

                                            <span className="text-slate-500">Descuento</span>
                                            <span className="text-right tabular-nums text-slate-700">{money(row.discount_applied)}</span>

                                            <span className="text-slate-500">Usado en</span>
                                            <span className="text-right text-slate-700">{formatDateTime(row.used_at)}</span>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="hidden max-h-[min(60vh,28rem)] overflow-auto rounded-xl border border-slate-200/90 lg:block">
                                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
                                        <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-3 py-2.5">Usuario</th>
                                            <th className="px-3 py-2.5">Orden</th>
                                            <th className="px-3 py-2.5 text-right">Total orden</th>
                                            <th className="px-3 py-2.5 text-right">Descuento</th>
                                            <th className="px-3 py-2.5">Usado en</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.usages.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                                <td className="max-w-[260px] px-3 py-2.5">
                                                    <div className="truncate font-medium text-slate-800">
                                                        {row.user ? `${row.user.first_name} ${row.user.last_name}` : 'Usuario no disponible'}
                                                    </div>
                                                    <div className="truncate text-[11px] text-slate-400">{row.user?.email ?? '—'}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                                                    {row.order?.order_number ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                                                    {row.order ? `${row.order.currency} ${money(row.order.total)}` : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                                                    {money(row.discount_applied)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                                    {formatDateTime(row.used_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Modal>
    );
}
