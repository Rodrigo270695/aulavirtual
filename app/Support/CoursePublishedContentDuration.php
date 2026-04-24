<?php

namespace App\Support;

use App\Models\Lesson;
use Illuminate\Support\Collection;

/**
 * Suma de duraciones por curso a partir de lecciones publicadas (max entre lección y vídeo asociado).
 * Evita depender solo de {@see \App\Models\Course::$duration_hours}, que puede no estar sincronizado.
 */
final class CoursePublishedContentDuration
{
    /**
     * @param  list<string>  $courseIds
     * @return array<string, int> course_id => segundos totales
     */
    public static function publishedSecondsByCourseId(array $courseIds): array
    {
        if ($courseIds === []) {
            return [];
        }

        $ids = array_values(array_unique($courseIds));

        /** @var Collection<int, Lesson> $lessons */
        $lessons = Lesson::query()
            ->whereIn('course_id', $ids)
            ->where('is_published', true)
            ->with('video:id,lesson_id,duration_seconds')
            ->get(['id', 'course_id', 'duration_seconds']);

        $totals = [];
        foreach ($lessons as $lesson) {
            $courseId = (string) $lesson->course_id;
            $videoSeconds = (int) ($lesson->video?->duration_seconds ?? 0);
            $seconds = max((int) $lesson->duration_seconds, $videoSeconds);
            $totals[$courseId] = ($totals[$courseId] ?? 0) + $seconds;
        }

        return $totals;
    }
}
