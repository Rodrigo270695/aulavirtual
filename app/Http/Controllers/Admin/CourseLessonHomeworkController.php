<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonHomeworkRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;

class CourseLessonHomeworkController extends Controller
{
    use VerifiesNestedLesson;

    public function update(
        CourseLessonHomeworkRequest $request,
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_tareas.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $data = $request->validated();
        $lesson->update([
            'has_homework' => true,
            'homework_title' => $data['homework_title'] ?? null,
            'homework_instructions' => $data['homework_instructions'] ?? null,
        ]);

        return back()->with('success', 'Tarea de la lección actualizada.');
    }

    public function destroy(Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_tareas.delete');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $lesson->update([
            'has_homework' => false,
            'homework_title' => null,
            'homework_instructions' => null,
        ]);

        return back()->with('success', 'Tarea de la lección eliminada.');
    }
}

