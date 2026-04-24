import { Head, Link } from '@inertiajs/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Award, BookOpen } from 'lucide-react';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { appToastQueue } from '@/lib/app-toast-queue';
import { usePlatform } from '@/hooks/use-platform';
import learning from '@/routes/learning';
import { DesktopCourseSidebar } from './desktop-course-sidebar';
import { LessonArticle } from './lesson-article';
import { LessonCurrentStrip } from './lesson-current-strip';
import { LessonMaterials } from './lesson-materials';
import { LessonPlayerBackground } from './lesson-player-background';
import { LessonPlayerTopBar } from './lesson-player-top-bar';
import { CourseReviewModal } from './course-review-modal';
import { CourseReviewPromptBanner } from './course-review-prompt-banner';
import type { LessonPlayerPageProps, LessonProgress, StudentQuizSessionPatch } from './types';

export default function LessonPlayerPage({ enrollment, modules, initialLessonId = '' }: LessonPlayerPageProps) {
    const platform = usePlatform();
    const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
    const fallbackLessonId = allLessons[0]?.id ?? '';
    const [activeLessonId, setActiveLessonId] = useState(initialLessonId || fallbackLessonId);
    /** Intentos del cuestionario tras enviar en cliente; `modules` de Inertia no se actualiza al cambiar de lección. */
    const [quizSessionByLessonId, setQuizSessionByLessonId] = useState<Record<string, StudentQuizSessionPatch>>({});
    const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [courseProgressPct, setCourseProgressPct] = useState(enrollment.progress_pct);
    const [hasCourseReview, setHasCourseReview] = useState(enrollment.review.has_review);
    const [hasCertificate, setHasCertificate] = useState(enrollment.certificate.has_certificate);
    const [reviewBannerDismissed, setReviewBannerDismissed] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const reviewModalAutoOpenedRef = useRef(false);

    // No usar solo `enrollment.review.eligible`: viene del SSR y no cambia al completar
    // lecciones en esta sesión; `courseProgressPct` sí se actualiza con cada guardado.
    const reviewEligibleByProgress = courseProgressPct >= 99.5;
    const canOfferReview =
        enrollment.review.can_create && reviewEligibleByProgress && !hasCourseReview;
    const showReviewBanner = canOfferReview && !reviewBannerDismissed;
    const canOfferCertificate = reviewEligibleByProgress;
    const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, LessonProgress>>(() => {
        const map: Record<string, LessonProgress> = {};
        for (const mod of modules) {
            for (const lesson of mod.lessons) {
                map[lesson.id] = lesson.progress;
            }
        }
        return map;
    });

    const activeLessonBase =
        useMemo(() => allLessons.find((lesson) => lesson.id === activeLessonId) ?? allLessons[0] ?? null, [
            allLessons,
            activeLessonId,
        ]);

    const activeLesson = useMemo(() => {
        if (!activeLessonBase?.quiz) {
            return activeLessonBase;
        }
        const patch = quizSessionByLessonId[activeLessonBase.id];
        if (!patch) {
            return activeLessonBase;
        }
        return { ...activeLessonBase, quiz: { ...activeLessonBase.quiz, ...patch } };
    }, [activeLessonBase, quizSessionByLessonId]);

    const handleQuizSessionChange = useCallback((lessonId: string, patch: StudentQuizSessionPatch) => {
        setQuizSessionByLessonId((prev) => ({
            ...prev,
            [lessonId]: { ...(prev[lessonId] ?? {}), ...patch },
        }));
    }, []);
    const activeProgress = activeLesson ? (lessonProgressMap[activeLesson.id] ?? activeLesson.progress) : null;
    const activeLessonNumber = useMemo(() => {
        if (!activeLesson) {
            return null;
        }
        const i = allLessons.findIndex((l) => l.id === activeLesson.id);
        return i >= 0 ? i + 1 : null;
    }, [activeLesson, allLessons]);
    const lessonTotal = allLessons.length;

    const saveProgress = useCallback(
        async (
            payload: {
                lessonId: string;
                status?: 'not_started' | 'in_progress' | 'completed';
                videoPositionSec?: number;
                watchPct?: number;
            },
            options: { silent?: boolean } = {},
        ) => {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) {
                appToastQueue.add(
                    { title: 'No se encontró el token de seguridad. Recarga la página.', variant: 'danger' },
                    { timeout: 6000 },
                );
                return false;
            }

            setSaving(true);
            try {
                const res = await fetch(learning.lessons.progress.upsert.url(), {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        enrollment_id: enrollment.id,
                        lesson_id: payload.lessonId,
                        status: payload.status,
                        video_position_sec: payload.videoPositionSec ?? 0,
                        watch_pct: payload.watchPct ?? 0,
                    }),
                });

                const body = (await res.json().catch(() => ({}))) as {
                    ok?: boolean;
                    message?: string;
                    data?: {
                        status: LessonProgress['status'];
                        watch_pct: number;
                        video_position_sec: number;
                        completed_at: string | null;
                        enrollment_progress_pct: number;
                        show_course_review_modal?: boolean;
                        can_offer_course_review?: boolean;
                        has_certificate?: boolean;
                    };
                    errors?: Record<string, string[]>;
                };

                if (!res.ok) {
                    const msg =
                        typeof body.message === 'string'
                            ? body.message
                            : body.errors
                              ? Object.values(body.errors).flat().join(' ')
                              : `Error al guardar (${res.status})`;
                    appToastQueue.add({ title: msg, variant: 'danger' }, { timeout: 6000 });
                    return false;
                }

                if (body.data) {
                    setLessonProgressMap((prev) => ({
                        ...prev,
                        [payload.lessonId]: {
                            status: body.data!.status,
                            watch_pct: body.data!.watch_pct,
                            video_position_sec: body.data!.video_position_sec,
                            completed_at: body.data!.completed_at,
                        },
                    }));
                    setCourseProgressPct(body.data.enrollment_progress_pct);
                    if (typeof body.data.has_certificate === 'boolean') {
                        setHasCertificate(body.data.has_certificate);
                    }
                    if (
                        body.data.show_course_review_modal &&
                        body.data.can_offer_course_review &&
                        !reviewModalAutoOpenedRef.current
                    ) {
                        reviewModalAutoOpenedRef.current = true;
                        setReviewModalOpen(true);
                    }
                }

                if (!options.silent && payload.status === 'completed') {
                    appToastQueue.add({ title: 'Lección marcada como completada.', variant: 'success' }, { timeout: 4000 });
                }
                return true;
            } catch {
                appToastQueue.add(
                    { title: 'No se pudo guardar el progreso. Comprueba tu conexión.', variant: 'danger' },
                    { timeout: 6000 },
                );
                return false;
            } finally {
                setSaving(false);
            }
        },
        [enrollment.id],
    );

    const handleSelectLesson = useCallback(
        (lessonId: string) => {
            setMobileOutlineOpen(false);
            setActiveLessonId(lessonId);
            const lesson = allLessons.find((l) => l.id === lessonId);
            if (!lesson) {
                return;
            }
            const p = lessonProgressMap[lessonId] ?? lesson.progress;
            if (p.status === 'completed') {
                return;
            }
            void saveProgress({ lessonId, status: 'in_progress' }, { silent: true });
        },
        [allLessons, lessonProgressMap, saveProgress],
    );

    const pct = Math.min(100, Math.max(0, courseProgressPct));

    return (
        <MarketplaceShell title={enrollment.course.title}>
            <Head
                title={
                    activeLesson
                        ? `${activeLesson.title} · ${enrollment.course.title}`
                        : enrollment.course.title
                }
            />
            <main className="fixed inset-x-0 bottom-0 left-0 right-0 top-14 z-0 flex flex-col overflow-hidden sm:top-16">
                <LessonPlayerBackground platform={platform} />

                <div className="relative z-1 mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3">
                    <LessonPlayerTopBar
                        enrollment={enrollment}
                        platform={platform}
                        pct={pct}
                        courseProgressPct={courseProgressPct}
                        modules={modules}
                        activeLessonId={activeLessonId}
                        lessonProgressMap={lessonProgressMap}
                        mobileOutlineOpen={mobileOutlineOpen}
                        onMobileOutlineOpenChange={setMobileOutlineOpen}
                        onSelectLesson={handleSelectLesson}
                        showCourseReviewLink={canOfferReview}
                        onOpenCourseReview={() => setReviewModalOpen(true)}
                    />

                    {showReviewBanner ? (
                        <div className="mb-3 shrink-0">
                            <CourseReviewPromptBanner
                                courseTitle={enrollment.course.title}
                                onOpen={() => setReviewModalOpen(true)}
                                onDismiss={() => setReviewBannerDismissed(true)}
                            />
                        </div>
                    ) : null}

                    {canOfferCertificate ? (
                        <div className="mb-3 shrink-0 rounded-xl border border-blue-200/80 bg-linear-to-r from-blue-50/90 to-indigo-50/70 px-4 py-3 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-2.5">
                                    <Award className="mt-0.5 size-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Certificado disponible</p>
                                        <p className="text-xs text-slate-600">
                                            {hasCertificate
                                                ? 'Tu certificado ya fue generado. Puedes verlo y descargarlo.'
                                                : 'Completaste el curso. Genera tu certificado ahora.'}
                                        </p>
                                    </div>
                                </div>
                                {hasCertificate ? (
                                    <Link
                                        href={enrollment.certificate.show_url}
                                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                        Ver certificado
                                    </Link>
                                ) : (
                                    <Link
                                        as="button"
                                        method="post"
                                        href={enrollment.certificate.generate_url}
                                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                        Generar certificado
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : null}

                    <LessonCurrentStrip lesson={activeLesson} />

                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-6">
                        <DesktopCourseSidebar
                            enrollment={enrollment}
                            platform={platform}
                            pct={pct}
                            courseProgressPct={courseProgressPct}
                            modules={modules}
                            activeLessonId={activeLessonId}
                            lessonProgressMap={lessonProgressMap}
                            onSelectLesson={handleSelectLesson}
                            showCourseReviewLink={canOfferReview}
                            onOpenCourseReview={() => setReviewModalOpen(true)}
                        />

                        <div className="min-h-0 min-w-0 space-y-6 overflow-y-auto overscroll-y-contain pb-6 pr-0.5 [scrollbar-gutter:stable]">
                            {activeLesson ? (
                                <>
                                    <LessonArticle
                                        enrollmentId={enrollment.id}
                                        lesson={activeLesson}
                                        onQuizSessionChange={handleQuizSessionChange}
                                        activeProgress={activeProgress}
                                        activeLessonNumber={activeLessonNumber}
                                        lessonTotal={lessonTotal}
                                        saving={saving}
                                        platform={platform}
                                        onMarkComplete={() =>
                                            void saveProgress(
                                                {
                                                    lessonId: activeLesson.id,
                                                    status: 'completed',
                                                    watchPct: 100,
                                                },
                                                { silent: false },
                                            )
                                        }
                                    />
                                    <LessonMaterials lesson={activeLesson} platform={platform} />
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white/90 p-12 text-center shadow-lg shadow-slate-200/30 backdrop-blur-sm">
                                    <BookOpen className="mx-auto size-12 text-slate-200" aria-hidden />
                                    <p className="mt-4 text-base font-semibold text-slate-700">Curso sin lecciones visibles</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Este curso aún no tiene lecciones publicadas. Vuelve más tarde o revisa Mi
                                        aprendizaje.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <CourseReviewModal
                open={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                enrollmentId={enrollment.id}
                courseTitle={enrollment.course.title}
                onSubmitted={() => setHasCourseReview(true)}
            />
        </MarketplaceShell>
    );
}
