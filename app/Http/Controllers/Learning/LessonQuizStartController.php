<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonQuizStartController extends Controller
{
    public function store(Request $request, Enrollment $enrollment, Lesson $lesson): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless($enrollment->user_id === $user->id && $enrollment->status === 'active', 403);
        abort_unless($enrollment->course_id !== null && $lesson->course_id === $enrollment->course_id, 404);
        abort_unless($lesson->lesson_type === 'quiz' && $lesson->is_published, 404);

        $quiz = $lesson->quiz()->first();
        abort_if($quiz === null, 404);

        if (! $quiz->is_active) {
            return response()->json([
                'ok' => false,
                'message' => 'Este cuestionario no está activo para estudiantes.',
            ], 422);
        }

        $limitMin = (int) ($quiz->time_limit_minutes ?? 0);
        if ($limitMin <= 0) {
            return response()->json([
                'ok' => false,
                'message' => 'Este cuestionario no exige cronómetro; responde y envía directamente.',
            ], 422);
        }

        $quiz->purgeStaleTimedInProgressAttemptsFor((string) $user->id);

        $submittedRows = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->orderBy('attempt_number')
            ->get(['attempt_number', 'is_passed', 'score']);

        $submittedCount = $submittedRows->count();
        $bestScore = $submittedRows->isEmpty() ? 0.0 : (float) $submittedRows->max('score');
        $hasPerfectScore = $bestScore + 0.001 >= 100.0;

        if ($hasPerfectScore) {
            return response()->json([
                'ok' => false,
                'message' => 'Has obtenido la calificación máxima (100%). No es necesario volver a intentarlo.',
            ], 422);
        }

        $maxAttempts = (int) $quiz->max_attempts;
        if ($maxAttempts > 0 && $submittedCount >= $maxAttempts) {
            return response()->json([
                'ok' => false,
                'message' => 'Has alcanzado el número máximo de intentos para este cuestionario.',
            ], 422);
        }

        $existing = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->orderByDesc('started_at')
            ->first();

        $now = now();
        if ($existing !== null) {
            $deadline = $existing->started_at->copy()->addMinutes($limitMin);
            if ($now->lessThanOrEqualTo($deadline)) {
                return response()->json([
                    'ok' => true,
                    'data' => [
                        'attempt_id' => $existing->id,
                        'attempt_number' => (int) $existing->attempt_number,
                        'started_at' => $existing->started_at->toIso8601String(),
                        'deadline_at' => $deadline->toIso8601String(),
                    ],
                ]);
            }

            $existing->delete();
        }

        $attemptNumber = $submittedCount + 1;

        $attempt = QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'status' => 'in_progress',
            'score' => null,
            'total_points' => null,
            'obtained_points' => null,
            'is_passed' => null,
            'started_at' => $now,
            'submitted_at' => null,
            'time_spent_seconds' => null,
        ]);

        $deadline = $attempt->started_at->copy()->addMinutes($limitMin);

        return response()->json([
            'ok' => true,
            'data' => [
                'attempt_id' => $attempt->id,
                'attempt_number' => $attemptNumber,
                'started_at' => $attempt->started_at->toIso8601String(),
                'deadline_at' => $deadline->toIso8601String(),
            ],
        ]);
    }
}
