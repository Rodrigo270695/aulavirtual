import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, CircleAlert, Clock, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appToastQueue } from '@/lib/app-toast-queue';
import { cn } from '@/lib/utils';
import learning from '@/routes/learning';
import type {
    StudentQuiz,
    StudentQuizActiveTimedAttempt,
    StudentQuizAttempt,
    StudentQuizQuestion,
    StudentQuizSessionPatch,
} from './types';

type QuizQuestionResult = {
    question_id: string;
    correct: boolean | null;
    points_earned: number;
    points_possible: number;
    correct_option_ids: string[];
    selected_option_ids: string[];
    note?: string;
};

type SubmitPayload = {
    score_pct: number;
    is_passed: boolean;
    passing_score: number;
    obtained_points: number;
    total_points: number;
    attempt_number: number;
    submitted_at?: string;
    questions: QuizQuestionResult[];
};

type Props = {
    enrollmentId: string;
    lessonId: string;
    quiz: StudentQuiz;
    onQuizSessionChange?: (lessonId: string, patch: StudentQuizSessionPatch) => void;
};

function sortedQuestions(questions: StudentQuizQuestion[]): StudentQuizQuestion[] {
    return [...questions].sort((a, b) => a.sort_order - b.sort_order || a.question_text.localeCompare(b.question_text));
}

function formatAttemptAt(iso: string | null): string {
    if (!iso) {
        return '—';
    }
    try {
        return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

function draftStorageKey(enrollmentId: string, lessonId: string, quizId: string, attemptId: string): string {
    return `aulavirtual.quizDraft:${enrollmentId}:${lessonId}:${quizId}:${attemptId}`;
}

function openDraftStorageKey(enrollmentId: string, lessonId: string, quizId: string): string {
    return `aulavirtual.quizDraft:${enrollmentId}:${lessonId}:${quizId}:open`;
}

function formatCountdown(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function isPerfectQuizScore(scorePct: number): boolean {
    return scorePct + 1e-6 >= 100;
}

function showAttemptReviewButton(q: StudentQuiz, attempt: StudentQuizAttempt): boolean {
    if (q.show_answers_after === 'never') {
        return false;
    }
    if (q.show_answers_after === 'passed') {
        return isPerfectQuizScore(attempt.score_pct);
    }
    return true;
}

export function LessonQuizPanel({ enrollmentId, lessonId, quiz, onQuizSessionChange }: Props) {
    const ordered = useMemo(() => sortedQuestions(quiz.questions), [quiz.questions]);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [submitting, setSubmitting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [result, setResult] = useState<SubmitPayload | null>(null);
    const [attemptsUsed, setAttemptsUsed] = useState(quiz.attempts_used);
    const [attemptsLog, setAttemptsLog] = useState<StudentQuizAttempt[]>(() => [...quiz.attempts]);
    const [revealedAttemptNumber, setRevealedAttemptNumber] = useState<number | null>(null);
    const [revealedQuestions, setRevealedQuestions] = useState<QuizQuestionResult[] | null>(null);
    const [reviewLoading, setReviewLoading] = useState<number | null>(null);
    const reviewBusyRef = useRef(false);
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
    const autoSubmitFiredRef = useRef(false);

    const hasTimedLimit = (quiz.time_limit_minutes ?? 0) > 0;
    const activeTimed = quiz.active_timed_attempt;

    const quizSessionFingerprint = useMemo(
        () =>
            `${quiz.id}:${quiz.attempts_used}:${quiz.can_submit}:${quiz.has_passed}:${quiz.passing_score}:${quiz.best_score_pct}:${quiz.has_perfect_score}:${quiz.show_answers_after}:${quiz.active_timed_attempt?.id ?? ''}:${quiz.attempts
                .map((a) => `${a.attempt_number}:${a.score_pct}:${a.submitted_at ?? ''}`)
                .join(';')}`,
        [
            quiz.id,
            quiz.attempts_used,
            quiz.can_submit,
            quiz.has_passed,
            quiz.passing_score,
            quiz.best_score_pct,
            quiz.has_perfect_score,
            quiz.show_answers_after,
            quiz.active_timed_attempt,
            quiz.attempts,
        ],
    );

    useEffect(() => {
        setAttemptsUsed(quiz.attempts_used);
        setAttemptsLog([...quiz.attempts]);
        setRevealedAttemptNumber(null);
        setRevealedQuestions(null);
    }, [quizSessionFingerprint]);

    /** Solo limpiar respuestas al cambiar de lección, no en el primer montaje (volver al cuestionario debe restaurar borrador). */
    const prevLessonIdRef = useRef<string | null>(null);
    useLayoutEffect(() => {
        const prev = prevLessonIdRef.current;
        if (prev !== null && prev !== lessonId) {
            setResult(null);
            setAnswers({});
            autoSubmitFiredRef.current = false;
        }
        prevLessonIdRef.current = lessonId;
    }, [lessonId]);

    const hideQuestionnaire = quiz.has_perfect_score || (quiz.is_active && !quiz.can_submit);

    const timedReady = !hasTimedLimit || Boolean(activeTimed);
    const timeExpired =
        hasTimedLimit && activeTimed !== null && secondsRemaining !== null && secondsRemaining <= 0 && !result;

    const canFillForm = quiz.is_active && quiz.can_submit && timedReady;

    const inputsLocked =
        !canFillForm ||
        result !== null ||
        hideQuestionnaire ||
        (hasTimedLimit && Boolean(activeTimed) && secondsRemaining !== null && secondsRemaining <= 0 && !result);

    const quizDraftKey = useMemo(() => {
        if (hideQuestionnaire || result !== null) {
            return null;
        }
        if (hasTimedLimit) {
            if (!activeTimed?.id) {
                return null;
            }
            return draftStorageKey(enrollmentId, lessonId, quiz.id, activeTimed.id);
        }
        return openDraftStorageKey(enrollmentId, lessonId, quiz.id);
    }, [
        hideQuestionnaire,
        result,
        hasTimedLimit,
        activeTimed?.id,
        enrollmentId,
        lessonId,
        quiz.id,
    ]);

    useLayoutEffect(() => {
        if (!quizDraftKey) {
            return;
        }
        try {
            const raw = localStorage.getItem(quizDraftKey);
            if (!raw) {
                return;
            }
            const parsed = JSON.parse(raw) as { attemptId?: string | null; answers?: Record<string, string | string[]> };
            if (hasTimedLimit && activeTimed?.id && parsed.attemptId != null && parsed.attemptId !== activeTimed.id) {
                return;
            }
            if (parsed.answers && typeof parsed.answers === 'object') {
                setAnswers(parsed.answers);
            }
        } catch {
            /* ignore */
        }
    }, [quizDraftKey, hasTimedLimit, activeTimed?.id]);

    useEffect(() => {
        if (!activeTimed?.deadline_at) {
            setSecondsRemaining(null);
            return;
        }
        const tick = (): void => {
            const end = new Date(activeTimed.deadline_at).getTime();
            setSecondsRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [activeTimed?.deadline_at]);

    useEffect(() => {
        if (!quizDraftKey) {
            return;
        }
        if (Object.keys(answers).length === 0) {
            return;
        }
        try {
            localStorage.setItem(
                quizDraftKey,
                JSON.stringify({
                    attemptId: activeTimed?.id ?? null,
                    answers,
                    savedAt: Date.now(),
                }),
            );
        } catch {
            /* ignore */
        }
    }, [answers, quizDraftKey, activeTimed?.id]);

    const attemptsRemainingLabel = useMemo(() => {
        if (quiz.max_attempts <= 0) {
            return 'Intentos ilimitados';
        }
        const left = Math.max(0, quiz.max_attempts - attemptsUsed);
        return `${left} intento${left === 1 ? '' : 's'} disponible${left === 1 ? '' : 's'}`;
    }, [quiz.max_attempts, attemptsUsed]);

    const revealedByQuestion = useMemo(() => {
        if (!revealedQuestions?.length) {
            return new Map<string, QuizQuestionResult>();
        }
        return new Map(revealedQuestions.map((q) => [q.question_id, q]));
    }, [revealedQuestions]);

    const loadAttemptReview = useCallback(
        async (attemptNumber: number) => {
            if (reviewBusyRef.current) {
                return;
            }
            reviewBusyRef.current = true;
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) {
                appToastQueue.add({ title: 'Recarga la página e inténtalo de nuevo.', variant: 'danger' }, { timeout: 5000 });
                reviewBusyRef.current = false;
                return;
            }
            setReviewLoading(attemptNumber);
            try {
                const res = await fetch(
                    learning.lessons.quiz.attemptReview.url({
                        enrollment: enrollmentId,
                        lesson: lessonId,
                        attempt_number: attemptNumber,
                    }),
                    {
                        method: 'GET',
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': token,
                        },
                    },
                );
                const body = (await res.json().catch(() => ({}))) as {
                    ok?: boolean;
                    message?: string;
                    data?: { questions: QuizQuestionResult[] };
                };
                if (!res.ok || !body.ok || !body.data?.questions) {
                    const msg = typeof body.message === 'string' ? body.message : 'No se pudieron cargar las respuestas.';
                    appToastQueue.add({ title: msg, variant: 'danger' }, { timeout: 7000 });
                    return;
                }
                setRevealedAttemptNumber(attemptNumber);
                setRevealedQuestions(body.data.questions);
            } catch {
                appToastQueue.add({ title: 'Error de red al cargar las respuestas.', variant: 'danger' }, { timeout: 6000 });
            } finally {
                setReviewLoading(null);
                reviewBusyRef.current = false;
            }
        },
        [enrollmentId, lessonId],
    );

    const setSingle = useCallback((questionId: string, optionId: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }, []);

    const toggleMulti = useCallback((questionId: string, optionId: string) => {
        setAnswers((prev) => {
            const cur = prev[questionId];
            const list = Array.isArray(cur) ? [...cur] : [];
            const i = list.indexOf(optionId);
            if (i >= 0) {
                list.splice(i, 1);
            } else {
                list.push(optionId);
            }
            return { ...prev, [questionId]: list };
        });
    }, []);

    const clearQuizDraftStorage = useCallback(() => {
        try {
            if (activeTimed?.id) {
                localStorage.removeItem(draftStorageKey(enrollmentId, lessonId, quiz.id, activeTimed.id));
            }
            localStorage.removeItem(openDraftStorageKey(enrollmentId, lessonId, quiz.id));
        } catch {
            /* ignore */
        }
    }, [activeTimed?.id, enrollmentId, lessonId, quiz.id]);

    const applySessionPatch = useCallback(
        (patch: StudentQuizSessionPatch) => {
            if (patch.attempts_used !== undefined) {
                setAttemptsUsed(patch.attempts_used);
            }
            if (patch.attempts !== undefined) {
                setAttemptsLog([...patch.attempts]);
            }
            onQuizSessionChange?.(lessonId, patch);
        },
        [lessonId, onQuizSessionChange],
    );

    const startTimedAttempt = useCallback(async () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            appToastQueue.add({ title: 'Recarga la página e inténtalo de nuevo.', variant: 'danger' }, { timeout: 5000 });
            return false;
        }
        setStarting(true);
        try {
            const res = await fetch(learning.lessons.quiz.start.url({ enrollment: enrollmentId, lesson: lessonId }), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({}),
            });
            const body = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                message?: string;
                data?: {
                    attempt_id: string;
                    attempt_number: number;
                    started_at: string;
                    deadline_at: string;
                };
            };
            if (!res.ok || !body.ok || !body.data) {
                const msg = typeof body.message === 'string' ? body.message : `No se pudo comenzar (${res.status})`;
                appToastQueue.add({ title: msg, variant: 'danger' }, { timeout: 6000 });
                return false;
            }
            const d = body.data;
            const active: StudentQuizActiveTimedAttempt = {
                id: d.attempt_id,
                attempt_number: d.attempt_number,
                started_at: d.started_at,
                deadline_at: d.deadline_at,
            };
            applySessionPatch({ active_timed_attempt: active });
            autoSubmitFiredRef.current = false;
            return true;
        } catch {
            appToastQueue.add({ title: 'Error de red al iniciar el intento.', variant: 'danger' }, { timeout: 6000 });
            return false;
        } finally {
            setStarting(false);
        }
    }, [applySessionPatch, enrollmentId, lessonId]);

    const submit = useCallback(
        async (opts?: { allowAfterTimeout?: boolean }) => {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) {
                appToastQueue.add({ title: 'Recarga la página e inténtalo de nuevo.', variant: 'danger' }, { timeout: 5000 });
                return;
            }
            if (!quiz.is_active || !quiz.can_submit) {
                return;
            }
            if (hasTimedLimit) {
                if (!activeTimed) {
                    return;
                }
                const deadlineMs = new Date(activeTimed.deadline_at).getTime();
                if (!opts?.allowAfterTimeout && Date.now() > deadlineMs + 90_000) {
                    appToastQueue.add(
                        { title: 'El tiempo del intento ha finalizado. Pulsa «Comenzar» para un nuevo intento.', variant: 'danger' },
                        { timeout: 7000 },
                    );
                    return;
                }
            }

            setSubmitting(true);
            try {
                const payload: Record<string, unknown> = { answers };
                if (hasTimedLimit && activeTimed) {
                    payload.attempt_id = activeTimed.id;
                }
                const res = await fetch(learning.lessons.quiz.submit.url({ enrollment: enrollmentId, lesson: lessonId }), {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                });
                const body = (await res.json().catch(() => ({}))) as {
                    ok?: boolean;
                    message?: string;
                    data?: SubmitPayload | StudentQuizSessionPatch;
                };

                if (res.status === 422 && body.data && typeof (body.data as StudentQuizSessionPatch).attempts_used === 'number') {
                    const patch = body.data as StudentQuizSessionPatch;
                    applySessionPatch(patch);
                    clearQuizDraftStorage();
                    const msg =
                        typeof body.message === 'string' ? body.message : 'No se pudo registrar el intento (422).';
                    appToastQueue.add({ title: msg, variant: 'danger' }, { timeout: 6000 });
                    return;
                }

                if (!res.ok || !body.ok || !body.data) {
                    const msg = typeof body.message === 'string' ? body.message : `No se pudo enviar (${res.status})`;
                    appToastQueue.add({ title: msg, variant: 'danger' }, { timeout: 6000 });
                    if (
                        typeof body.message === 'string' &&
                        body.message.includes('tiempo') &&
                        hasTimedLimit &&
                        activeTimed
                    ) {
                        clearQuizDraftStorage();
                        applySessionPatch({ active_timed_attempt: null });
                    }
                    return;
                }
                const d = body.data as SubmitPayload;
                const newAttempt: StudentQuizAttempt = {
                    attempt_number: d.attempt_number,
                    score_pct: d.score_pct,
                    is_passed: d.is_passed,
                    submitted_at: d.submitted_at ?? new Date().toISOString(),
                    obtained_points: d.obtained_points,
                    total_points: d.total_points,
                };
                const nextAttempts = [...attemptsLog, newAttempt];
                const nextUsed = d.attempt_number;
                const nextBest = nextAttempts.length ? Math.max(...nextAttempts.map((a) => a.score_pct)) : 0;
                const nextHasPerfect = isPerfectQuizScore(nextBest);
                const nextHasPassed = nextAttempts.some((a) => a.is_passed) || quiz.has_passed;
                const nextCanSubmit =
                    quiz.is_active && !nextHasPerfect && (quiz.max_attempts === 0 || nextUsed < quiz.max_attempts);

                setAttemptsUsed(nextUsed);
                setAttemptsLog(nextAttempts);
                applySessionPatch({
                    attempts_used: nextUsed,
                    attempts: nextAttempts,
                    can_submit: nextCanSubmit,
                    has_passed: nextHasPassed,
                    passing_score: d.passing_score,
                    best_score_pct: Math.round(nextBest * 100) / 100,
                    has_perfect_score: nextHasPerfect,
                    active_timed_attempt: null,
                });
                clearQuizDraftStorage();
                setResult(d);
                appToastQueue.add(
                    {
                        title: d.is_passed ? '¡Has superado el cuestionario!' : 'Intento registrado. Revisa los resultados.',
                        variant: d.is_passed ? 'success' : 'accent',
                    },
                    { timeout: 5000 },
                );
            } catch {
                appToastQueue.add({ title: 'Error de red al enviar el cuestionario.', variant: 'danger' }, { timeout: 6000 });
            } finally {
                setSubmitting(false);
            }
        },
        [
            activeTimed,
            answers,
            applySessionPatch,
            attemptsLog,
            attemptsUsed,
            clearQuizDraftStorage,
            enrollmentId,
            hasTimedLimit,
            lessonId,
            quiz.can_submit,
            quiz.has_passed,
            quiz.has_perfect_score,
            quiz.is_active,
            quiz.max_attempts,
        ],
    );

    useEffect(() => {
        if (!hasTimedLimit || !activeTimed || result !== null || submitting) {
            return;
        }
        if (secondsRemaining !== 0) {
            return;
        }
        if (autoSubmitFiredRef.current) {
            return;
        }
        autoSubmitFiredRef.current = true;
        void submit({ allowAfterTimeout: true });
    }, [activeTimed, hasTimedLimit, result, secondsRemaining, submit, submitting]);

    useEffect(() => {
        autoSubmitFiredRef.current = false;
    }, [activeTimed?.id]);

    const resetAttempt = useCallback(async () => {
        if (!quiz.can_submit || !quiz.is_active) {
            return;
        }
        setResult(null);
        setRevealedAttemptNumber(null);
        setRevealedQuestions(null);
        setAnswers({});
        clearQuizDraftStorage();
        applySessionPatch({ active_timed_attempt: null });
        autoSubmitFiredRef.current = false;
        if (hasTimedLimit) {
            const ok = await startTimedAttempt();
            if (!ok) {
                return;
            }
        }
    }, [
        activeTimed,
        applySessionPatch,
        clearQuizDraftStorage,
        hasTimedLimit,
        quiz.can_submit,
        quiz.is_active,
        startTimedAttempt,
    ]);

    const showComenzarOnly =
        hasTimedLimit &&
        !hideQuestionnaire &&
        !result &&
        quiz.is_active &&
        quiz.can_submit &&
        !quiz.has_perfect_score &&
        !activeTimed;

    return (
        <div className="rounded-2xl border border-slate-200/90 bg-linear-to-br from-white via-slate-50/60 to-white px-5 py-6 shadow-inner shadow-slate-200/40 sm:px-7 sm:py-8">
            {!quiz.is_active ? (
                <div
                    className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950"
                    role="status"
                >
                    <p className="font-semibold">Cuestionario no activo para estudiantes</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-95">
                        Puedes leer las preguntas, pero no podrás enviar respuestas hasta que el instructor marque «Activo
                        para estudiantes» en la administración del curso.
                    </p>
                </div>
            ) : null}

            <div className="border-b border-slate-200/80 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900">{quiz.title}</h3>
                        {quiz.description?.trim() ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{quiz.description.trim()}</p>
                        ) : null}
                    </div>
                    {hasTimedLimit && activeTimed && !result && !hideQuestionnaire ? (
                        <div
                            className={cn(
                                'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums',
                                (secondsRemaining ?? 0) <= 120 && (secondsRemaining ?? 0) > 0
                                    ? 'border-amber-300/90 bg-amber-50 text-amber-950'
                                    : 'border-slate-200/90 bg-white text-slate-800',
                                (secondsRemaining ?? 0) <= 0 && 'border-red-200/90 bg-red-50 text-red-900',
                            )}
                        >
                            <Clock className="size-4 shrink-0" aria-hidden />
                            <span>Tiempo: {secondsRemaining !== null ? formatCountdown(secondsRemaining) : '—'}</span>
                        </div>
                    ) : null}
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                    <div>
                        <dt className="inline font-medium text-slate-600">Nota mínima para aprobar: </dt>
                        <dd className="inline tabular-nums">{quiz.passing_score}%</dd>
                    </div>
                    <div>
                        <dt className="inline font-medium text-slate-600">Intentos: </dt>
                        <dd className="inline">
                            {quiz.max_attempts > 0 ? (
                                <>
                                    <span className="tabular-nums">
                                        {attemptsUsed}/{quiz.max_attempts}
                                    </span>{' '}
                                    usados · {attemptsRemainingLabel}
                                </>
                            ) : (
                                <span>
                                    {attemptsUsed} registrados · {attemptsRemainingLabel}
                                </span>
                            )}
                        </dd>
                    </div>
                    {hasTimedLimit ? (
                        <div>
                            <dt className="inline font-medium text-slate-600">Tiempo límite: </dt>
                            <dd className="inline tabular-nums">{quiz.time_limit_minutes} min</dd>
                        </div>
                    ) : null}
                    {attemptsLog.length > 0 ? (
                        <div>
                            <dt className="inline font-medium text-slate-600">Mejor nota: </dt>
                            <dd className="inline tabular-nums font-medium text-slate-800">{quiz.best_score_pct}%</dd>
                        </div>
                    ) : null}
                </dl>
            </div>

            {attemptsLog.length > 0 ? (
                <div className="mt-5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tus intentos</h4>
                    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200/80 bg-white/90">
                        <table className="w-full min-w-[320px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-2">#</th>
                                    <th className="px-3 py-2">Fecha</th>
                                    <th className="px-3 py-2">Nota</th>
                                    <th className="px-3 py-2">Puntos</th>
                                    <th className="px-3 py-2">Aprobado</th>
                                    <th className="px-3 py-2 text-right">Respuestas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attemptsLog.map((a) => (
                                    <tr key={a.attempt_number} className="border-b border-slate-100/90 last:border-0">
                                        <td className="px-3 py-2 tabular-nums text-slate-700">{a.attempt_number}</td>
                                        <td className="px-3 py-2 text-slate-600">{formatAttemptAt(a.submitted_at)}</td>
                                        <td className="px-3 py-2 font-medium tabular-nums text-slate-900">{a.score_pct}%</td>
                                        <td className="px-3 py-2 tabular-nums text-slate-600">
                                            {a.obtained_points} / {a.total_points}
                                        </td>
                                        <td className="px-3 py-2">
                                            {a.is_passed ? (
                                                <span className="text-xs font-semibold text-emerald-700">Sí</span>
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-600">No</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {showAttemptReviewButton(quiz, a) ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 rounded-lg px-2.5 text-xs font-semibold"
                                                    disabled={reviewLoading === a.attempt_number}
                                                    onClick={() => void loadAttemptReview(a.attempt_number)}
                                                >
                                                    {reviewLoading === a.attempt_number ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                                                            Cargando
                                                        </span>
                                                    ) : revealedAttemptNumber === a.attempt_number && revealedQuestions ? (
                                                        'Actualizar'
                                                    ) : (
                                                        'Ver respuestas'
                                                    )}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {revealedQuestions !== null && revealedAttemptNumber !== null ? (
                        <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/50 px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                <h4 className="text-sm font-semibold text-slate-900">
                                    Respuestas correctas · intento {revealedAttemptNumber}
                                </h4>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs font-semibold text-slate-600"
                                    onClick={() => {
                                        setRevealedQuestions(null);
                                        setRevealedAttemptNumber(null);
                                    }}
                                >
                                    Cerrar
                                </Button>
                            </div>
                            <ul className="mt-3 space-y-3">
                                {ordered.map((q) => {
                                    const r = revealedByQuestion.get(q.id);
                                    const ok = r?.correct === true;
                                    const bad = r?.correct === false;
                                    const pending = r?.correct === null;
                                    const revealLabels =
                                        r && r.correct_option_ids.length > 0
                                            ? r.correct_option_ids
                                                  .map((id) => q.options.find((o) => o.id === id)?.option_text ?? id)
                                                  .join(' · ')
                                            : null;
                                    return (
                                        <li
                                            key={q.id}
                                            className={cn(
                                                'rounded-xl border bg-white/90 px-3 py-3 text-sm',
                                                ok && 'border-emerald-200/80 bg-emerald-50/40',
                                                bad && 'border-red-200/80 bg-red-50/40',
                                                pending && 'border-slate-200/80 bg-slate-50/60',
                                            )}
                                        >
                                            <div className="flex items-start gap-2">
                                                {ok ? (
                                                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                                                ) : bad ? (
                                                    <X className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                                                ) : (
                                                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-900">{q.question_text}</p>
                                                    {r?.note ? <p className="mt-1 text-xs text-slate-600">{r.note}</p> : null}
                                                    {revealLabels ? (
                                                        <p className="mt-1 text-xs text-slate-700">
                                                            Respuesta(s) correcta(s): {revealLabels}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {result ? (
                <div className="mt-5 space-y-4">
                    <div
                        className={cn(
                            'rounded-xl border px-4 py-3 text-sm',
                            result.is_passed
                                ? 'border-emerald-200/90 bg-emerald-50/90 text-emerald-900'
                                : 'border-amber-200/90 bg-amber-50/90 text-amber-950',
                        )}
                    >
                        <p className="font-semibold">
                            Resultado del intento {result.attempt_number}:{' '}
                            <span className="tabular-nums">
                                {result.score_pct}% ({result.obtained_points} / {result.total_points} ptos.)
                            </span>
                        </p>
                        <p className="mt-1 text-xs opacity-90">
                            Nota mínima exigida: {result.passing_score}% · {result.is_passed ? 'Superado' : 'No superado'}
                        </p>
                        {quiz.show_answers_after === 'never' ? (
                            <p className="mt-2 text-xs leading-relaxed opacity-90">
                                Este cuestionario no permite mostrar las respuestas correctas.
                            </p>
                        ) : quiz.show_answers_after === 'submission' ? (
                            <p className="mt-2 text-xs leading-relaxed opacity-90">
                                Para ver el detalle con las respuestas correctas, pulsa «Ver respuestas» en la fila de este
                                intento en la tabla «Tus intentos».
                            </p>
                        ) : (
                            <p className="mt-2 text-xs leading-relaxed opacity-90">
                                Las respuestas correctas solo pueden consultarse con «Ver respuestas» en intentos con
                                calificación del 100%.
                            </p>
                        )}
                    </div>

                    {quiz.can_submit && quiz.is_active && !quiz.has_perfect_score ? (
                        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => void resetAttempt()}>
                            {hasTimedLimit ? 'Intentar de nuevo (nuevo cronómetro)' : 'Intentar de nuevo'}
                        </Button>
                    ) : quiz.has_perfect_score ? (
                        <p className="text-center text-xs font-medium text-emerald-800">
                            Tu mejor nota registrada es 100%. No hace falta otro intento.
                        </p>
                    ) : (
                        <p className="text-center text-xs text-slate-500">No quedan intentos disponibles para este cuestionario.</p>
                    )}
                </div>
            ) : null}

            {hideQuestionnaire && !result ? (
                <div
                    className={cn(
                        'mt-5 rounded-xl border px-4 py-4 text-sm',
                        quiz.has_perfect_score
                            ? 'border-emerald-200/90 bg-emerald-50/90 text-emerald-950'
                            : 'border-slate-200/90 bg-slate-50/90 text-slate-800',
                    )}
                    role="status"
                >
                    <p className="font-semibold">
                        {quiz.has_perfect_score
                            ? 'Has obtenido la calificación máxima (100%). No es necesario repetir las preguntas.'
                            : 'Has completado los intentos permitidos para este cuestionario.'}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed opacity-90">
                        Conservamos tu historial de intentos arriba. Si necesitas otra oportunidad, habla con el instructor
                        del curso.
                    </p>
                </div>
            ) : null}

            {showComenzarOnly ? (
                <div className="mt-6 rounded-xl border border-violet-200/80 bg-violet-50/50 px-4 py-5 text-center">
                    <p className="text-sm font-medium text-slate-800">
                        Este cuestionario tiene tiempo límite. Pulsa «Comenzar» cuando estés listo; se guardará el
                        progreso en este dispositivo si recargas la página.
                    </p>
                    <Button
                        type="button"
                        className="mt-4 h-11 rounded-xl px-8 font-semibold"
                        disabled={starting}
                        onClick={() => void startTimedAttempt()}
                    >
                        {starting ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                Preparando…
                            </span>
                        ) : (
                            'Comenzar'
                        )}
                    </Button>
                </div>
            ) : null}

            {!hideQuestionnaire && !result && !showComenzarOnly ? (
                <div className="mt-5 space-y-6">
                    {ordered.map((q, idx) => (
                        <fieldset
                            key={q.id}
                            disabled={inputsLocked}
                            className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-4 disabled:opacity-60"
                        >
                            <legend className="px-1 text-sm font-semibold text-slate-800">
                                {idx + 1}. {q.question_text}
                                <span className="ml-2 text-xs font-normal text-slate-500 tabular-nums">
                                    ({q.points} ptos.)
                                </span>
                            </legend>

                            {q.question_type === 'multiple_choice' ? (
                                <ul className="mt-3 space-y-2">
                                    {q.options.map((opt) => {
                                        const selected = (answers[q.id] as string[] | undefined) ?? [];
                                        const checked = selected.includes(opt.id);
                                        return (
                                            <li key={opt.id}>
                                                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-2 hover:bg-slate-50/80 has-focus-visible:ring-2 has-focus-visible:ring-violet-400/40">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 size-4 rounded border-slate-300"
                                                        checked={checked}
                                                        disabled={inputsLocked}
                                                        onChange={() => toggleMulti(q.id, opt.id)}
                                                    />
                                                    <span className="text-sm text-slate-700">{opt.option_text}</span>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : q.question_type === 'short_answer' || q.question_type === 'essay' ? (
                                <textarea
                                    className="mt-3 min-h-[88px] w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner shadow-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed"
                                    placeholder="Escribe aquí tu respuesta (no se califica automáticamente en esta versión)."
                                    value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
                                    disabled={inputsLocked}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                />
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {q.options.map((opt) => (
                                        <li key={opt.id}>
                                            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-2 hover:bg-slate-50/80 has-focus-visible:ring-2 has-focus-visible:ring-violet-400/40">
                                                <input
                                                    type="radio"
                                                    className="mt-1 size-4 border-slate-300 text-violet-600"
                                                    name={`quiz-q-${q.id}`}
                                                    checked={answers[q.id] === opt.id}
                                                    disabled={inputsLocked}
                                                    onChange={() => setSingle(q.id, opt.id)}
                                                />
                                                <span className="text-sm text-slate-700">{opt.option_text}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </fieldset>
                    ))}

                    <Button
                        type="button"
                        className="h-11 w-full rounded-xl font-semibold"
                        disabled={submitting || ordered.length === 0 || !canFillForm}
                        onClick={() => void submit()}
                    >
                        {submitting ? (
                            <span className="inline-flex items-center justify-center gap-2">
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                Enviando…
                            </span>
                        ) : !quiz.is_active ? (
                            'Envío desactivado'
                        ) : !quiz.can_submit && quiz.has_perfect_score ? (
                            '100% alcanzado'
                        ) : !quiz.can_submit ? (
                            'Sin intentos disponibles'
                        ) : hasTimedLimit && !activeTimed ? (
                            'Pulsa «Comenzar» primero'
                        ) : timeExpired ? (
                            'Enviar (tiempo agotado)'
                        ) : (
                            'Enviar respuestas'
                        )}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
