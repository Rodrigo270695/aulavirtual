<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Instructor;
use App\Support\CoursePublishedContentDuration;
use App\Support\PublicCourseData;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class PublicCatalogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'level' => ['nullable', 'string', 'in:all,beginner,intermediate,advanced,all_levels'],
            'price' => ['nullable', 'string', 'in:all,free,paid'],
            'sort' => ['nullable', 'string', 'in:popular,rating,newest,price_low,price_high'],
        ]);

        $sort = is_string($filters['sort'] ?? null) ? $filters['sort'] : 'popular';

        $coursesQuery = Course::query()
            ->with([
                'category:id,name,slug',
                'instructor:id,user_id,avg_rating,total_students,total_courses',
                'instructor.user:id,first_name,last_name',
            ])
            ->where('status', 'published')
            ->whereNotNull('published_at');

        if (is_string($filters['q'] ?? null) && $filters['q'] !== '') {
            $term = trim($filters['q']);
            $coursesQuery->where(function ($q) use ($term): void {
                $q->where('title', 'ilike', "%{$term}%")
                    ->orWhere('subtitle', 'ilike', "%{$term}%")
                    ->orWhere('description', 'ilike', "%{$term}%");
            });
        }

        if (is_string($filters['category'] ?? null) && $filters['category'] !== '') {
            $coursesQuery->whereHas('category', function ($q) use ($filters): void {
                $q->where('slug', $filters['category']);
            });
        }

        if (is_string($filters['level'] ?? null) && $filters['level'] !== '' && $filters['level'] !== 'all') {
            $coursesQuery->where('level', $filters['level']);
        }

        if (($filters['price'] ?? null) === 'free') {
            $coursesQuery->where('is_free', true);
        }

        if (($filters['price'] ?? null) === 'paid') {
            $coursesQuery->where('is_free', false);
        }

        $this->applySort($coursesQuery, $sort);

        $courses = $coursesQuery
            ->paginate(12)
            ->withQueryString();

        $courseIdsForDuration = array_values(array_unique($courses->pluck('id')->all()));
        $publishedSecondsByCourse = CoursePublishedContentDuration::publishedSecondsByCourseId($courseIdsForDuration);

        /** @var LengthAwarePaginator<int, Course> $courses */
        $courses->through(function (Course $course) use ($publishedSecondsByCourse): array {
            $seconds = (int) ($publishedSecondsByCourse[(string) $course->id] ?? 0);

            return PublicCourseData::from($course, $seconds);
        });

        $topInstructors = Instructor::query()
            ->with(['user:id,first_name,last_name'])
            ->where('status', 'active')
            ->whereHas('courses', fn ($q) => $q
                ->where('status', 'published')
                ->whereNotNull('published_at'))
            ->withCount([
                'courses as published_courses_count' => fn ($q) => $q
                    ->where('status', 'published')
                    ->whereNotNull('published_at'),
            ])
            ->orderByDesc('avg_rating')
            ->orderByDesc('total_students')
            ->limit(8)
            ->get()
            ->map(fn (Instructor $instructor): array => [
                'id' => $instructor->id,
                'name' => trim(($instructor->user?->first_name ?? '').' '.($instructor->user?->last_name ?? '')),
                'professional_title' => $instructor->professional_title,
                'avg_rating' => (float) $instructor->avg_rating,
                'total_students' => (int) $instructor->total_students,
                'published_courses_count' => (int) $instructor->published_courses_count,
            ])
            ->values();

        return Inertia::render('welcome', [
            'courses' => $courses,
            'topInstructors' => $topInstructors,
            'filters' => [
                'q' => (string) ($filters['q'] ?? ''),
                'category' => (string) ($filters['category'] ?? ''),
                'level' => (string) ($filters['level'] ?? 'all'),
                'price' => (string) ($filters['price'] ?? 'all'),
                'sort' => $sort,
            ],
            'stats' => [
                'courses' => Course::query()->where('status', 'published')->whereNotNull('published_at')->count(),
                'students' => Course::query()->where('status', 'published')->sum('total_enrolled'),
                'instructors' => Instructor::query()->where('status', 'active')->count(),
            ],
        ]);
    }

    private function applySort($query, string $sort): void
    {
        match ($sort) {
            'rating' => $query->orderByDesc('avg_rating')->orderByDesc('total_reviews'),
            'newest' => $query->orderByDesc('published_at'),
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            default => $query->orderByDesc('total_enrolled')->orderByDesc('avg_rating'),
        };
    }
}
