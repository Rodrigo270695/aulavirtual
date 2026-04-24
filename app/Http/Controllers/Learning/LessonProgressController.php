<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\UpsertLessonProgressRequest;
use App\Models\CourseReview;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Support\CertificateIssuer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LessonProgressController extends Controller
{
    public function upsert(UpsertLessonProgressRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $validated = $request->validated();

        $enrollment = Enrollment::query()
            ->whereKey($validated['enrollment_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        abort_if($enrollment->status !== 'active', 403, 'Tu matrícula no está activa.');

        $lesson = Lesson::query()->findOrFail($validated['lesson_id']);

        if ($enrollment->course_id === null || $lesson->course_id !== $enrollment->course_id) {
            abort(403, 'La lección no pertenece a esta matrícula.');
        }

        $position = max(0, (int) ($validated['video_position_sec'] ?? 0));
        $watchPct = round(min(100, max(0, (float) ($validated['watch_pct'] ?? 0))), 2);
        $requestedStatus = $validated['status'] ?? null;
        $now = now();

        $result = DB::transaction(function () use ($enrollment, $lesson, $user, $position, $watchPct, $requestedStatus, $now): array {
            $progress = LessonProgress::query()->firstOrNew([
                'enrollment_id' => $enrollment->id,
                'lesson_id' => $lesson->id,
            ]);

            // Si ya estaba completada, un clic de "solo abrir otra lección y volver" no debe bajar a en_progreso
            // ni poner watch_pct/posición a 0 (el cliente reenvía 0 al marcar in_progress al seleccionar).
            if (
                $progress->exists
                && $progress->status === 'completed'
                && $requestedStatus === 'in_progress'
                && $position === 0
                && $watchPct === 0.0
            ) {
                $progress->forceFill([
                    'user_id' => $user->id,
                    'last_accessed_at' => $now,
                ]);
                $progress->save();

                $enrollment->update(['last_accessed_at' => $now]);

                return $this->buildProgressResponse($enrollment, $progress->fresh(), $user);
            }

            $status = $this->resolveStatus($requestedStatus, $position, $watchPct);

            $hasActivity = $status !== 'not_started' || $position > 0 || $watchPct > 0;

            $progress->fill([
                'user_id' => $user->id,
                'status' => $status,
                'video_position_sec' => $position,
                'watch_pct' => $watchPct,
                'first_accessed_at' => $progress->first_accessed_at ?? ($hasActivity ? $now : null),
                'last_accessed_at' => $now,
                'completed_at' => $status === 'completed'
                    ? ($progress->completed_at ?? $now)
                    : null,
            ]);
            $progress->save();

            return $this->buildProgressResponse($enrollment, $progress->fresh(), $user);
        });

        return response()->json([
            'ok' => true,
            'data' => $result,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildProgressResponse(Enrollment $enrollment, LessonProgress $progressRow, User $user): array
    {
        $previousEnrollmentPct = (float) $enrollment->progress_pct;

        $totalLessons = Lesson::query()
            ->where('course_id', $enrollment->course_id)
            ->count();

        $completedLessons = LessonProgress::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('status', 'completed')
            ->count();

        $progressPct = $totalLessons > 0
            ? round(($completedLessons * 100) / $totalLessons, 2)
            : 0.0;

        $now = now();
        $enrollment->update([
            'last_accessed_at' => $now,
            'progress_pct' => $progressPct,
            'completed_at' => $progressPct >= 99.5
                ? ($enrollment->completed_at ?? $now)
                : null,
        ]);

        $hasCourseReview = $enrollment->course_id !== null
            && CourseReview::query()
                ->where('course_id', $enrollment->course_id)
                ->where('user_id', $user->id)
                ->exists();

        $canOfferCourseReview = $user->can('learning_curso_resenas.create')
            && $progressPct >= 99.5
            && ! $hasCourseReview;

        $showCourseReviewModal = $previousEnrollmentPct < 99.5
            && $progressPct >= 99.5
            && $canOfferCourseReview;

        if ($progressPct >= 99.5) {
            try {
                app(CertificateIssuer::class)->issueForEnrollment($enrollment);
            } catch (\DomainException) {
                // No interrumpir guardado de progreso si no se puede emitir aún.
            }
        }

        $hasCertificate = Certificate::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('is_revoked', false)
            ->exists();

        return [
            'status' => $progressRow->status,
            'video_position_sec' => $progressRow->video_position_sec,
            'watch_pct' => (float) $progressRow->watch_pct,
            'completed_at' => $progressRow->completed_at?->toIso8601String(),
            'first_accessed_at' => $progressRow->first_accessed_at?->toIso8601String(),
            'last_accessed_at' => $progressRow->last_accessed_at?->toIso8601String(),
            'enrollment_progress_pct' => $progressPct,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'can_offer_course_review' => $canOfferCourseReview,
            'show_course_review_modal' => $showCourseReviewModal,
            'has_certificate' => $hasCertificate,
        ];
    }

    private function resolveStatus(?string $status, int $position, float $watchPct): string
    {
        if ($status === 'completed' || $watchPct >= 99.5) {
            return 'completed';
        }

        if ($status === 'in_progress' || $position > 0 || $watchPct > 0) {
            return 'in_progress';
        }

        return 'not_started';
    }
}
