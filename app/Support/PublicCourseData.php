<?php

namespace App\Support;

use App\Models\Course;
use Illuminate\Support\Facades\Storage;

/**
 * Formato de curso expuesto al catálogo público y al carrito (misma forma que espera el frontend).
 */
final class PublicCourseData
{
    /**
     * @param  int  $publishedLessonSecondsTotal  Suma de segundos de lecciones publicadas (vídeo vs lección, el mayor).
     */
    public static function from(Course $course, int $publishedLessonSecondsTotal = 0): array
    {
        $price = (float) $course->price;
        $discountPrice = $course->discount_price !== null ? (float) $course->discount_price : null;
        $effectivePrice = $course->is_free ? 0 : ($discountPrice ?? $price);

        $storedHours = (float) $course->duration_hours;
        $computedHours = $publishedLessonSecondsTotal > 0 ? $publishedLessonSecondsTotal / 3600 : 0.0;
        $durationHours = max($storedHours, $computedHours);

        return [
            'id' => $course->id,
            'slug' => $course->slug,
            'title' => $course->title,
            'subtitle' => $course->subtitle,
            'description' => $course->description,
            'level' => $course->level,
            'level_label' => self::levelLabel((string) $course->level),
            'cover_image_url' => self::coverImageUrl($course->cover_image),
            'is_free' => (bool) $course->is_free,
            'price' => $price,
            'discount_price' => $discountPrice,
            'effective_price' => $effectivePrice,
            'currency' => (string) $course->currency,
            'avg_rating' => (float) $course->avg_rating,
            'total_reviews' => (int) $course->total_reviews,
            'total_enrolled' => (int) $course->total_enrolled,
            'total_lessons' => (int) $course->total_lessons,
            'total_modules' => (int) $course->total_modules,
            'duration_hours' => $durationHours,
            'category' => [
                'name' => $course->category?->name,
                'slug' => $course->category?->slug,
            ],
            'instructor' => [
                'name' => trim(($course->instructor?->user?->first_name ?? '').' '.($course->instructor?->user?->last_name ?? '')),
            ],
        ];
    }

    private static function levelLabel(string $level): string
    {
        return match ($level) {
            'beginner' => 'Principiante',
            'intermediate' => 'Intermedio',
            'advanced' => 'Avanzado',
            default => 'Todos los niveles',
        };
    }

    private static function coverImageUrl(?string $coverImage): ?string
    {
        if ($coverImage === null || $coverImage === '') {
            return null;
        }

        if (str_starts_with($coverImage, 'http://') || str_starts_with($coverImage, 'https://')) {
            return $coverImage;
        }

        return Storage::disk('public')->url($coverImage);
    }
}
