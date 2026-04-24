<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Support\QuizStudentPassingScore;
use App\Support\StudentQuizAttemptReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonQuizSubmitController extends Controller
{
    /** Margen de reloj red / latencia al validar el límite de tiempo (segundos). */
    private const TIMED_GRACE_SECONDS = 120;

    public function store(Request $request, Enrollment $enrollment, Lesson $lesson): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless($enrollment->user_id === $user->id && $enrollment->status === 'active', 403);
        abort_unless($enrollment->course_id !== null && $lesson->course_id === $enrollment->course_id, 404);
        abort_unless($lesson->lesson_type === 'quiz' && $lesson->is_published, 404);

        $quiz = $lesson->quiz()
            ->with([
                'questions' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at'),
                'questions.options' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->first();

        abort_if($quiz === null, 404);

        if (! $quiz->is_active) {
            return response()->json([
                'ok' => false,
                'message' => 'Este cuestionario no está activo para estudiantes. Actívalo en administración (opción «Activo para estudiantes») o pide al instructor que lo active.',
            ], 422);
        }

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable'],
            'attempt_id' => ['sometimes', 'nullable', 'uuid'],
        ]);

        $answersInput = $validated['answers'];
        $attemptId = $validated['attempt_id'] ?? null;

        $limitMin = (int) ($quiz->time_limit_minutes ?? 0);
        $timed = $limitMin > 0;

        if ($timed && ($attemptId === null || $attemptId === '')) {
            return response()->json([
                'ok' => false,
                'message' => 'Debes pulsar «Comenzar» para registrar el intento con cronómetro antes de enviar.',
            ], 422);
        }

        if (! $timed && $attemptId !== null && $attemptId !== '') {
            return response()->json([
                'ok' => false,
                'message' => 'Este envío no debe incluir identificador de intento cronometrado.',
            ], 422);
        }

        $quiz->purgeStaleTimedInProgressAttemptsFor((string) $user->id);

        $submittedCount = (int) QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->count();

        $bestScoreBefore = (float) (QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->max('score') ?? 0);

        if ($bestScoreBefore + 0.001 >= 100.0) {
            return response()->json([
                'ok' => false,
                'message' => 'Ya has obtenido la calificación máxima (100%) en un intento anterior.',
            ], 422);
        }

        if ($quiz->max_attempts > 0 && $submittedCount >= $quiz->max_attempts) {
            $effectivePassing = QuizStudentPassingScore::effectiveThreshold($quiz);
            $attemptSnapshot = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->where('status', 'submitted')
                ->orderBy('attempt_number')
                ->limit(30)
                ->get(['attempt_number', 'score', 'is_passed', 'submitted_at', 'obtained_points', 'total_points']);

            $bestScorePct = $attemptSnapshot->isEmpty()
                ? 0.0
                : round((float) $attemptSnapshot->max('score'), 2);
            $hasPerfectScore = $bestScorePct + 0.001 >= 100.0;

            return response()->json([
                'ok' => false,
                'message' => 'Has alcanzado el número máximo de intentos para este cuestionario.',
                'data' => [
                    'attempts_used' => $attemptSnapshot->count(),
                    'can_submit' => false,
                    'has_passed' => $attemptSnapshot->contains(
                        fn ($a): bool => (float) ($a->score ?? 0) + 0.0001 >= $effectivePassing,
                    ),
                    'best_score_pct' => $bestScorePct,
                    'has_perfect_score' => $hasPerfectScore,
                    'active_timed_attempt' => null,
                    'attempts' => $attemptSnapshot->map(fn ($a): array => [
                        'attempt_number' => (int) $a->attempt_number,
                        'score_pct' => round((float) ($a->score ?? 0), 2),
                        'is_passed' => (float) ($a->score ?? 0) + 0.0001 >= $effectivePassing,
                        'submitted_at' => $a->submitted_at?->toIso8601String(),
                        'obtained_points' => round((float) $a->obtained_points, 2),
                        'total_points' => round((float) $a->total_points, 2),
                    ])->values()->all(),
                ],
            ], 422);
        }

        $attempt = null;
        if ($timed) {
            /** @var QuizAttempt|null $attempt */
            $attempt = QuizAttempt::query()
                ->where('id', $attemptId)
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->where('status', 'in_progress')
                ->first();

            if ($attempt === null) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No hay un intento en curso válido. Pulsa «Comenzar» de nuevo.',
                ], 422);
            }

            $deadline = $attempt->started_at->copy()->addMinutes($limitMin)->addSeconds(self::TIMED_GRACE_SECONDS);
            if (now()->greaterThan($deadline)) {
                $attempt->delete();

                return response()->json([
                    'ok' => false,
                    'message' => 'El tiempo de este intento ha finalizado. Inicia un nuevo intento con «Comenzar».',
                ], 422);
            }
        }

        $totalPoints = 0.0;
        $obtainedPoints = 0.0;
        $perQuestion = [];

        foreach ($quiz->questions as $question) {
            $points = (float) $question->points;
            $raw = $answersInput[$question->id] ?? null;

            $isCorrect = null;
            $pointsEarned = 0.0;
            $selectedSingle = null;
            $selectedIds = [];

            if (in_array($question->question_type, ['single_choice', 'true_false'], true)) {
                $totalPoints += $points;
                $selectedSingle = is_string($raw) && $raw !== '' ? $raw : null;
                $option = $selectedSingle
                    ? $question->options->firstWhere('id', $selectedSingle)
                    : null;
                if ($option !== null && $question->options->contains('id', $option->id)) {
                    $isCorrect = (bool) $option->is_correct;
                    if ($isCorrect) {
                        $pointsEarned = $points;
                        $obtainedPoints += $points;
                    }
                } else {
                    $isCorrect = false;
                }
                $correctIds = $question->options->where('is_correct', true)->pluck('id')->values()->all();
                $perQuestion[] = [
                    'question_id' => $question->id,
                    'correct' => $isCorrect === true,
                    'points_earned' => round($pointsEarned, 2),
                    'points_possible' => round($points, 2),
                    'correct_option_ids' => $correctIds,
                    'selected_option_ids' => $selectedSingle ? [$selectedSingle] : [],
                ];
            } elseif ($question->question_type === 'multiple_choice') {
                $totalPoints += $points;
                $selectedIds = is_array($raw) ? array_values(array_filter($raw, fn ($v) => is_string($v) && $v !== '')) : [];
                $correctSet = $question->options->where('is_correct', true)->pluck('id')->sort()->values()->all();
                $selectedSorted = collect($selectedIds)
                    ->filter(fn (string $id) => $question->options->contains('id', $id))
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();
                $isCorrect = $correctSet === $selectedSorted;
                if ($isCorrect) {
                    $pointsEarned = $points;
                    $obtainedPoints += $points;
                } else {
                    $isCorrect = false;
                }
                $perQuestion[] = [
                    'question_id' => $question->id,
                    'correct' => $isCorrect,
                    'points_earned' => round($pointsEarned, 2),
                    'points_possible' => round($points, 2),
                    'correct_option_ids' => $correctSet,
                    'selected_option_ids' => $selectedSorted,
                ];
            } else {
                $perQuestion[] = [
                    'question_id' => $question->id,
                    'correct' => null,
                    'points_earned' => 0,
                    'points_possible' => round($points, 2),
                    'correct_option_ids' => [],
                    'selected_option_ids' => [],
                    'note' => 'Este tipo de pregunta no se califica automáticamente.',
                ];
            }
        }

        $scorePct = $totalPoints > 0 ? round(($obtainedPoints * 100) / $totalPoints, 2) : 0.0;
        $passing = QuizStudentPassingScore::effectiveThreshold($quiz);
        $isPassed = $scorePct + 0.0001 >= $passing;

        $now = now();

        if ($timed && $attempt !== null) {
            $attemptNumber = (int) $attempt->attempt_number;
            DB::transaction(function () use ($quiz, $attempt, $scorePct, $totalPoints, $obtainedPoints, $isPassed, $now, $perQuestion, $answersInput): void {
                QuizAttemptAnswer::query()->where('attempt_id', $attempt->id)->delete();

                $attempt->update([
                    'status' => 'submitted',
                    'score' => $scorePct,
                    'total_points' => round($totalPoints, 2),
                    'obtained_points' => round($obtainedPoints, 2),
                    'is_passed' => $isPassed,
                    'submitted_at' => $now,
                    'time_spent_seconds' => max(0, (int) $attempt->started_at->diffInSeconds($now)),
                ]);

                foreach ($quiz->questions as $question) {
                    $raw = $answersInput[$question->id] ?? null;
                    $selectedOptionId = null;
                    $textAnswer = null;

                    if (in_array($question->question_type, ['single_choice', 'true_false'], true)) {
                        $selectedOptionId = is_string($raw) && $raw !== '' ? $raw : null;
                    } elseif ($question->question_type === 'multiple_choice') {
                        $textAnswer = is_array($raw) ? implode(',', array_values($raw)) : null;
                    } else {
                        $textAnswer = is_string($raw) ? $raw : (is_array($raw) ? json_encode($raw) : null);
                    }

                    $meta = collect($perQuestion)->firstWhere('question_id', $question->id);

                    QuizAttemptAnswer::query()->create([
                        'attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                        'selected_option_id' => $selectedOptionId,
                        'text_answer' => $textAnswer,
                        'is_correct' => $meta['correct'] ?? null,
                        'points_earned' => $meta['points_earned'] ?? 0,
                    ]);
                }
            });
        } else {
            $attemptNumber = $submittedCount + 1;
            DB::transaction(function () use ($quiz, $user, $attemptNumber, $scorePct, $totalPoints, $obtainedPoints, $isPassed, $now, $perQuestion, $answersInput): void {
                $created = QuizAttempt::query()->create([
                    'quiz_id' => $quiz->id,
                    'user_id' => $user->id,
                    'attempt_number' => $attemptNumber,
                    'status' => 'submitted',
                    'score' => $scorePct,
                    'total_points' => round($totalPoints, 2),
                    'obtained_points' => round($obtainedPoints, 2),
                    'is_passed' => $isPassed,
                    'started_at' => $now,
                    'submitted_at' => $now,
                    'time_spent_seconds' => null,
                ]);

                foreach ($quiz->questions as $question) {
                    $raw = $answersInput[$question->id] ?? null;
                    $selectedOptionId = null;
                    $textAnswer = null;

                    if (in_array($question->question_type, ['single_choice', 'true_false'], true)) {
                        $selectedOptionId = is_string($raw) && $raw !== '' ? $raw : null;
                    } elseif ($question->question_type === 'multiple_choice') {
                        $textAnswer = is_array($raw) ? implode(',', array_values($raw)) : null;
                    } else {
                        $textAnswer = is_string($raw) ? $raw : (is_array($raw) ? json_encode($raw) : null);
                    }

                    $meta = collect($perQuestion)->firstWhere('question_id', $question->id);

                    QuizAttemptAnswer::query()->create([
                        'attempt_id' => $created->id,
                        'question_id' => $question->id,
                        'selected_option_id' => $selectedOptionId,
                        'text_answer' => $textAnswer,
                        'is_correct' => $meta['correct'] ?? null,
                        'points_earned' => $meta['points_earned'] ?? 0,
                    ]);
                }
            });
        }

        $questionsForResponse = StudentQuizAttemptReview::redactForStudentResponse($perQuestion);

        return response()->json([
            'ok' => true,
            'data' => [
                'score_pct' => $scorePct,
                'is_passed' => $isPassed,
                'passing_score' => $passing,
                'obtained_points' => round($obtainedPoints, 2),
                'total_points' => round($totalPoints, 2),
                'attempt_number' => $attemptNumber,
                'submitted_at' => $now->toIso8601String(),
                'questions' => $questionsForResponse,
            ],
        ]);
    }
}
