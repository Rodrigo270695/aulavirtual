import { useId } from 'react';
import { Menu, Star, X } from 'lucide-react';
import { MobileMenuAnimStack } from '@/components/mobile-menu-anim-stack';
import { Button } from '@/components/ui/button';
import { LearningBreadcrumbNav } from './learning-breadcrumb-nav';
import { LessonModulesNav } from './lesson-modules-nav';
import type { LearningEnrollment, LessonProgress, ModuleItem, PlatformColors } from './types';

type Props = {
    enrollment: LearningEnrollment;
    platform: PlatformColors;
    pct: number;
    courseProgressPct: number;
    modules: ModuleItem[];
    activeLessonId: string;
    lessonProgressMap: Record<string, LessonProgress>;
    mobileOutlineOpen: boolean;
    onMobileOutlineOpenChange: (open: boolean) => void;
    onSelectLesson: (lessonId: string) => void;
    showCourseReviewLink?: boolean;
    onOpenCourseReview?: () => void;
};

export function LessonPlayerTopBar({
    enrollment,
    platform,
    pct,
    courseProgressPct,
    modules,
    activeLessonId,
    lessonProgressMap,
    mobileOutlineOpen,
    onMobileOutlineOpenChange,
    onSelectLesson,
    showCourseReviewLink = false,
    onOpenCourseReview,
}: Props) {
    const lessonsPanelTitleId = useId();

    return (
        <div className="shrink-0 pb-2 sm:pb-3">
            <div className="flex overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-md supports-backdrop-filter:bg-white/75 backdrop-blur-md lg:hidden">
                <Button
                    type="button"
                    variant="ghost"
                    className="h-auto min-h-13 w-[3.35rem] shrink-0 flex-col gap-0.5 rounded-none border-0 border-r border-slate-200/80 bg-slate-50/95 px-0 py-2 text-slate-700 hover:bg-slate-100/90 lg:hidden"
                    aria-label="Abrir índice de lecciones del curso"
                    aria-expanded={mobileOutlineOpen}
                    onClick={() => onMobileOutlineOpenChange(true)}
                >
                    <Menu className="size-[1.2rem]" strokeWidth={2.25} aria-hidden />
                    <span className="text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-500">
                        Índice
                    </span>
                </Button>
                <LearningBreadcrumbNav
                    enrollment={enrollment}
                    className="min-w-0 flex-1 border-0 bg-transparent shadow-none"
                />
            </div>

            <MobileMenuAnimStack
                open={mobileOutlineOpen}
                onRequestClose={() => onMobileOutlineOpenChange(false)}
                panelClassName="fixed left-3 right-3 top-[calc(3.75rem+10px)] z-45 flex max-h-[min(calc(100dvh-5rem),88dvh)] flex-col overflow-hidden rounded-2xl border border-slate-200/95 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_24px_64px_-12px_rgba(15,23,42,0.42)] ring-1 ring-slate-900/8 sm:left-4 sm:right-4 sm:top-[calc(4rem+12px)]"
                panelProps={{
                    role: 'dialog',
                    'aria-modal': true,
                    'aria-labelledby': lessonsPanelTitleId,
                    'aria-describedby': `${lessonsPanelTitleId}-desc`,
                }}
            >
                <div className="pointer-events-none mx-auto mb-2 mt-3 flex w-full max-w-12 justify-center" aria-hidden>
                    <span className="h-1 w-10 rounded-full bg-slate-300/90" />
                </div>
                <p className="mb-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Índice del curso
                </p>
                <h2
                    id={lessonsPanelTitleId}
                    className="mb-4 px-12 text-center text-base font-bold leading-snug text-slate-900"
                >
                    {enrollment.course.title}
                </h2>
                <p id={`${lessonsPanelTitleId}-desc`} className="sr-only">
                    Navega por los módulos y elige una lección para ver vídeo y materiales en la pantalla principal.
                </p>

                <button
                    type="button"
                    className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-200/90"
                    aria-label="Cerrar"
                    onClick={() => onMobileOutlineOpenChange(false)}
                >
                    <X className="size-4" aria-hidden />
                </button>

                <div
                    className="h-1 w-full shrink-0"
                    style={{
                        background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                    }}
                    aria-hidden
                />
                <div className="space-y-2 border-b border-slate-200/80 bg-slate-50/50 px-4 pb-4 pt-4 text-left">
                    <p className="text-left text-sm font-semibold text-slate-600">Tu progreso en el curso</p>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Avance</span>
                        <span className="tabular-nums text-slate-900">{Math.round(courseProgressPct)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                            }}
                        />
                    </div>
                    {showCourseReviewLink && onOpenCourseReview ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full gap-1.5 border-amber-200/90 bg-white text-amber-900 hover:bg-amber-50/80"
                            onClick={() => {
                                onOpenCourseReview();
                                onMobileOutlineOpenChange(false);
                            }}
                        >
                            <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />
                            Valorar curso
                        </Button>
                    ) : null}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3">
                    <LessonModulesNav
                        modules={modules}
                        activeLessonId={activeLessonId}
                        lessonProgressMap={lessonProgressMap}
                        platform={platform}
                        onSelectLesson={onSelectLesson}
                    />
                </div>
            </MobileMenuAnimStack>

            <div className="mt-2 hidden lg:block">
                <LearningBreadcrumbNav
                    enrollment={enrollment}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 p-1.5 shadow-md shadow-slate-200/30 backdrop-blur-md supports-backdrop-filter:bg-white/55"
                />
            </div>
        </div>
    );
}
