import { Area, AreaChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardChartContainer } from '@/components/dashboard/chart-container';
import type { TrendPoint } from '@/components/dashboard/types';
import { formatCurrency } from '@/components/dashboard/formatters';

interface Props {
    trend: TrendPoint[];
    currency: string;
}

export function DashboardTrendChartCard({ trend, currency }: Props) {
    return (
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900">Tendencia mensual</h2>
                <p className="text-xs text-slate-500">Matrículas e ingresos (últimos 6 meses)</p>
            </div>
            <DashboardChartContainer className="h-72 min-w-0" minHeight={240}>
                {(size) => (
                    <AreaChart width={size.width} height={size.height} data={trend}>
                        <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                            formatter={(value: number, key: string) => {
                                if (key === 'revenue') return [formatCurrency(value, currency), 'Ingresos'];
                                return [value.toLocaleString('es-PE'), 'Matrículas'];
                            }}
                            labelFormatter={(label: string, payload) => payload?.[0]?.payload?.month_full ?? label}
                        />
                        <Bar yAxisId="left" dataKey="enrollments" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#1d4ed8"
                            strokeWidth={2.5}
                            fill="url(#revGrad)"
                        />
                    </AreaChart>
                )}
            </DashboardChartContainer>
        </article>
    );
}
