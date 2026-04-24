<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseFichaItemsRequest;
use App\Models\Course;
use App\Models\CourseObjective;
use App\Models\CourseRequirement;
use App\Models\CourseTargetAudience;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CourseFichaController extends Controller
{
    public function show(Course $course): Response
    {
        $this->authorize('cursos_ficha.view');

        $course->load([
            'category:id,name,slug',
            'requirements' => fn ($q) => $q->orderBy('sort_order'),
            'objectives' => fn ($q) => $q->orderBy('sort_order'),
            'targetAudiences' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();

        return Inertia::render('admin/courses/ficha/index', [
            'course' => [
                'id'          => $course->id,
                'title'       => $course->title,
                'slug'        => $course->slug,
                'category'    => $course->category,
                'requirements' => $course->requirements->map(fn (CourseRequirement $r) => [
                    'id'          => $r->id,
                    'description' => $r->description,
                    'sort_order'  => $r->sort_order,
                ])->values(),
                'objectives' => $course->objectives->map(fn (CourseObjective $o) => [
                    'id'          => $o->id,
                    'description' => $o->description,
                    'sort_order'  => $o->sort_order,
                ])->values(),
                'target_audiences' => $course->targetAudiences->map(fn (CourseTargetAudience $t) => [
                    'id'          => $t->id,
                    'description' => $t->description,
                    'sort_order'  => $t->sort_order,
                ])->values(),
            ],
            'can' => [
                'edit' => $auth?->can('cursos_ficha.edit') ?? false,
            ],
        ]);
    }

    public function updateRequirements(CourseFichaItemsRequest $request, Course $course): RedirectResponse
    {
        $this->authorize('cursos_ficha.edit');
        $this->replaceItems($course, CourseRequirement::class, $request->validated()['items']);

        return back()->with('success', 'Requisitos previos actualizados.');
    }

    public function updateObjectives(CourseFichaItemsRequest $request, Course $course): RedirectResponse
    {
        $this->authorize('cursos_ficha.edit');
        $this->replaceItems($course, CourseObjective::class, $request->validated()['items']);

        return back()->with('success', 'Objetivos de aprendizaje actualizados.');
    }

    public function updateTargetAudiences(CourseFichaItemsRequest $request, Course $course): RedirectResponse
    {
        $this->authorize('cursos_ficha.edit');
        $this->replaceItems($course, CourseTargetAudience::class, $request->validated()['items']);

        return back()->with('success', 'Público objetivo actualizado.');
    }

    /**
     * @param  array<int, array{description: string}>  $items
     */
    private function replaceItems(Course $course, string $modelClass, array $items): void
    {
        $modelClass::query()->where('course_id', $course->id)->delete();

        foreach (array_values($items) as $index => $row) {
            $modelClass::create([
                'course_id'   => $course->id,
                'description' => $row['description'],
                'sort_order'  => $index,
            ]);
        }
    }
}
