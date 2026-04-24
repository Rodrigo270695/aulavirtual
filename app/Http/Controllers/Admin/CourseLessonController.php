<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseLessonRequest;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseLessonController extends Controller
{
    public function store(CourseLessonRequest $request, Course $course, CourseModule $courseModule): RedirectResponse
    {
        $this->authorize('cursos_lecciones.create');
        $this->assertModuleBelongsToCourse($course, $courseModule);

        $validated = $request->validated();
        unset($validated['sort_order']);

        $validated['sort_order'] = (int) $courseModule->lessons()->max('sort_order') + 1;
        $validated['module_id'] = $courseModule->id;
        $validated['course_id'] = $course->id;

        Lesson::create($validated);
        $this->syncLessonCounts($course, $courseModule);

        return back()->with('success', 'Lección creada correctamente.');
    }

    public function update(
        CourseLessonRequest $request,
        Course $course,
        CourseModule $courseModule,
        Lesson $lesson,
    ): RedirectResponse {
        $this->authorize('cursos_lecciones.edit');
        $this->assertModuleBelongsToCourse($course, $courseModule);
        $this->assertLessonBelongsToModule($courseModule, $lesson);

        $lesson->update($request->validated());
        $this->syncLessonCounts($course, $courseModule);

        return back()->with('success', 'Lección actualizada correctamente.');
    }

    public function destroy(Course $course, CourseModule $courseModule, Lesson $lesson): RedirectResponse
    {
        $this->authorize('cursos_lecciones.delete');
        $this->assertModuleBelongsToCourse($course, $courseModule);
        $this->assertLessonBelongsToModule($courseModule, $lesson);

        $lesson->delete();
        $this->renumberLessonSortOrder($courseModule);
        $this->syncLessonCounts($course, $courseModule);

        return back()->with('success', 'Lección eliminada correctamente.');
    }

    public function reorder(Request $request, Course $course, CourseModule $courseModule): RedirectResponse
    {
        $this->authorize('cursos_lecciones.edit');
        $this->assertModuleBelongsToCourse($course, $courseModule);

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['uuid', 'distinct'],
        ]);

        $ids = $validated['order'];
        $total = $courseModule->lessons()->count();

        if (count($ids) !== $total) {
            return back()->with('error', 'Debes enviar todas las lecciones del módulo en el nuevo orden.');
        }

        $existing = $courseModule->lessons()->whereIn('id', $ids)->pluck('id')->all();

        if (count($existing) !== count($ids)) {
            return back()->with('error', 'El orden enviado no coincide con las lecciones del módulo.');
        }

        DB::transaction(function () use ($courseModule, $ids): void {
            foreach ($ids as $index => $id) {
                Lesson::query()
                    ->where('module_id', $courseModule->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Orden de lecciones actualizado.');
    }

    private function assertModuleBelongsToCourse(Course $course, CourseModule $module): void
    {
        if ($module->course_id !== $course->id) {
            abort(404);
        }
    }

    private function assertLessonBelongsToModule(CourseModule $module, Lesson $lesson): void
    {
        if ($lesson->module_id !== $module->id || $lesson->course_id !== $module->course_id) {
            abort(404);
        }
    }

    private function renumberLessonSortOrder(CourseModule $module): void
    {
        $lessons = $module->lessons()->orderBy('sort_order')->orderBy('created_at')->get();
        foreach ($lessons as $index => $row) {
            $row->update(['sort_order' => $index + 1]);
        }
    }

    private function syncLessonCounts(Course $course, CourseModule $module): void
    {
        $module->update([
            'total_lessons' => $module->lessons()->count(),
        ]);

        $course->update([
            'total_lessons' => Lesson::query()->where('course_id', $course->id)->count(),
        ]);
    }
}
