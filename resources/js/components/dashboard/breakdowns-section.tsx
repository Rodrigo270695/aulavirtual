import type { DashboardBreakdownItem } from '@/components/dashboard/types';
import { formatCurrency } from '@/components/dashboard/formatters';

interface BlockProps {
    title: string;
    subtitle: string;
    items: DashboardBreakdownItem[];
    showAmount?: boolean;
    currency?: string;
}

function BreakdownBlock({ title, subtitle, items, showAmount = false, currency = 'USD' }: BlockProps) {
    const max = Math.max(...items.map((i) => i.total), 1);

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mb-3 text-xs text-slate-500">{subtitle}</p>

            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin datos suficientes.</p>
                ) : (
                    items.map((row) => (
                        <div key={row.key}>
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="truncate font-medium text-slate-700">{row.label}</span>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <span>{row.total.toLocaleString('es-PE')}</span>
                                    <span className="font-semibold text-slate-700">{row.pct}%</span>
                                </div>
                            </div>
                            {showAmount && row.amount_total != null ? (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {formatCurrency(row.amount_total, currency)}
                                </p>
                            ) : null}
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                    style={{ width: `${Math.min((row.total / max) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </article>
    );
}

interface Props {
    enrollmentStatus: DashboardBreakdownItem[];
    paymentStatusMonth: DashboardBreakdownItem[];
    courseLevels: DashboardBreakdownItem[];
    currency: string;
}

export function DashboardBreakdownsSection({
    enrollmentStatus,
    paymentStatusMonth,
    courseLevels,
    currency,
}: Props) {
    return (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <BreakdownBlock
                title="Matrículas por estado"
                subtitle="Distribución total en el sistema"
                items={enrollmentStatus}
            />
            <BreakdownBlock
                title="Pagos del mes por estado"
                subtitle="Incluye conteo y monto acumulado"
                items={paymentStatusMonth}
                showAmount
                currency={currency}
            />
            <BreakdownBlock
                title="Cursos por nivel"
                subtitle="Composición del catálogo"
                items={courseLevels}
            />
        </section>
    );
}
