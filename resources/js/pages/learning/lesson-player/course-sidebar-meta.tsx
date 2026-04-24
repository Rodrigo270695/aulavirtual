import { BookOpen, GraduationCap } from 'lucide-react';
import type { LearningEnrollment, PlatformColors } from './types';

type Props = {
    enrollment: LearningEnrollment;
    pct: number;
    courseProgressPct: number;
    platform: PlatformColors;
};

export function CourseSidebarMeta({ enrollment, pct, courseProgressPct, platform }: Props) {
    return (
        <>
            {enrollment.course.cover_image_url ? (
                <img
                    src={enrollment.course.cover_image_url}
                    alt=""
                    className="mb-4 aspect-video w-full rounded-xl object-cover ring-1 ring-slate-200/80"
                />
            ) : (
                <div
                    className="relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl ring-1 ring-slate-200/80"
                    aria-hidden
                >
                    <div
                        className="absolute inset-0 opacity-[0.12]"
                        style={{
                            background: `linear-gradient(135deg, ${platform.color_primary}, ${platform.color_accent})`,
                        }}
                    />
                    <BookOpen className="relative size-11 text-slate-400 drop-shadow-sm" />
                </div>
            )}
            <h1 className="text-base font-bold leading-snug tracking-tight text-slate-900">{enrollment.course.title}</h1>
            <p className="mt-2 flex items-start gap-2 text-sm leading-snug text-slate-600">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200/70">
                    <GraduationCap className="size-3.5 text-slate-500" aria-hidden />
                </span>
                <span>
                    {enrollment.course.instructor.name ? (
                        <>
                            <span className="font-medium text-slate-800">{enrollment.course.instructor.name}</span>
                            <span className="block text-xs text-slate-500">Instructor del curso</span>
                        </>
                    ) : (
                        <span className="text-slate-500">Curso en línea</span>
                    )}
                </span>
            </p>
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 ring-1 ring-slate-100/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Tu progreso</span>
                    <span className="tabular-nums text-slate-900">{Math.round(courseProgressPct)}%</span>
                </div>
                <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-200/60">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                        }}
                    />
                </div>
            </div>
        </>
    );
}
