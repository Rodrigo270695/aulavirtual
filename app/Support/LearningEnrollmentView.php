<?php

namespace App\Support;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Filas de matrícula para la página Mi aprendizaje y el menú rápido del navbar.
 */
final class LearningEnrollmentView
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{enrollments: list<array<string, mixed>>, filterOptions: array{categories: list<array{slug: string, name: string}>, instructors: list<array{id: string, name: string}>}, filters: array<string, mixed>}
     */
    public static function forLearningPage(User $user, array $filters): array
    {
        $filterOptions = self::buildFilterOptions($user);

        $totalEnrollmentCount = Enrollment::query()
            ->where('user_id', $user->id)
            ->whereNotNull('course_id')
            ->where('status', 'active')
            ->count();

        $query = self::baseQuery($user);
        self::applyPageFilters($query, $filters);
        self::applySort($query, $filters['sort'] ?? 'recent');

        /** @var Collection<int, Enrollment> $rows */
        $rows = $query->get();

        $courseIds = $rows->map(fn (Enrollment $e): ?string => $e->course_id)->filter()->unique()->values()->all();
        $publishedSecondsByCourse = CoursePublishedContentDuration::publishedSecondsByCourseId($courseIds);

        $enrollments = $rows
            ->filter(fn (Enrollment $e): bool => $e->course !== null)
            ->map(fn (Enrollment $e): array => self::mapEnrollment($e, $publishedSecondsByCourse))
            ->values()
            ->all();

        return [
            'enrollments' => $enrollments,
            'filterOptions' => $filterOptions,
            'filters' => $filters,
            'totalEnrollmentCount' => $totalEnrollmentCount,
        ];
    }

    /**
     * Menú del navbar: los más vistos recientemente primero (sin last_accessed al final).
     *
     * @return list<array<string, mixed>>
     */
    public static function rows(User $user, ?int $limit = null): array
    {
        $query = self::baseQuery($user);
        self::applySort($query, 'recent');

        if ($limit !== null) {
            $query->limit($limit);
        }

        $rows = $query->get();

        $courseIds = $rows->map(fn (Enrollment $e): ?string => $e->course_id)->filter()->unique()->values()->all();
        $publishedSecondsByCourse = CoursePublishedContentDuration::publishedSecondsByCourseId($courseIds);

        return $rows
            ->filter(fn (Enrollment $e): bool => $e->course !== null)
            ->map(fn (Enrollment $e): array => self::mapEnrollment($e, $publishedSecondsByCourse))
            ->values()
            ->all();
    }

    private static function baseQuery(User $user): Builder
    {
        return Enrollment::query()
            ->where('user_id', $user->id)
            ->whereNotNull('course_id')
            ->where('status', 'active')
            ->with([
                'course' => fn ($q) => $q->with([
                    'category:id,name,slug',
                    'instructor.user:id,first_name,last_name',
                ]),
            ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private static function applyPageFilters(Builder $query, array $filters): void
    {
        $q = isset($filters['q']) && is_string($filters['q']) ? trim($filters['q']) : '';
        if ($q !== '') {
            $query->whereHas('course', function (Builder $courseQuery) use ($q): void {
                $courseQuery->where(function (Builder $inner) use ($q): void {
                    $inner->where('title', 'like', "%{$q}%")
                        ->orWhere('subtitle', 'like', "%{$q}%");
                });
            });
        }

        $category = isset($filters['category']) && is_string($filters['category']) ? trim($filters['category']) : '';
        if ($category !== '') {
            $query->whereHas('course.category', fn (Builder $c) => $c->where('slug', $category));
        }

        $instructor = isset($filters['instructor']) && is_string($filters['instructor']) ? trim($filters['instructor']) : '';
        if ($instructor !== '') {
            $query->whereHas('course', fn (Builder $c) => $c->where('instructor_id', $instructor));
        }

        $progress = $filters['progress'] ?? 'all';
        $progress = is_string($progress) ? $progress : 'all';

        if ($progress === 'completed') {
            $query->where(function (Builder $w): void {
                $w->whereNotNull('completed_at')
                    ->orWhere('progress_pct', '>=', 99.5);
            });
        } elseif ($progress === 'in_progress') {
            $query->whereNull('completed_at')
                ->where('progress_pct', '<', 99.5);
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private static function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'title_asc' => $query
                ->join('courses as c_sort', 'enrollments.course_id', '=', 'c_sort.id')
                ->orderBy('c_sort.title')
                ->select('enrollments.*'),
            'title_desc' => $query
                ->join('courses as c_sort', 'enrollments.course_id', '=', 'c_sort.id')
                ->orderByDesc('c_sort.title')
                ->select('enrollments.*'),
            'progress_asc' => $query
                ->orderBy('enrollments.progress_pct')
                ->orderByDesc('enrollments.enrolled_at'),
            'progress_desc' => $query
                ->orderByDesc('enrollments.progress_pct')
                ->orderByDesc('enrollments.enrolled_at'),
            'enrolled_newest' => $query
                ->orderByDesc('enrollments.enrolled_at'),
            default => $query
                ->orderByRaw('enrollments.last_accessed_at IS NULL ASC')
                ->orderByDesc('enrollments.last_accessed_at')
                ->orderByDesc('enrollments.enrolled_at'),
        };
    }

    /**
     * @return array{categories: list<array{slug: string, name: string}>, instructors: list<array{id: string, name: string}>}
     */
    private static function buildFilterOptions(User $user): array
    {
        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->whereNotNull('course_id')
            ->where('status', 'active')
            ->pluck('course_id');

        if ($courseIds->isEmpty()) {
            return ['categories' => [], 'instructors' => []];
        }

        $courses = Course::query()
            ->whereIn('id', $courseIds)
            ->with([
                'category:id,name,slug',
                'instructor.user:id,first_name,last_name',
            ])
            ->get();

        $byCat = [];
        $byIns = [];

        foreach ($courses as $course) {
            if ($course->category) {
                $byCat[$course->category->slug] = [
                    'slug' => (string) $course->category->slug,
                    'name' => (string) $course->category->name,
                ];
            }
            if ($course->instructor_id) {
                $name = trim(($course->instructor?->user?->first_name ?? '').' '.($course->instructor?->user?->last_name ?? ''));
                $byIns[(string) $course->instructor_id] = [
                    'id' => (string) $course->instructor_id,
                    'name' => $name !== '' ? $name : 'Instructor',
                ];
            }
        }

        $categories = array_values($byCat);
        usort($categories, fn ($a, $b) => strcmp($a['name'], $b['name']));

        $instructors = array_values($byIns);
        usort($instructors, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return [
            'categories' => $categories,
            'instructors' => $instructors,
        ];
    }

    /**
     * @return array{enrollment_id: string, progress_pct: float, completed_at: string|null, last_accessed_at: string|null, enrolled_at: string, course: array<string, mixed>}
     */
    /**
     * @param  array<string, int>  $publishedSecondsByCourse
     */
    private static function mapEnrollment(Enrollment $e, array $publishedSecondsByCourse = []): array
    {
        /** @var \App\Models\Course $course */
        $course = $e->course;

        $computedSeconds = (int) ($publishedSecondsByCourse[(string) $course->id] ?? 0);
        $coursePayload = PublicCourseData::from($course, $computedSeconds);

        return [
            'enrollment_id' => $e->id,
            'progress_pct' => round((float) $e->progress_pct, 2),
            'completed_at' => $e->completed_at?->toIso8601String(),
            'last_accessed_at' => $e->last_accessed_at?->toIso8601String(),
            'enrolled_at' => $e->enrolled_at?->toIso8601String() ?? now()->toIso8601String(),
            'course' => $coursePayload,
        ];
    }
}
