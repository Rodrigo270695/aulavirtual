import { Award, GraduationCap, Users } from 'lucide-react';
import { CourseRatingInline } from '@/components/marketplace/course-rating-inline';
import type { PlatformSettings } from '@/types/platform';
import type { PublicInstructor } from '@/types/public';

type PublicInstructorStripProps = {
    platform: PlatformSettings;
    instructors: PublicInstructor[];
};

export function PublicInstructorStrip({ platform, instructors }: PublicInstructorStripProps) {
    if (instructors.length === 0) {
        return null;
    }

    return (
        <section
            id="docentes"
            className="relative border-t border-slate-200/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-14 text-slate-100 sm:py-16"
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${platform.color_primary}55 0%, transparent 55%)`,
                }}
                aria-hidden
            />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300">
                        <Award className="size-3.5 text-amber-400/90" aria-hidden />
                        Talento docente
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        Docentes destacados
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
                        Perfiles con mejor valoración y alto impacto en estudiantes inscritos.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {instructors.map((instructor) => (
                        <article
                            key={instructor.id}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
                        >
                            <div
                                className="absolute inset-x-0 top-0 h-1 opacity-90 transition-opacity group-hover:opacity-100"
                                style={{
                                    background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                                }}
                            />
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg ring-2 ring-white/10"
                                    style={{
                                        background: `linear-gradient(135deg, ${platform.color_primary}dd, ${platform.color_accent}dd)`,
                                    }}
                                >
                                    {initials(instructor.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-base font-bold text-white">{instructor.name}</h3>
                                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                                        {instructor.professional_title}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm text-slate-300">
                                <p className="flex flex-wrap items-center gap-2">
                                    <CourseRatingInline
                                        avgRating={instructor.avg_rating}
                                        showReviewsCount={false}
                                        tone="inverse"
                                    />
                                    <span className="text-slate-500">valoración</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users className="size-4 shrink-0 text-slate-500" aria-hidden />
                                    {instructor.total_students.toLocaleString('es-ES')}{' '}
                                    <span className="text-slate-500">estudiantes</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <GraduationCap className="size-4 shrink-0 text-slate-500" aria-hidden />
                                    {instructor.published_courses_count}{' '}
                                    <span className="text-slate-500">cursos publicados</span>
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

    if (parts.length === 0) {
        return 'NA';
    }

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}
