<?php

namespace App\Http\Controllers;

use App\Models\CourseReview;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonHomeworkDeliverable;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Support\LearningEnrollmentView;
use App\Support\QuizStudentPassingScore;
use App\Support\LessonVideoPlaybackUrl;
use App\Support\CertificateIssuer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearningController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        if ($request->input('instructor') === '') {
            $request->merge(['instructor' => null]);
        }

        if ($request->input('category') === '') {
            $request->merge(['category' => null]);
        }

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'progress' => ['nullable', 'string', 'in:all,in_progress,completed'],
            'instructor' => ['nullable', 'string', 'uuid'],
            'sort' => ['nullable', 'string', 'in:recent,title_asc,title_desc,progress_asc,progress_desc,enrolled_newest'],
        ]);

        $filters = [
            'q' => isset($validated['q']) ? trim((string) $validated['q']) : '',
            'category' => isset($validated['category']) ? trim((string) $validated['category']) : '',
            'progress' => $validated['progress'] ?? 'all',
            'instructor' => isset($validated['instructor']) ? trim((string) $validated['instructor']) : '',
            'sort' => $validated['sort'] ?? 'recent',
        ];

        if (! in_array($filters['progress'], ['all', 'in_progress', 'completed'], true)) {
            $filters['progress'] = 'all';
        }

        $allowedSort = ['recent', 'title_asc', 'title_desc', 'progress_asc', 'progress_desc', 'enrolled_newest'];
        if (! in_array($filters['sort'], $allowedSort, true)) {
            $filters['sort'] = 'recent';
        }

        return Inertia::render('learning/index', LearningEnrollmentView::forLearningPage($user, $filters));
    }

    public function show(Request $request, Enrollment $enrollment): Response
    {
        $user = $request->user();
        abort_unless($user, 403);
        $canHomeworkView = $user->can('learning_tareas_entregas.view');
        $canHomeworkCreate = $user->can('learning_tareas_entregas.create');
        $canHomeworkDelete = $user->can('learning_tareas_entregas.delete');

        if ($enrollment->user_id !== $user->id || $enrollment->status !== 'active' || $enrollment->course_id === null) {
            abort(404);
        }

        $enrollment->load([
            'course' => function ($courseQuery) use ($enrollment): void {
                $courseQuery->with([
                    'instructor.user:id,first_name,last_name',
                    'courseModules' => function ($moduleQuery) use ($enrollment): void {
                        $moduleQuery->with([
                            'lessons' => function ($lessonQuery) use ($enrollment): void {
                                $lessonQuery
                                    ->where('is_published', true)
                                    ->with([
                                        'video',
                                        'documents:id,lesson_id,title,file_path,is_downloadable',
                                        'lessonResources:id,lesson_id,resource_type,title,url',
                                        'quiz' => fn ($quizQuery) => $quizQuery->with([
                                            'questions' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at'),
                                            'questions.options' => fn ($q) => $q->orderBy('sort_order'),
                                        ]),
                                        'homeworkDeliverables' => fn ($hwQuery) => $hwQuery
                                            ->where('enrollment_id', $enrollment->id)
                                            ->orderBy('created_at'),
                                        'lessonProgress' => fn ($progressQuery) => $progressQuery
                                            ->where('enrollment_id', $enrollment->id),
                                    ]);
                            },
                        ]);
                    },
                ]);
            },
        ]);

        $course = $enrollment->course;
        abort_if($course === null, 404);

        $modules = $course->courseModules
            ->map(function ($module) use ($user, $canHomeworkView, $canHomeworkCreate, $canHomeworkDelete): array {
                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'sort_order' => (int) $module->sort_order,
                    'lessons' => $module->lessons->map(function ($lesson) use ($user, $canHomeworkView, $canHomeworkCreate, $canHomeworkDelete): array {
                        $progress = $lesson->lessonProgress->first();
                        $video = $lesson->video;

                        $fileUrl = LessonVideoPlaybackUrl::fileUrl($video);
                        $embedUrl = LessonVideoPlaybackUrl::iframeSrc($video);
                        $providerPageUrl = LessonVideoPlaybackUrl::providerPageUrl($video);

                        $lessonDuration = (int) $lesson->duration_seconds;
                        $videoDuration = $video ? (int) $video->duration_seconds : 0;
                        // La lección puede ser tipo "artículo" pero tener vídeo con duración propia en lesson_videos.
                        $durationSeconds = max($lessonDuration, $videoDuration);

                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'description' => $lesson->description,
                            'content_text' => $lesson->content_text,
                            'lesson_type' => $lesson->lesson_type,
                            'has_homework' => (bool) $lesson->has_homework,
                            'homework_title' => $lesson->homework_title,
                            'homework_instructions' => $lesson->homework_instructions,
                            'duration_seconds' => $durationSeconds,
                            'video' => $video ? [
                                'source' => $video->video_source,
                                'url' => $fileUrl,
                                'embed_url' => $embedUrl,
                                'provider_page_url' => $providerPageUrl,
                            ] : null,
                            'documents' => $lesson->documents->map(fn ($document): array => [
                                'id' => $document->id,
                                'title' => $document->title,
                                'url' => asset('storage/'.$document->file_path),
                                'is_downloadable' => (bool) $document->is_downloadable,
                            ])->values()->all(),
                            'resources' => $lesson->lessonResources->map(fn ($resource): array => [
                                'id' => $resource->id,
                                'title' => $resource->title,
                                'url' => $resource->url,
                                'resource_type' => $resource->resource_type,
                            ])->values()->all(),
                            'quiz' => $lesson->lesson_type === 'quiz' ? self::serializeStudentQuiz($lesson, (string) $user->id) : null,
                            'homework_can' => [
                                'view' => $canHomeworkView,
                                'create' => $canHomeworkCreate,
                                'delete' => $canHomeworkDelete,
                            ],
                            'homework_deliverables' => $canHomeworkView
                                ? $lesson->homeworkDeliverables->map(fn (LessonHomeworkDeliverable $d): array => [
                                    'id' => $d->id,
                                    'title' => $d->original_filename,
                                    'url' => asset('storage/'.$d->file_path),
                                ])->values()->all()
                                : [],
                            'progress' => [
                                'status' => $progress?->status ?? 'not_started',
                                'watch_pct' => round((float) ($progress?->watch_pct ?? 0), 2),
                                'video_position_sec' => (int) ($progress?->video_position_sec ?? 0),
                                'completed_at' => $progress?->completed_at?->toIso8601String(),
                            ],
                        ];
                    })->values()->all(),
                ];
            })
            ->values()
            ->all();

        $initialLessonId = (string) $request->query('lesson', '');

        $hasCourseReview = CourseReview::query()
            ->where('course_id', $course->id)
            ->where('user_id', $user->id)
            ->exists();

        $progressPct = round((float) $enrollment->progress_pct, 2);

        if ($progressPct >= 99.5) {
            try {
                app(CertificateIssuer::class)->issueForEnrollment($enrollment);
            } catch (\DomainException) {
                // No bloquear aula si la emisión falla por validaciones.
            }
        }

        $hasCertificate = Certificate::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('is_revoked', false)
            ->exists();

        return Inertia::render('learning/lesson-player', [
            'enrollment' => [
                'id' => $enrollment->id,
                'progress_pct' => $progressPct,
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'cover_image_url' => $course->cover_image
                        ? asset('storage/'.$course->cover_image)
                        : null,
                    'instructor' => [
                        'name' => trim(($course->instructor?->user?->first_name ?? '').' '.($course->instructor?->user?->last_name ?? '')),
                    ],
                ],
                'review' => [
                    'can_create' => $user->can('learning_curso_resenas.create'),
                    'eligible' => $progressPct >= 99.5,
                    'has_review' => $hasCourseReview,
                ],
                'certificate' => [
                    'eligible' => $progressPct >= 99.5,
                    'has_certificate' => $hasCertificate,
                    'show_url' => route('learning.certificate.show', ['enrollment' => $enrollment->id]),
                    'generate_url' => route('learning.certificate.generate', ['enrollment' => $enrollment->id]),
                ],
            ],
            'modules' => $modules,
            'initialLessonId' => $initialLessonId,
        ]);
    }

    /**
     * Cuestionario para el alumno (sin marcar opciones correctas). Incluye intentos previos y si puede enviar.
     *
     * @return array<string, mixed>|null
     */
    private static function serializeStudentQuiz(Lesson $lesson, string $userId): ?array
    {
        /** @var Quiz|null $quiz */
        $quiz = $lesson->quiz;
        if ($quiz === null) {
            return null;
        }

        $quiz->purgeStaleTimedInProgressAttemptsFor($userId);

        $attemptRows = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $userId)
            ->where('status', 'submitted')
            ->orderBy('attempt_number')
            ->limit(30)
            ->get(['attempt_number', 'score', 'is_passed', 'submitted_at', 'obtained_points', 'total_points']);

        $attemptsUsed = $attemptRows->count();
        $maxAttempts = (int) $quiz->max_attempts;
        $effectivePassing = QuizStudentPassingScore::effectiveThreshold($quiz);
        $hasPassed = $attemptRows->contains(
            fn ($a): bool => (float) ($a->score ?? 0) + 0.0001 >= $effectivePassing,
        );
        $bestScorePct = $attemptRows->isEmpty()
            ? 0.0
            : round((float) $attemptRows->max('score'), 2);
        $hasPerfectScore = $bestScorePct + 0.001 >= 100.0;
        $canSubmit = $quiz->is_active
            && ! $hasPerfectScore
            && ($maxAttempts === 0 || $attemptsUsed < $maxAttempts);

        $limitMin = (int) ($quiz->time_limit_minutes ?? 0);
        $activeTimed = null;
        if ($limitMin > 0 && $canSubmit) {
            $inProgress = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $userId)
                ->where('status', 'in_progress')
                ->orderByDesc('started_at')
                ->first(['id', 'attempt_number', 'started_at']);

            if ($inProgress !== null) {
                $deadline = $inProgress->started_at->copy()->addMinutes($limitMin);
                if (now()->lessThanOrEqualTo($deadline)) {
                    $activeTimed = [
                        'id' => $inProgress->id,
                        'attempt_number' => (int) $inProgress->attempt_number,
                        'started_at' => $inProgress->started_at->toIso8601String(),
                        'deadline_at' => $deadline->toIso8601String(),
                    ];
                } else {
                    $inProgress->delete();
                }
            }
        }

        $showAnswersAfter = (string) ($quiz->show_answers_after ?? 'submission');
        if (! in_array($showAnswersAfter, ['never', 'submission', 'passed'], true)) {
            $showAnswersAfter = 'submission';
        }

        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'is_active' => (bool) $quiz->is_active,
            'passing_score' => $effectivePassing,
            'show_answers_after' => $showAnswersAfter,
            'time_limit_minutes' => $quiz->time_limit_minutes,
            'max_attempts' => $quiz->max_attempts,
            'attempts_used' => $attemptsUsed,
            'can_submit' => $canSubmit,
            'has_passed' => $hasPassed,
            'best_score_pct' => $bestScorePct,
            'has_perfect_score' => $hasPerfectScore,
            'active_timed_attempt' => $activeTimed,
            'attempts' => $attemptRows->map(fn ($a): array => [
                'attempt_number' => (int) $a->attempt_number,
                'score_pct' => round((float) ($a->score ?? 0), 2),
                'is_passed' => (float) ($a->score ?? 0) + 0.0001 >= $effectivePassing,
                'submitted_at' => $a->submitted_at?->toIso8601String(),
                'obtained_points' => round((float) $a->obtained_points, 2),
                'total_points' => round((float) $a->total_points, 2),
            ])->values()->all(),
            'questions' => $quiz->questions->map(fn ($q): array => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'question_type' => $q->question_type,
                'points' => (float) $q->points,
                'sort_order' => (int) $q->sort_order,
                'options' => $q->options->map(fn ($o): array => [
                    'id' => $o->id,
                    'option_text' => $o->option_text,
                ])->values()->all(),
            ])->values()->all(),
        ];
    }
}
