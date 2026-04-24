<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonQuizRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\Quiz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CourseLessonQuizController extends Controller
{
    use VerifiesNestedLesson;

    public function show(Course $course, CourseModule $courseModule, Lesson $lesson): Response
    {
        $this->authorize('cursos_lecciones_quizzes.view');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();

        $quiz = $lesson->quiz()
            ->with(['questions' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at'), 'questions.options'])
            ->first();

        $course->loadMissing(['category:id,name,slug']);

        return Inertia::render('admin/courses/modules/lesson-quiz', [
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
                'lesson_type' => $lesson->lesson_type,
                'sort_order' => $lesson->sort_order,
            ],
            'quiz' => $quiz,
            'quizCan' => [
                'view' => $auth?->can('cursos_lecciones_quizzes.view') ?? false,
                'create' => $auth?->can('cursos_lecciones_quizzes.create') ?? false,
                'edit' => $auth?->can('cursos_lecciones_quizzes.edit') ?? false,
                'delete' => $auth?->can('cursos_lecciones_quizzes.delete') ?? false,
            ],
        ]);
    }

    public function store(CourseLessonQuizRequest $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_quizzes.create');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);
        abort_if($lesson->quiz()->exists(), 403, 'Esta lección ya tiene un cuestionario. Usa «Actualizar».');

        $data = $request->validated();
        $data['course_id'] = $course->id;
        $data['module_id'] = $courseModule->id;
        $data['lesson_id'] = $lesson->id;
        $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        $data['shuffle_options'] = $request->boolean('shuffle_options');
        $data['is_active'] = $request->boolean('is_active', true);

        Quiz::create($data);

        return back()->with('success', 'Cuestionario creado. Añade preguntas abajo.');
    }

    public function update(CourseLessonQuizRequest $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_quizzes.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        $quiz = $lesson->quiz;
        abort_if($quiz === null, 404);

        $data = $request->validated();
        $data['shuffle_questions'] = $request->boolean('shuffle_questions');
        $data['shuffle_options'] = $request->boolean('shuffle_options');
        $data['is_active'] = $request->boolean('is_active', true);

        $quiz->update($data);

        return back()->with('success', 'Cuestionario actualizado.');
    }

    public function destroy(Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_quizzes.delete');
        $this->assertLessonContext($course, $courseModule, $lesson);

        abort_unless($lesson->lesson_type === 'quiz', 404);

        $quiz = $lesson->quiz;
        abort_if($quiz === null, 404);

        $quiz->delete();

        return back()->with('success', 'Cuestionario eliminado. Puedes crear uno nuevo.');
    }
}
