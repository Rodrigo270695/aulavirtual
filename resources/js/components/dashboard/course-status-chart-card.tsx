import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardChartContainer } from '@/components/dashboard/chart-container';
import type { CourseStatusPoint } from '@/components/dashboard/types';

const statusChartColors = ['#2563eb', '#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];

interface Props {
    items: CourseStatusPoint[];
}

export function DashboardCourseStatusChartCard({ items }: Props) {
    return (
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Estado de cursos</h2>
            <p className="mb-4 text-xs text-slate-500">Distribución por workflow editorial</p>
            <DashboardChartContainer className="h-72 min-w-0" minHeight={240}>
                {(size) => (
                    <BarChart width={size.width} height={size.height} data={items} layout="vertical" margin={{ left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="label" type="category" stroke="#64748b" fontSize={12} width={90} />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                            formatter={(value: number) => [value.toLocaleString('es-PE'), 'Cursos']}
                        />
                        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                            {items.map((entry, idx) => (
                                <Cell key={entry.status} fill={statusChartColors[idx % statusChartColors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                )}
            </DashboardChartContainer>
        </article>
    );
}
