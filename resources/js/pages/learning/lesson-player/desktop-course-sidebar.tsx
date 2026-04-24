import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseSidebarMeta } from './course-sidebar-meta';
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
    onSelectLesson: (lessonId: string) => void;
    showCourseReviewLink?: boolean;
    onOpenCourseReview?: () => void;
};

export function DesktopCourseSidebar({
    enrollment,
    platform,
    pct,
    courseProgressPct,
    modules,
    activeLessonId,
    lessonProgressMap,
    onSelectLesson,
    showCourseReviewLink = false,
    onOpenCourseReview,
}: Props) {
    return (
        <aside className="relative hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-300/25 backdrop-blur-sm lg:flex">
            <div
                className="absolute inset-x-0 top-0 z-1 h-1 rounded-t-2xl"
                style={{
                    background: `linear-gradient(90deg, ${platform.color_primary}, ${platform.color_accent})`,
                }}
                aria-hidden
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-5 sm:px-5">
                <div className="shrink-0">
                    <CourseSidebarMeta
                        enrollment={enrollment}
                        pct={pct}
                        courseProgressPct={courseProgressPct}
                        platform={platform}
                    />
                    {showCourseReviewLink && onOpenCourseReview ? (
                        <div className="mt-4 rounded-xl border border-amber-100/90 bg-amber-50/50 px-3 py-2.5">
                            <p className="text-xs font-medium text-slate-700">¿Te gustó el curso?</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full gap-1.5 border-amber-200/80 bg-white/90 text-amber-900 hover:bg-amber-50/90"
                                onClick={onOpenCourseReview}
                            >
                                <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />
                                Valorar curso
                            </Button>
                        </div>
                    ) : null}
                </div>
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain border-t border-slate-100/90 pt-4 pr-1">
                    <LessonModulesNav
                        modules={modules}
                        activeLessonId={activeLessonId}
                        lessonProgressMap={lessonProgressMap}
                        platform={platform}
                        onSelectLesson={onSelectLesson}
                    />
                </div>
            </div>
        </aside>
    );
}
