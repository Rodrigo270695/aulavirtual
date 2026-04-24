import { Star, Users } from 'lucide-react';
import { featuredCourses } from '@/components/landing/landing-data';
import type { PlatformSettings } from '@/types/platform';

type LandingCourseGridProps = {
    platform: PlatformSettings;
};

export function LandingCourseGrid({ platform }: LandingCourseGridProps) {
    return (
        <section id="cursos" className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Cursos destacados</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Descubre cursos populares y empieza hoy mismo.
                    </p>
                </div>
                <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    Ver todos
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {featuredCourses.map((course) => (
                    <article
                        key={course.title}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div
                            className="h-28"
                            style={{ background: `linear-gradient(135deg, ${platform.login_bg_from} 0%, ${platform.login_bg_to} 100%)` }}
                        />
                        <div className="p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <span
                                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                                    style={{ background: `${platform.color_primary}15`, color: platform.color_primary }}
                                >
                                    {course.category}
                                </span>
                                {course.bestseller ? (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        Mas vendido
                                    </span>
                                ) : null}
                            </div>

                            <h3 className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-slate-900">
                                {course.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Por {course.instructor} · {course.level}
                            </p>

                            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                    {course.rating.toFixed(1)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="size-3.5" />
                                    {course.students.toLocaleString('es-ES')}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-lg font-bold text-slate-900">{course.price}</span>
                                <span className="text-xs text-slate-400 line-through">{course.originalPrice}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
