import type { DashboardHighlight } from '@/components/dashboard/types';

const toneMap: Record<DashboardHighlight['tone'], string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

interface Props {
    items: DashboardHighlight[];
}

export function DashboardHighlightsGrid({ items }: Props) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Indicadores operativos</h2>
                <p className="text-xs text-slate-500">Detalle adicional para seguimiento diario</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                    <article
                        key={item.key}
                        className={`rounded-xl border px-4 py-3 ${toneMap[item.tone] ?? toneMap.blue}`}
                    >
                        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-85">{item.label}</p>
                        <p className="mt-1 text-xl font-bold">{item.value}</p>
                        <p className="mt-1 text-[11px] opacity-80">{item.hint}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
