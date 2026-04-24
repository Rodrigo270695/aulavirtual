<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonHomeworkDeliverable;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CourseEnrollmentController extends Controller
{
    public function index(Request $request, Course $course): Response
    {
        $this->authorize('cursos_matriculas.view');

        $perPage = (int) $request->input('per_page', 25);
        if (! in_array($perPage, [5, 10, 15, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $enrollments = Enrollment::query()
            ->where('course_id', $course->id)
            ->with(['user:id,first_name,last_name,email'])
            ->orderByDesc('enrolled_at')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $enrollmentIds = $enrollments->getCollection()->pluck('id')->all();
        $summaries = $this->summariesForEnrollments($course, $enrollmentIds);

        $enrollments->setCollection(
            $enrollments->getCollection()->map(function (Enrollment $e) use ($summaries): array {
                $row = $e->toArray();
                $row['tracking_summary'] = $summaries[$e->id] ?? [
                    'lessons_total' => 0,
                    'lessons_completed' => 0,
                    'homework_lessons_total' => 0,
                    'homework_submitted_lessons' => 0,
                ];

                return $row;
            }),
        );

        $course->loadMissing(['category:id,name,slug']);

        return Inertia::render('admin/courses/enrollments/index', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'category' => $course->category,
            ],
            'enrollments' => $enrollments,
            'filters' => [
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Detalle de progreso por lección y entregas de tarea (JSON para el panel admin).
     */
    public function tracking(Course $course, Enrollment $enrollment): JsonResponse
    {
        $this->authorize('cursos_matriculas.view');

        abort_unless(
            $enrollment->course_id !== null && (string) $enrollment->course_id === (string) $course->id,
            404,
        );

        $enrollment->load(['user:id,first_name,last_name,email']);

        $course->load([
            'courseModules' => function ($q): void {
                $q->orderBy('sort_order')->orderBy('created_at')
                    ->with(['lessons' => function ($lq): void {
                        $lq->orderBy('sort_order')->orderBy('created_at');
                    }]);
            },
        ]);

        $lessonIds = $course->courseModules->flatMap(fn ($m) => $m->lessons->pluck('id'))->all();

        $progressByLesson = $lessonIds === []
            ? collect()
            : LessonProgress::query()
                ->where('enrollment_id', $enrollment->id)
                ->whereIn('lesson_id', $lessonIds)
                ->get()
                ->keyBy('lesson_id');

        $deliverablesByLesson = $lessonIds === []
            ? collect()
            : LessonHomeworkDeliverable::query()
                ->where('enrollment_id', $enrollment->id)
                ->whereIn('lesson_id', $lessonIds)
                ->orderBy('created_at')
                ->get()
                ->groupBy('lesson_id');

        $modules = $course->courseModules->map(function ($module) use ($progressByLesson, $deliverablesByLesson): array {
            return [
                'id' => $module->id,
                'title' => $module->title,
                'sort_order' => (int) $module->sort_order,
                'lessons' => $module->lessons->map(function ($lesson) use ($progressByLesson, $deliverablesByLesson): array {
                    /** @var LessonProgress|null $progress */
                    $progress = $progressByLesson->get($lesson->id);
                    /** @var Collection<int, LessonHomeworkDeliverable>|null $deliverables */
                    $deliverables = $deliverablesByLesson->get($lesson->id);

                    return [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'lesson_type' => $lesson->lesson_type,
                        'is_published' => (bool) $lesson->is_published,
                        'has_homework' => (bool) $lesson->has_homework,
                        'homework_title' => $lesson->homework_title,
                        'progress' => [
                            'status' => $progress?->status ?? 'not_started',
                            'watch_pct' => round((float) ($progress?->watch_pct ?? 0), 2),
                            'video_position_sec' => (int) ($progress?->video_position_sec ?? 0),
                            'completed_at' => $progress?->completed_at?->toIso8601String(),
                            'last_accessed_at' => $progress?->last_accessed_at?->toIso8601String(),
                        ],
                        'deliverables' => $deliverables
                            ? $deliverables->map(fn (LessonHomeworkDeliverable $d): array => [
                                'id' => $d->id,
                                'original_filename' => $d->original_filename,
                                'url' => asset('storage/'.$d->file_path),
                                'file_size_bytes' => $d->file_size_bytes,
                                'created_at' => $d->created_at?->toIso8601String(),
                            ])->values()->all()
                            : [],
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        $publishedLessonIds = $course->courseModules
            ->flatMap(fn ($m) => $m->lessons->where('is_published', true)->pluck('id'));

        $lessonsTotal = $publishedLessonIds->count();
        $lessonsCompleted = $publishedLessonIds->isEmpty()
            ? 0
            : LessonProgress::query()
                ->where('enrollment_id', $enrollment->id)
                ->whereIn('lesson_id', $publishedLessonIds->all())
                ->where('status', 'completed')
                ->count();

        $homeworkLessonIds = $course->courseModules
            ->flatMap(fn ($m) => $m->lessons->where('is_published', true)->where('has_homework', true)->pluck('id'));

        $homeworkLessonsTotal = $homeworkLessonIds->count();
        $homeworkSubmittedLessons = $homeworkLessonIds->isEmpty()
            ? 0
            : (int) LessonHomeworkDeliverable::query()
                ->where('enrollment_id', $enrollment->id)
                ->whereIn('lesson_id', $homeworkLessonIds->all())
                ->selectRaw('count(distinct lesson_id) as c')
                ->value('c');

        return response()->json([
            'enrollment' => [
                'id' => $enrollment->id,
                'progress_pct' => round((float) $enrollment->progress_pct, 2),
                'user' => $enrollment->user,
            ],
            'summary' => [
                'lessons_total' => $lessonsTotal,
                'lessons_completed' => $lessonsCompleted,
                'homework_lessons_total' => $homeworkLessonsTotal,
                'homework_submitted_lessons' => $homeworkSubmittedLessons,
            ],
            'modules' => $modules,
        ]);
    }

    /**
     * @param  list<string>  $enrollmentIds
     * @return array<string, array{lessons_total: int, lessons_completed: int, homework_lessons_total: int, homework_submitted_lessons: int}>
     */
    private function summariesForEnrollments(Course $course, array $enrollmentIds): array
    {
        if ($enrollmentIds === []) {
            return [];
        }

        $publishedLessonIds = Lesson::query()
            ->where('course_id', $course->id)
            ->where('is_published', true)
            ->pluck('id');

        $lessonsTotal = $publishedLessonIds->count();

        $homeworkLessonIds = Lesson::query()
            ->where('course_id', $course->id)
            ->where('is_published', true)
            ->where('has_homework', true)
            ->pluck('id');

        $homeworkLessonsTotal = $homeworkLessonIds->count();

        $completedByEnrollment = $publishedLessonIds->isEmpty()
            ? collect()
            : LessonProgress::query()
                ->whereIn('enrollment_id', $enrollmentIds)
                ->whereIn('lesson_id', $publishedLessonIds->all())
                ->where('status', 'completed')
                ->selectRaw('enrollment_id, count(*) as c')
                ->groupBy('enrollment_id')
                ->pluck('c', 'enrollment_id');

        $homeworkSubmittedByEnrollment = $homeworkLessonIds->isEmpty()
            ? collect()
            : LessonHomeworkDeliverable::query()
                ->whereIn('enrollment_id', $enrollmentIds)
                ->whereIn('lesson_id', $homeworkLessonIds->all())
                ->selectRaw('enrollment_id, count(distinct lesson_id) as c')
                ->groupBy('enrollment_id')
                ->pluck('c', 'enrollment_id');

        $out = [];
        foreach ($enrollmentIds as $id) {
            $out[$id] = [
                'lessons_total' => $lessonsTotal,
                'lessons_completed' => (int) ($completedByEnrollment[$id] ?? 0),
                'homework_lessons_total' => $homeworkLessonsTotal,
                'homework_submitted_lessons' => (int) ($homeworkSubmittedByEnrollment[$id] ?? 0),
            ];
        }

        return $out;
    }
}
