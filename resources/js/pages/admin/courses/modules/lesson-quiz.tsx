/**
 * Cuestionario de una lección tipo quiz: cabecera (reglas) + preguntas y opciones.
 */

import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    BookMarked,
    ListChecks,
    Plus,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormInput, FormSelect } from '@/components/form';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { dashboard } from '@/routes';
import coursesRoute from '@/routes/admin/courses';
import type {
    AdminQuiz,
    AdminQuizQuestion,
    AdminQuizQuestionType,
    AdminQuizShowAnswersAfter,
    AdminQuizType,
    CourseCategoryRef,
    LessonQuizQuizCan,
} from '@/types';
import { cn } from '@/lib/utils';

interface CourseHeader {
    id: string;
    title: string;
    slug: string;
    category: CourseCategoryRef | null;
}

interface ModuleHeader {
    id: string;
    title: string;
}

interface LessonHeader {
    id: string;
    title: string;
    lesson_type: string;
    sort_order: number;
}

interface Props {
    course: CourseHeader;
    module: ModuleHeader;
    lesson: LessonHeader;
    quiz: AdminQuiz | null;
    quizCan: LessonQuizQuizCan;
}

const QUIZ_TYPE_OPTS: { value: AdminQuizType; label: string }[] = [
    { value: 'formative', label: 'Formativo (práctica)' },
    { value: 'summative', label: 'Sumativo (evaluado)' },
];

const SHOW_ANSWERS_OPTS: { value: AdminQuizShowAnswersAfter; label: string }[] = [
    { value: 'never', label: 'Nunca' },
    { value: 'submission', label: 'Tras enviar (botón por intento)' },
    { value: 'passed', label: 'Solo con 100% (botón en ese intento)' },
];

const QUESTION_TYPE_OPTS: { value: AdminQuizQuestionType; label: string }[] = [
    { value: 'single_choice', label: 'Opción única' },
    { value: 'multiple_choice', label: 'Varias correctas' },
    { value: 'true_false', label: 'Verdadero / falso' },
    { value: 'short_answer', label: 'Respuesta corta' },
    { value: 'essay', label: 'Desarrollo' },
];

function needsOptions(t: AdminQuizQuestionType): boolean {
    return t === 'single_choice' || t === 'multiple_choice' || t === 'true_false';
}

function defaultOptionsForType(t: AdminQuizQuestionType): { option_text: string; is_correct: boolean }[] {
    if (t === 'true_false') {
        return [
            { option_text: 'Verdadero', is_correct: true },
            { option_text: 'Falso', is_correct: false },
        ];
    }
    return [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
    ];
}

/** Evita `String(undefined)` → "undefined" en inputs `type="number"` (error del navegador). */
function numInputStr(value: unknown, fallback: number): string {
    if (value === null || value === undefined || value === '') {
        return String(fallback);
    }
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? String(n) : String(fallback);
}

function textInputStr(value: unknown): string {
    return value == null ? '' : String(value);
}

function timeLimitInputStr(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    return String(value);
}

export default function LessonQuizPage({ course, module, lesson, quiz, quizCan }: Props) {
    const [quizDeleteOpen, setQuizDeleteOpen] = useState(false);
    const [quizDeleting, setQuizDeleting] = useState(false);
    const [qDeleteOpen, setQDeleteOpen] = useState(false);
    const [qDeleting, setQDeleting] = useState(false);
    const [qPending, setQPending] = useState<AdminQuizQuestion | null>(null);

    const baseArgs = { course: course.id, course_module: module.id, lesson: lesson.id };

    const quizForm = useForm({
        title: lesson.title,
        description: '',
        quiz_type: 'formative' as AdminQuizType,
        time_limit_minutes: '',
        max_attempts: 3,
        passing_score: 60,
        shuffle_questions: false,
        shuffle_options: false,
        show_answers_after: 'submission' as AdminQuizShowAnswersAfter,
        is_active: true,
    });

    useEffect(() => {
        if (!quiz) {
            quizForm.setData({
                title: lesson.title,
                description: '',
                quiz_type: 'formative',
                time_limit_minutes: '',
                max_attempts: 3,
                passing_score: 60,
                shuffle_questions: false,
                shuffle_options: false,
                show_answers_after: 'submission',
                is_active: true,
            });
            return;
        }
        quizForm.setData({
            title: quiz.title,
            description: quiz.description ?? '',
            quiz_type: quiz.quiz_type,
            time_limit_minutes: quiz.time_limit_minutes != null ? String(quiz.time_limit_minutes) : '',
            max_attempts: quiz.max_attempts,
            passing_score: Number.parseFloat(quiz.passing_score),
            shuffle_questions: quiz.shuffle_questions,
            shuffle_options: quiz.shuffle_options,
            show_answers_after: quiz.show_answers_after,
            is_active: quiz.is_active,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quiz?.id, lesson.title]);

    const submitQuiz = (e: React.FormEvent) => {
        e.preventDefault();
        quizForm.clearErrors();
        quizForm.transform((data) => ({
            title: data.title,
            description: data.description === '' ? null : data.description,
            quiz_type: data.quiz_type,
            time_limit_minutes: data.time_limit_minutes === '' ? null : Number(data.time_limit_minutes),
            max_attempts: data.max_attempts,
            passing_score: data.passing_score,
            shuffle_questions: !!data.shuffle_questions,
            shuffle_options: !!data.shuffle_options,
            show_answers_after: data.show_answers_after,
            is_active: !!data.is_active,
        }));
        if (quiz) {
            quizForm.put(coursesRoute.modules.lessons.quiz.update.url(baseArgs), { preserveScroll: true });
        } else {
            quizForm.post(coursesRoute.modules.lessons.quiz.store.url(baseArgs), { preserveScroll: true });
        }
    };

    const confirmDeleteQuiz = useCallback(() => {
        setQuizDeleting(true);
        router.delete(coursesRoute.modules.lessons.quiz.destroy.url(baseArgs), {
            preserveScroll: true,
            onFinish: () => {
                setQuizDeleting(false);
                setQuizDeleteOpen(false);
            },
        });
    }, [course.id, module.id, lesson.id]);

    const sortedQuestions = useMemo(() => {
        const raw = quiz?.questions ?? [];
        return [...raw].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
    }, [quiz?.questions]);

    const moveQuestion = useCallback(
        (index: number, dir: -1 | 1) => {
            if (!quiz) {
                return;
            }
            const next = index + dir;
            if (next < 0 || next >= sortedQuestions.length) {
                return;
            }
            const copy = [...sortedQuestions];
            const a = copy[index]!;
            const b = copy[next]!;
            copy[index] = b;
            copy[next] = a;
            router.put(
                coursesRoute.modules.lessons.quiz.questions.reorder.url(baseArgs),
                { order: copy.map((q) => q.id) },
                { preserveScroll: true },
            );
        },
        [baseArgs, quiz, sortedQuestions],
    );

    const qForm = useForm({
        question_text: '',
        question_type: 'single_choice' as AdminQuizQuestionType,
        explanation: '',
        points: 1,
        options: defaultOptionsForType('single_choice'),
    });

    const submitQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quiz) {
            return;
        }
        const opts = needsOptions(qForm.data.question_type) ? qForm.data.options : [];
        // `transform()` no encadena: en Inertia v2 devuelve `undefined`; hay que llamar a `post` aparte.
        qForm.transform((data) => ({
            question_text: data.question_text,
            question_type: data.question_type,
            explanation: data.explanation || null,
            points: data.points,
            options: opts,
        }));
        qForm.post(coursesRoute.modules.lessons.quiz.questions.store.url(baseArgs), {
            preserveScroll: true,
            onSuccess: () => {
                qForm.setData({
                    question_text: '',
                    question_type: 'single_choice',
                    explanation: '',
                    points: 1,
                    options: defaultOptionsForType('single_choice'),
                });
            },
        });
    };

    const confirmDeleteQuestion = useCallback(() => {
        if (!qPending || !quiz) {
            return;
        }
        setQDeleting(true);
        router.delete(
            coursesRoute.modules.lessons.quiz.questions.destroy.url({
                ...baseArgs,
                quiz_question: qPending.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setQDeleting(false);
                    setQDeleteOpen(false);
                    setQPending(null);
                },
            },
        );
    }, [baseArgs, qPending, quiz]);

    const catLabel = course.category ? `${course.category.name}` : '—';

    return (
        <>
            <Head title={`Cuestionario · ${lesson.title}`} />

            <div className="flex flex-col gap-5 p-6">
                <PageHeader
                    title={lesson.title}
                    description={`Módulo «${module.title}». Curso: ${course.title}. Categoría: ${catLabel}. Lección tipo cuestionario.`}
                    icon={<BookMarked />}
                    actions={
                        <Link
                            href={coursesRoute.modules.index.url({ course: course.id })}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
                        >
                            <ArrowLeft className="size-4" />
                            Volver a módulos
                        </Link>
                    }
                />

                {!quizCan.view ? (
                    <p className="text-sm text-amber-900">
                        No tienes permiso para ver cuestionarios (
                        <code className="rounded bg-amber-100 px-1 text-xs">cursos_lecciones_quizzes.view</code>).
                    </p>
                ) : (
                    <>
                        <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <ListChecks className="size-5 text-rose-600" />
                                    <h2 className="text-sm font-semibold text-slate-800">Cabecera del cuestionario</h2>
                                </div>
                                {quiz && quizCan.delete && (
                                    <button
                                        type="button"
                                        onClick={() => setQuizDeleteOpen(true)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Eliminar cuestionario
                                    </button>
                                )}
                            </div>

                            {!quiz && !quizCan.create ? (
                                <p className="text-sm text-slate-500">No hay cuestionario creado y no puedes crear uno.</p>
                            ) : (
                                <form onSubmit={submitQuiz} className="space-y-4">
                                    <FormInput
                                        label="Título"
                                        value={textInputStr(quizForm.data.title)}
                                        onChange={(e) => quizForm.setData('title', e.target.value)}
                                        error={quizForm.errors.title}
                                        required
                                    />
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Instrucciones</label>
                                        <textarea
                                            value={textInputStr(quizForm.data.description)}
                                            onChange={(e) => quizForm.setData('description', e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                                        />
                                        {quizForm.errors.description ? (
                                            <p className="mt-1 text-xs text-red-600">{quizForm.errors.description}</p>
                                        ) : null}
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormSelect
                                            label="Tipo"
                                            value={quizForm.data.quiz_type ?? 'formative'}
                                            onValueChange={(v) => quizForm.setData('quiz_type', v as AdminQuizType)}
                                            options={QUIZ_TYPE_OPTS}
                                            error={quizForm.errors.quiz_type}
                                            accent="amber"
                                        />
                                        <FormSelect
                                            label="Mostrar respuestas correctas"
                                            value={quizForm.data.show_answers_after ?? 'submission'}
                                            onValueChange={(v) =>
                                                quizForm.setData('show_answers_after', v as AdminQuizShowAnswersAfter)
                                            }
                                            options={SHOW_ANSWERS_OPTS}
                                            error={quizForm.errors.show_answers_after}
                                            accent="amber"
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <FormInput
                                            label="Tiempo límite (min)"
                                            type="number"
                                            min={1}
                                            hint="Vacío = sin límite"
                                            value={timeLimitInputStr(quizForm.data.time_limit_minutes)}
                                            onChange={(e) => quizForm.setData('time_limit_minutes', e.target.value)}
                                            error={quizForm.errors.time_limit_minutes}
                                        />
                                        <FormInput
                                            label="Intentos máx."
                                            type="number"
                                            min={-1}
                                            hint="-1 = ilimitado"
                                            value={numInputStr(quizForm.data.max_attempts, 3)}
                                            onChange={(e) => quizForm.setData('max_attempts', Number.parseInt(e.target.value, 10) || 0)}
                                            error={quizForm.errors.max_attempts}
                                        />
                                        <FormInput
                                            label="Nota mínima (%)"
                                            type="number"
                                            min={60}
                                            max={100}
                                            step={0.01}
                                            hint="Mínimo 60% para contar como aprobado."
                                            value={numInputStr(quizForm.data.passing_score, 60)}
                                            onChange={(e) =>
                                                quizForm.setData('passing_score', Number.parseFloat(e.target.value) || 0)
                                            }
                                            error={quizForm.errors.passing_score}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={!!quizForm.data.shuffle_questions}
                                                onChange={(e) => quizForm.setData('shuffle_questions', e.target.checked)}
                                                className="rounded border-slate-300"
                                            />
                                            Mezclar preguntas
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={!!quizForm.data.shuffle_options}
                                                onChange={(e) => quizForm.setData('shuffle_options', e.target.checked)}
                                                className="rounded border-slate-300"
                                            />
                                            Mezclar opciones
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={quizForm.data.is_active !== false}
                                                onChange={(e) => quizForm.setData('is_active', e.target.checked)}
                                                className="rounded border-slate-300"
                                            />
                                            Activo para estudiantes
                                        </label>
                                    </div>
                                    {(quizCan.create && !quiz) || (quiz && quizCan.edit) ? (
                                        <button
                                            type="submit"
                                            disabled={quizForm.processing}
                                            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                        >
                                            {quizForm.processing ? 'Guardando…' : quiz ? 'Guardar cambios' : 'Crear cuestionario'}
                                        </button>
                                    ) : null}
                                </form>
                            )}
                        </section>

                        {quiz && quizCan.edit ? (
                            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                <div className="mb-4 border-b border-slate-100 pb-3">
                                    <h2 className="text-sm font-semibold text-slate-800">Preguntas</h2>
                                    <p className="text-xs text-slate-500">
                                        Añade preguntas con opciones (excepto desarrollo / respuesta corta).
                                    </p>
                                </div>

                                {sortedQuestions.length === 0 ? (
                                    <p className="mb-4 text-sm text-slate-500">Aún no hay preguntas.</p>
                                ) : (
                                    <ul className="mb-6 space-y-2">
                                        {sortedQuestions.map((q, index) => (
                                            <li
                                                key={q.id}
                                                className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                                            >
                                                <div className="flex w-8 flex-col items-center">
                                                    <span className="text-[10px] font-bold text-slate-500">{q.sort_order}</span>
                                                    {sortedQuestions.length > 1 && (
                                                        <div className="flex flex-col">
                                                            <button
                                                                type="button"
                                                                disabled={index === 0}
                                                                onClick={() => moveQuestion(index, -1)}
                                                                className={cn(
                                                                    'rounded p-0.5 text-slate-400 hover:bg-white',
                                                                    index === 0 && 'opacity-30',
                                                                )}
                                                            >
                                                                <ArrowUp className="size-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={index === sortedQuestions.length - 1}
                                                                onClick={() => moveQuestion(index, 1)}
                                                                className={cn(
                                                                    'rounded p-0.5 text-slate-400 hover:bg-white',
                                                                    index === sortedQuestions.length - 1 && 'opacity-30',
                                                                )}
                                                            >
                                                                <ArrowDown className="size-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{q.question_text}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {QUESTION_TYPE_OPTS.find((o) => o.value === q.question_type)?.label ?? q.question_type}{' '}
                                                        · {q.points} pt
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    title="Eliminar pregunta"
                                                    onClick={() => {
                                                        setQPending(q);
                                                        setQDeleteOpen(true);
                                                    }}
                                                    className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <form onSubmit={submitQuestion} className="space-y-3 rounded-lg border border-dashed border-rose-200/80 bg-rose-50/20 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                        <Plus className="size-4 text-rose-600" />
                                        Nueva pregunta
                                    </div>
                                    <FormSelect
                                        label="Tipo de pregunta"
                                        value={qForm.data.question_type ?? 'single_choice'}
                                        onValueChange={(v) => {
                                            const t = v as AdminQuizQuestionType;
                                            qForm.setData((prev) => ({
                                                ...prev,
                                                question_type: t,
                                                options: needsOptions(t) ? defaultOptionsForType(t) : [],
                                            }));
                                        }}
                                        options={QUESTION_TYPE_OPTS}
                                        error={qForm.errors.question_type}
                                        accent="amber"
                                    />
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Enunciado</label>
                                        <textarea
                                            value={textInputStr(qForm.data.question_text)}
                                            onChange={(e) => qForm.setData('question_text', e.target.value)}
                                            rows={3}
                                            required
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                                        />
                                        {qForm.errors.question_text ? (
                                            <p className="mt-1 text-xs text-red-600">{qForm.errors.question_text}</p>
                                        ) : null}
                                    </div>
                                    <FormInput
                                        label="Puntos"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={numInputStr(qForm.data.points, 1)}
                                        onChange={(e) => qForm.setData('points', Number.parseFloat(e.target.value) || 0)}
                                        error={qForm.errors.points}
                                    />
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Explicación (retroalimentación)</label>
                                        <textarea
                                            value={textInputStr(qForm.data.explanation)}
                                            onChange={(e) => qForm.setData('explanation', e.target.value)}
                                            rows={2}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                                        />
                                    </div>
                                    {needsOptions(qForm.data.question_type) ? (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-slate-600">Opciones</p>
                                            {qForm.data.options.map((opt, i) => (
                                                <div key={i} className="flex flex-wrap items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={textInputStr(opt.option_text)}
                                                        onChange={(e) => {
                                                            const next = [...qForm.data.options];
                                                            next[i] = { ...next[i]!, option_text: e.target.value };
                                                            qForm.setData('options', next);
                                                        }}
                                                        className="min-w-48 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                                                        placeholder={`Opción ${i + 1}`}
                                                    />
                                                    <label className="flex items-center gap-1 text-xs text-slate-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.is_correct}
                                                            onChange={(e) => {
                                                                const next = [...qForm.data.options];
                                                                const t = qForm.data.question_type;
                                                                if (t === 'single_choice' || t === 'true_false') {
                                                                    next.forEach((o, j) => {
                                                                        o.is_correct = j === i ? e.target.checked : false;
                                                                    });
                                                                } else {
                                                                    next[i] = { ...next[i]!, is_correct: e.target.checked };
                                                                }
                                                                qForm.setData('options', next);
                                                            }}
                                                        />
                                                        Correcta
                                                    </label>
                                                </div>
                                            ))}
                                            {qForm.data.question_type !== 'true_false' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        qForm.setData('options', [
                                                            ...qForm.data.options,
                                                            { option_text: '', is_correct: false },
                                                        ])
                                                    }
                                                    className="text-xs font-medium text-rose-700 hover:underline"
                                                >
                                                    + Añadir opción
                                                </button>
                                            )}
                                            {qForm.errors.options ? (
                                                <p className="text-xs text-red-600">{qForm.errors.options}</p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    <button
                                        type="submit"
                                        disabled={qForm.processing}
                                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                    >
                                        {qForm.processing ? 'Añadiendo…' : 'Añadir pregunta'}
                                    </button>
                                </form>
                            </section>
                        ) : null}
                    </>
                )}
            </div>

            <ConfirmModal
                open={quizDeleteOpen}
                onClose={() => {
                    if (!quizDeleting) {
                        setQuizDeleteOpen(false);
                    }
                }}
                onConfirm={confirmDeleteQuiz}
                loading={quizDeleting}
                title="Eliminar cuestionario"
                description="Se borrarán todas las preguntas, opciones e intentos asociados (cascada en base de datos)."
                confirmLabel="Sí, eliminar"
            />

            <ConfirmModal
                open={qDeleteOpen}
                onClose={() => {
                    if (!qDeleting) {
                        setQDeleteOpen(false);
                        setQPending(null);
                    }
                }}
                onConfirm={confirmDeleteQuestion}
                loading={qDeleting}
                title="Eliminar pregunta"
                description="¿Eliminar esta pregunta del cuestionario?"
                confirmLabel="Sí, eliminar"
            />
        </>
    );
}

LessonQuizPage.layout = (pageProps: Props) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Cursos', href: coursesRoute.index.url() },
        {
            title: `Módulos · ${pageProps.course.title}`,
            href: coursesRoute.modules.index.url({ course: pageProps.course.id }),
        },
        {
            title: `Cuestionario · ${pageProps.lesson.title}`,
            href: coursesRoute.modules.lessons.quiz.show.url({
                course: pageProps.course.id,
                course_module: pageProps.module.id,
                lesson: pageProps.lesson.id,
            }),
        },
    ],
});
