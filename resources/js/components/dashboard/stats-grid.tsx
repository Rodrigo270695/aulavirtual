import { BarChart3, BookOpen, GraduationCap, TrendingDown, TrendingUp, Users } from 'lucide-react';
import type { DashboardStat } from '@/components/dashboard/types';
import { formatCurrency } from '@/components/dashboard/formatters';

const toneStyle: Record<DashboardStat['tone'], { card: string }> = {
    blue: { card: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' },
    cyan: { card: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)' },
    violet: { card: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)' },
    emerald: { card: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)' },
};

interface Props {
    stats: DashboardStat[];
    currency: string;
}

export function DashboardStatsGrid({ stats, currency }: Props) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((card) => {
                const positive = card.change_pct >= 0;
                const icon = card.key.includes('course')
                    ? BookOpen
                    : card.key.includes('enrollment')
                        ? GraduationCap
                        : card.key.includes('revenue')
                            ? BarChart3
                            : Users;
                const Icon = icon;
                const style = toneStyle[card.tone] ?? toneStyle.blue;

                return (
                    <article
                        key={card.key}
                        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md"
                        style={{ background: style.card }}
                    >
                        <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/10" />
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                            <Icon className="size-5" />
                        </div>
                        <p className="text-2xl font-bold tracking-tight">
                            {card.key.includes('revenue')
                                ? formatCurrency(card.value, currency)
                                : card.value.toLocaleString('es-PE')}
                        </p>
                        <p className="text-sm text-white/90">{card.label}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs text-white/90">
                            {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                            <span>{positive ? '+' : ''}{card.change_pct}% {card.context}</span>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
