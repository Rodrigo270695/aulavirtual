<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseModuleRequest;
use App\Models\Course;
use App\Models\CourseModule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CourseModuleController extends Controller
{
    public function index(Course $course): Response
    {
        $this->authorize('cursos_modulos.view');

        $course->load(['category:id,name,slug']);

        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();
        $canViewLessons = $auth?->can('cursos_lecciones.view') ?? false;

        $modulesQuery = $course->courseModules()
            ->orderBy('sort_order')
            ->orderBy('created_at');

        if ($canViewLessons) {
            $modulesQuery->with([
                'lessons' => fn ($q) => $q
                    ->orderBy('sort_order')
                    ->orderBy('created_at')
                    ->with(['video:id,lesson_id,duration_seconds'])
                    ->withCount([
                        'documents',
                        'lessonResources as resources_count',
                        'video',
                        'quiz',
                    ]),
            ]);
        }

        $modules = $modulesQuery->get();

        if (! $canViewLessons) {
            $modules->each(fn (CourseModule $m) => $m->setRelation('lessons', collect()));
        } else {
            // Duración dinámica por módulo: suma de duraciones de lecciones (prioriza duración real de vídeo).
            $modules->each(function (CourseModule $m): void {
                $totalSeconds = $m->lessons->sum(function ($lesson): int {
                    $videoSeconds = (int) ($lesson->video?->duration_seconds ?? 0);
                    $lessonSeconds = (int) ($lesson->duration_seconds ?? 0);

                    return max($videoSeconds, $lessonSeconds);
                });

                $m->setAttribute('duration_minutes', (int) ceil($totalSeconds / 60));
            });
        }

        return Inertia::render('admin/courses/modules/index', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'category' => $course->category,
                'total_modules' => $course->total_modules,
            ],
            'modules' => $modules,
            'can' => [
                'create' => $auth?->can('cursos_modulos.create') ?? false,
                'edit' => $auth?->can('cursos_modulos.edit') ?? false,
                'delete' => $auth?->can('cursos_modulos.delete') ?? false,
            ],
            'lessonsCan' => [
                'view' => $auth?->can('cursos_lecciones.view') ?? false,
                'create' => $auth?->can('cursos_lecciones.create') ?? false,
                'edit' => $auth?->can('cursos_lecciones.edit') ?? false,
                'delete' => $auth?->can('cursos_lecciones.delete') ?? false,
            ],
            'materialsCan' => [
                'showPage' => ($auth?->can('cursos_lecciones_documentos.view') ?? false)
                    || ($auth?->can('cursos_lecciones_recursos.view') ?? false)
                    || ($auth?->can('cursos_lecciones_videos.view') ?? false)
                    || ($auth?->can('cursos_lecciones_tareas.view') ?? false)
                    || ($auth?->can('cursos_lecciones.edit') ?? false),
            ],
            'quizCan' => [
                'showPage' => $auth?->can('cursos_lecciones_quizzes.view') ?? false,
            ],
        ]);
    }

    public function store(CourseModuleRequest $request, Course $course): RedirectResponse
    {
        $this->authorize('cursos_modulos.create');

        $validated = $request->validated();
        unset($validated['sort_order']);

        $validated['sort_order'] = (int) $course->courseModules()->max('sort_order') + 1;
        $validated['course_id'] = $course->id;

        CourseModule::create($validated);
        $this->syncCourseModuleCount($course);

        return back()->with('success', 'Módulo creado correctamente.');
    }

    public function update(CourseModuleRequest $request, Course $course, CourseModule $courseModule): RedirectResponse
    {
        $this->authorize('cursos_modulos.edit');
        $this->assertModuleBelongsToCourse($course, $courseModule);

        $courseModule->update($request->validated());

        return back()->with('success', 'Módulo actualizado correctamente.');
    }

    public function destroy(Course $course, CourseModule $courseModule): RedirectResponse
    {
        $this->authorize('cursos_modulos.delete');
        $this->assertModuleBelongsToCourse($course, $courseModule);

        $courseModule->delete();
        $this->renumberSortOrder($course);
        $this->syncCourseModuleCount($course);

        return back()->with('success', 'Módulo eliminado correctamente.');
    }

    /**
     * Reordena módulos según el array de IDs en el orden deseado.
     *
     * @return RedirectResponse
     */
    public function reorder(Request $request, Course $course): RedirectResponse
    {
        $this->authorize('cursos_modulos.edit');

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['uuid', 'distinct'],
        ]);

        $ids = $validated['order'];
        $total = $course->courseModules()->count();

        if (count($ids) !== $total) {
            return back()->with('error', 'Debes enviar todos los módulos del curso en el nuevo orden.');
        }

        $existing = $course->courseModules()->whereIn('id', $ids)->pluck('id')->all();

        if (count($existing) !== count($ids)) {
            return back()->with('error', 'El orden enviado no coincide con los módulos del curso.');
        }

        DB::transaction(function () use ($course, $ids): void {
            foreach ($ids as $index => $id) {
                CourseModule::query()
                    ->where('course_id', $course->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Orden de módulos actualizado.');
    }

    private function assertModuleBelongsToCourse(Course $course, CourseModule $module): void
    {
        if ($module->course_id !== $course->id) {
            abort(404);
        }
    }

    private function renumberSortOrder(Course $course): void
    {
        $modules = $course->courseModules()->orderBy('sort_order')->orderBy('created_at')->get();
        foreach ($modules as $index => $mod) {
            $mod->update(['sort_order' => $index + 1]);
        }
    }

    private function syncCourseModuleCount(Course $course): void
    {
        $course->update([
            'total_modules' => $course->courseModules()->count(),
        ]);
    }
}
