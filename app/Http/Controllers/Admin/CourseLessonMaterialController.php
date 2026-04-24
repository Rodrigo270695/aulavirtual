<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CourseLessonMaterialController extends Controller
{
    use VerifiesNestedLesson;

    public function show(Course $course, CourseModule $courseModule, Lesson $lesson): Response
    {
        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();

        $canOpen = ($auth?->can('cursos_lecciones_documentos.view') ?? false)
            || ($auth?->can('cursos_lecciones_recursos.view') ?? false)
            || ($auth?->can('cursos_lecciones_videos.view') ?? false)
            || ($auth?->can('cursos_lecciones_tareas.view') ?? false)
            || ($auth?->can('cursos_lecciones.edit') ?? false);

        abort_unless($canOpen, 403);

        $this->assertLessonContext($course, $courseModule, $lesson);

        $canDocView = $auth?->can('cursos_lecciones_documentos.view') ?? false;
        $canResView = $auth?->can('cursos_lecciones_recursos.view') ?? false;
        $canVideoView = $auth?->can('cursos_lecciones_videos.view') ?? false;

        if ($canDocView) {
            $lesson->loadMissing(['documents' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at')]);
        } else {
            $lesson->setRelation('documents', collect());
        }

        if ($canResView) {
            $lesson->loadMissing(['lessonResources' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at')]);
        } else {
            $lesson->setRelation('lessonResources', collect());
        }

        $videoPayload = null;
        if ($canVideoView) {
            $lesson->loadMissing('video');
            $videoPayload = $lesson->video;
        }

        $course->loadMissing(['category:id,name,slug']);

        return Inertia::render('admin/courses/modules/lesson-materials', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'category' => $course->category,
            ],
            'module' => [
                'id' => $courseModule->id,
                'title' => $courseModule->title,
            ],
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'content_text' => $lesson->content_text,
                'homework_title' => $lesson->homework_title,
                'homework_instructions' => $lesson->homework_instructions,
                'lesson_type' => $lesson->lesson_type,
                'sort_order' => $lesson->sort_order,
                'has_homework' => (bool) $lesson->has_homework,
            ],
            'documents' => $lesson->documents,
            'resources' => $lesson->lessonResources,
            'video' => $videoPayload,
            'videoCan' => [
                'view' => $canVideoView,
                'create' => $auth?->can('cursos_lecciones_videos.create') ?? false,
                'edit' => $auth?->can('cursos_lecciones_videos.edit') ?? false,
                'delete' => $auth?->can('cursos_lecciones_videos.delete') ?? false,
            ],
            'documentsCan' => [
                'view' => $canDocView,
                'create' => $auth?->can('cursos_lecciones_documentos.create') ?? false,
                'edit' => $auth?->can('cursos_lecciones_documentos.edit') ?? false,
                'delete' => $auth?->can('cursos_lecciones_documentos.delete') ?? false,
            ],
            'resourcesCan' => [
                'view' => $canResView,
                'create' => $auth?->can('cursos_lecciones_recursos.create') ?? false,
                'edit' => $auth?->can('cursos_lecciones_recursos.edit') ?? false,
                'delete' => $auth?->can('cursos_lecciones_recursos.delete') ?? false,
            ],
            'homeworkCan' => [
                'view' => $auth?->can('cursos_lecciones_tareas.view') ?? false,
                'create' => $auth?->can('cursos_lecciones_tareas.create') ?? false,
                'edit' => $auth?->can('cursos_lecciones_tareas.edit') ?? false,
                'delete' => $auth?->can('cursos_lecciones_tareas.delete') ?? false,
            ],
        ]);
    }
}
