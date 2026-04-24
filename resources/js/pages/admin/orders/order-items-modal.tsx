/**
 * Modal: líneas de una orden (order_items), vía JSON.
 */

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { appToastQueue } from '@/lib/app-toast-queue';
import type { AdminOrderItemsPayload } from '@/types';

function money(v: string | number): string {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function formatShortDate(iso: string | null): string {
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

function prettyType(type: string): string {
    if (!type) {
        return '—';
    }
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

interface Props {
    open: boolean;
    onClose: () => void;
    itemsUrl: string;
    orderLabel: string;
}

export function OrderItemsModal({ open, onClose, itemsUrl, orderLabel }: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AdminOrderItemsPayload | null>(null);

    const load = useCallback(async () => {
        if (!itemsUrl) {
            return;
        }
        setLoading(true);
        setData(null);
        try {
            const res = await fetch(itemsUrl, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const body = (await res.json().catch(() => null)) as AdminOrderItemsPayload | null;
            if (!res.ok || !body?.items || !Array.isArray(body.items)) {
                appToastQueue.add(
                    { title: 'No se pudieron cargar los ítems de la orden.', variant: 'danger' },
                    { timeout: 6000 },
                );
                return;
            }
            setData(body);
        } finally {
            setLoading(false);
        }
    }, [itemsUrl]);

    useEffect(() => {
        if (open && itemsUrl) {
            void load();
        } else {
            setData(null);
        }
    }, [open, itemsUrl, load]);

    const o = data?.order;

    return (
        <Modal open={open} onClose={onClose} title="Ítems de la orden" description={orderLabel} size="2xl">
            {loading && (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
                    <Loader2 className="size-8 animate-spin text-blue-500" />
                    <span className="text-sm">Cargando líneas…</span>
                </div>
            )}

            {!loading && data && o && (
                <div className="space-y-4">
                    <div
                        className="flex flex-wrap gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #fff 45%)' }}
                    >
                        <div className="min-w-36">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total</span>
                            <div className="font-bold tabular-nums text-slate-800">
                                {o.currency} {money(o.total)}
                            </div>
                        </div>
                        <div className="hidden h-10 w-px bg-slate-200 sm:block" />
                        <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Facturación</span>
                            <div className="truncate text-slate-700">
                                {o.billing_name || '—'}{' '}
                                {o.billing_email && (
                                    <span className="text-slate-500">({o.billing_email})</span>
                                )}
                            </div>
                        </div>
                        <div className="min-w-32">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pagado</span>
                            <div className="text-slate-700">{formatShortDate(o.paid_at)}</div>
                        </div>
                    </div>

                    {data.items.length === 0 && (
                        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-8 text-center text-sm text-slate-400">
                            Esta orden no tiene líneas registradas.
                        </div>
                    )}

                    {data.items.length > 0 && (
                        <>
                            <div className="space-y-3 lg:hidden">
                                {data.items.map((row) => (
                                    <article
                                        key={row.id}
                                        className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="truncate text-sm font-semibold text-slate-800" title={row.title}>
                                                    {row.title}
                                                </h4>
                                                <p className="truncate text-[11px] text-slate-400">{row.item_id}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                                {prettyType(row.item_type)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                                            <span className="text-slate-500">Precio unitario</span>
                                            <span className="text-right tabular-nums text-slate-700">{money(row.unit_price)}</span>

                                            <span className="text-slate-500">Descuento</span>
                                            <span className="text-right tabular-nums text-slate-700">{money(row.discount_amount)}</span>

                                            <span className="text-slate-500">Instructor</span>
                                            <span className="text-right tabular-nums text-slate-700">{money(row.instructor_revenue)}</span>

                                            <span className="text-slate-500">Plataforma</span>
                                            <span className="text-right tabular-nums text-slate-700">{money(row.platform_revenue)}</span>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final</span>
                                            <span className="text-sm font-bold tabular-nums text-slate-900">
                                                {money(row.final_price)}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="hidden max-h-[min(60vh,28rem)] overflow-auto rounded-xl border border-slate-200/90 lg:block">
                                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
                                        <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-3 py-2.5">Concepto</th>
                                            <th className="px-3 py-2.5">Tipo</th>
                                            <th className="px-3 py-2.5 text-right">P. unit.</th>
                                            <th className="px-3 py-2.5 text-right">Dcto.</th>
                                            <th className="px-3 py-2.5 text-right">Final</th>
                                            <th className="px-3 py-2.5 text-right">Instr.</th>
                                            <th className="px-3 py-2.5 text-right">Plat.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                                <td className="max-w-[220px] px-3 py-2.5">
                                                    <div className="truncate font-medium text-slate-800" title={row.title}>
                                                        {row.title}
                                                    </div>
                                                    <div className="truncate text-[11px] text-slate-400">{row.item_id}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                                    {prettyType(row.item_type)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                                                    {money(row.unit_price)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                                                    {money(row.discount_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                                                    {money(row.final_price)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                                                    {money(row.instructor_revenue)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                                                    {money(row.platform_revenue)}
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
