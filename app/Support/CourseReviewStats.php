<?php

namespace App\Support;

use App\Models\Course;
use App\Models\CourseReview;

/**
 * Mantiene {@see Course::$avg_rating} y {@see Course::$total_reviews} alineados con reseñas publicadas.
 */
final class CourseReviewStats
{
    public static function refreshForCourse(string $courseId): void
    {
        $avg = CourseReview::query()
            ->where('course_id', $courseId)
            ->where('status', 'published')
            ->avg('rating');

        $count = CourseReview::query()
            ->where('course_id', $courseId)
            ->where('status', 'published')
            ->count();

        Course::query()->whereKey($courseId)->update([
            'avg_rating' => round((float) ($avg ?? 0), 2),
            'total_reviews' => $count,
        ]);
    }
}
