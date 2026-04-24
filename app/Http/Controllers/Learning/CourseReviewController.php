<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\StoreCourseReviewRequest;
use App\Models\CourseReview;
use App\Models\Enrollment;
use App\Support\CourseReviewStats;
use Illuminate\Http\JsonResponse;

class CourseReviewController extends Controller
{
    public function store(StoreCourseReviewRequest $request, Enrollment $enrollment): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        abort_unless(
            $enrollment->user_id === $user->id
            && $enrollment->status === 'active'
            && $enrollment->course_id !== null,
            404,
        );

        $enrollment->refresh();

        if ((float) $enrollment->progress_pct < 99.5) {
            return response()->json([
                'ok' => false,
                'message' => 'Completa el curso antes de dejar una reseña.',
            ], 422);
        }

        $courseId = (string) $enrollment->course_id;

        $validated = $request->validated();

        CourseReview::query()->updateOrCreate(
            [
                'course_id' => $courseId,
                'user_id' => $user->id,
            ],
            [
                'enrollment_id' => $enrollment->id,
                'rating' => (int) $validated['rating'],
                'title' => isset($validated['title']) ? trim((string) $validated['title']) ?: null : null,
                'review_text' => isset($validated['review_text']) ? trim((string) $validated['review_text']) ?: null : null,
                'status' => 'published',
            ],
        );

        CourseReviewStats::refreshForCourse($courseId);

        return response()->json(['ok' => true]);
    }
}
