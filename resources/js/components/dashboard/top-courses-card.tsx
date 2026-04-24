import { Star, Users } from 'lucide-react';
import type { TopCourse } from '@/components/dashboard/types';
import { formatCurrency } from '@/components/dashboard/formatters';

interface Props {
    items: TopCourse[];
}

export function DashboardTopCoursesCard({ items }: Props) {
    const maxStudents = Math.max(items[0]?.students ?? 1, 1);

    return (
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Top cursos</h2>
                <p className="text-xs text-slate-500">Por estudiantes y rating acumulado</p>
            </div>
            <div className="divide-y divide-slate-100">
                {items.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-slate-500">No hay cursos con datos todavía.</p>
                ) : (
                    items.map((course) => (
                        <div key={course.id} className="px-5 py-3.5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-slate-900">{course.title}</p>
                                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="size-3" />
                                            {course.students.toLocaleString('es-PE')}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-amber-600">
                                            <Star className="size-3 fill-amber-400" />
                                            {course.rating.toFixed(1)}
                                        </span>
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                            {course.status_label}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-800">
                                    {formatCurrency(course.estimated_revenue, course.currency)}
                                </p>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                    style={{ width: `${Math.min((course.students / maxStudents) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </article>
    );
}
