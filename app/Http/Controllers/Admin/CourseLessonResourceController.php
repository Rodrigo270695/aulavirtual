<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\VerifiesNestedLesson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonResourceRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseLessonResourceController extends Controller
{
    use VerifiesNestedLesson;

    public function store(CourseLessonResourceRequest $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_recursos.create');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $validated = $request->validated();
        unset($validated['sort_order']);

        $validated['lesson_id'] = $lesson->id;
        $validated['sort_order'] = (int) $lesson->lessonResources()->max('sort_order') + 1;

        LessonResource::create($validated);

        return back()->with('success', 'Recurso añadido correctamente.');
    }

    public function update(
        CourseLessonResourceRequest $request,
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
        LessonResource $lessonResource,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_recursos.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);
        $this->assertResourceBelongsToLesson($lesson, $lessonResource);

        $lessonResource->update($request->validated());

        return back()->with('success', 'Recurso actualizado correctamente.');
    }

    public function destroy(
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
        LessonResource $lessonResource,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones_recursos.delete');
        $this->assertLessonContext($course, $courseModule, $lesson);
        $this->assertResourceBelongsToLesson($lesson, $lessonResource);

        $lessonResource->delete();
        $this->renumberResourceSortOrder($lesson);

        return back()->with('success', 'Recurso eliminado correctamente.');
    }

    public function reorder(Request $request, Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones_recursos.edit');
        $this->assertLessonContext($course, $courseModule, $lesson);

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['uuid', 'distinct'],
        ]);

        $ids = $validated['order'];
        $total = $lesson->lessonResources()->count();

        if (count($ids) !== $total) {
            return back()->with('error', 'Debes enviar todos los recursos de la lección en el nuevo orden.');
        }

        $existing = $lesson->lessonResources()->whereIn('id', $ids)->pluck('id')->all();

        if (count($existing) !== count($ids)) {
            return back()->with('error', 'El orden enviado no coincide con los recursos de la lección.');
        }

        DB::transaction(function () use ($lesson, $ids): void {
            foreach ($ids as $index => $id) {
                LessonResource::query()
                    ->where('lesson_id', $lesson->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Orden de recursos actualizado.');
    }

    private function renumberResourceSortOrder(Lesson $lesson): void
    {
        $rows = $lesson->lessonResources()->orderBy('sort_order')->orderBy('created_at')->get();
        foreach ($rows as $index => $row) {
            $row->update(['sort_order' => $index + 1]);
        }
    }
}
