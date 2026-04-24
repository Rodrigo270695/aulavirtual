<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use App\Support\StudentQuizAttemptReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonQuizAttemptReviewController extends Controller
{
    public function show(Request $request, Enrollment $enrollment, Lesson $lesson, int $attempt_number): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless($enrollment->user_id === $user->id && $enrollment->status === 'active', 403);
        abort_unless($enrollment->course_id !== null && $lesson->course_id === $enrollment->course_id, 404);
        abort_unless($lesson->lesson_type === 'quiz' && $lesson->is_published, 404);
        abort_unless($attempt_number >= 1, 404);

        $quiz = $lesson->quiz()
            ->with([
                'questions' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at'),
                'questions.options' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->first();

        abort_if($quiz === null, 404);

        $mode = (string) ($quiz->show_answers_after ?? 'submission');
        if (! in_array($mode, ['never', 'submission', 'passed'], true)) {
            $mode = 'submission';
        }

        if ($mode === 'never') {
            return response()->json([
                'ok' => false,
                'message' => 'Este cuestionario no permite consultar las respuestas correctas.',
            ], 422);
        }

        /** @var QuizAttempt|null $attempt */
        $attempt = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('attempt_number', $attempt_number)
            ->where('status', 'submitted')
            ->with('answers')
            ->first();

        if ($attempt === null) {
            return response()->json([
                'ok' => false,
                'message' => 'No se encontró ese intento.',
            ], 404);
        }

        $scorePct = (float) ($attempt->score ?? 0);
        if ($mode === 'passed' && $scorePct + 0.001 < 100.0) {
            return response()->json([
                'ok' => false,
                'message' => 'Las respuestas correctas solo están disponibles para intentos con calificación del 100%.',
            ], 422);
        }

        $questions = StudentQuizAttemptReview::buildPerQuestionBreakdown($quiz, $attempt);

        return response()->json([
            'ok' => true,
            'data' => [
                'attempt_number' => (int) $attempt->attempt_number,
                'score_pct' => round($scorePct, 2),
                'questions' => $questions,
            ],
        ]);
    }
}
