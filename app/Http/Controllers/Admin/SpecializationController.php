<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SpecializationRequest;
use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Specialization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SpecializationController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $specializations = Specialization::query()
            ->with([
                'instructor.user:id,first_name,last_name,email',
                'category:id,name,slug',
                'courses',
            ])
            ->withCount('courses')
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $query->where(function ($q) use ($search): void {
                        $q->where('title', 'ilike', "%{$search}%")
                            ->orWhere('slug', 'ilike', "%{$search}%")
                            ->orWhere('description', 'ilike', "%{$search}%");
                    });
                }
            )
            ->when(
                request()->filled('category_id') && is_string(request('category_id')),
                fn ($q) => $q->where('category_id', request('category_id'))
            )
            ->when(
                request()->filled('instructor_id') && is_string(request('instructor_id')),
                fn ($q) => $q->where('instructor_id', request('instructor_id'))
            )
            ->when(
                request()->filled('status') && is_string(request('status')),
                fn ($q) => $q->where('status', request('status'))
            )
            ->when(
                in_array($sortBy, ['title', 'slug', 'status', 'price', 'created_at', 'courses_count'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('created_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString();

        $categoryOptions = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Category $c) => [
                'id'    => $c->id,
                'label' => "{$c->name} ({$c->slug})",
            ])
            ->values();

        $instructorOptions = Instructor::query()
            ->with(['user:id,first_name,last_name,email'])
            ->orderBy('professional_title')
            ->get()
            ->map(fn (Instructor $i) => [
                'id'    => $i->id,
                'label' => trim(($i->user?->first_name ?? '').' '.($i->user?->last_name ?? ''))
                    .' ('.($i->user?->email ?? '').') — '.$i->professional_title,
            ])
            ->values();

        $courseOptions = Course::query()
            ->orderBy('title')
            ->get(['id', 'title', 'slug'])
            ->map(fn (Course $c) => [
                'id'    => $c->id,
                'label' => "{$c->title} ({$c->slug})",
            ])
            ->values();

        $statusOptions = [
            ['value' => 'draft', 'label' => 'Borrador'],
            ['value' => 'published', 'label' => 'Publicada'],
            ['value' => 'archived', 'label' => 'Archivada'],
        ];

        $difficultyOptions = [
            ['value' => 'beginner', 'label' => 'Principiante'],
            ['value' => 'intermediate', 'label' => 'Intermedio'],
            ['value' => 'advanced', 'label' => 'Avanzado'],
            ['value' => 'all_levels', 'label' => 'Todos los niveles'],
        ];

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'category_id', 'instructor_id', 'status']);
        foreach (['category_id', 'instructor_id', 'status'] as $k) {
            if (! request()->filled($k)) {
                unset($filters[$k]);
            }
        }

        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();

        return Inertia::render('admin/specializations/index', [
            'specializations'   => $specializations,
            'categoryOptions'   => $categoryOptions,
            'instructorOptions' => $instructorOptions,
            'courseOptions'     => $courseOptions,
            'statusOptions'     => $statusOptions,
            'difficultyOptions' => $difficultyOptions,
            'filters'           => $filters,
            'can'               => [
                'create' => $auth?->can('especializaciones.create') ?? false,
                'edit'   => $auth?->can('especializaciones.edit') ?? false,
                'delete' => $auth?->can('especializaciones.delete') ?? false,
            ],
        ]);
    }

    public function store(SpecializationRequest $request): RedirectResponse
    {
        $this->authorize('especializaciones.create');

        $validated = $request->validated();
        $rows = $validated['courses'] ?? [];
        unset($validated['courses']);

        if (($validated['status'] ?? '') === 'published' && empty($validated['published_at'] ?? null)) {
            $validated['published_at'] = now();
        }

        $spec = Specialization::create($validated);
        $this->syncPivotCourses($spec, $rows);

        return back()->with('success', "Especialización «{$spec->title}» creada correctamente.");
    }

    public function update(SpecializationRequest $request, Specialization $specialization): RedirectResponse
    {
        $this->authorize('especializaciones.edit');

        $validated = $request->validated();
        $rows = $validated['courses'] ?? [];
        unset($validated['courses']);

        if (($validated['status'] ?? '') === 'published' && $specialization->published_at === null) {
            $validated['published_at'] = now();
        }

        $specialization->update($validated);
        $this->syncPivotCourses($specialization, $rows);

        return back()->with('success', "Especialización «{$specialization->title}» actualizada correctamente.");
    }

    public function destroy(Specialization $specialization): RedirectResponse
    {
        $this->authorize('especializaciones.delete');

        $title = $specialization->title;
        $specialization->delete();

        return back()->with('success', "Especialización «{$title}» eliminada correctamente.");
    }

    /**
     * @param  array<int, array{course_id: string, is_required?: bool}>  $rows
     */
    private function syncPivotCourses(Specialization $spec, array $rows): void
    {
        $sync = [];
        foreach ($rows as $index => $row) {
            $cid = $row['course_id'];
            $sync[$cid] = [
                'sort_order'  => $index + 1,
                'is_required' => (bool) ($row['is_required'] ?? true),
            ];
        }

        $spec->courses()->sync($sync);

        $hours = $sync === []
            ? 0
            : (float) Course::query()->whereIn('id', array_keys($sync))->sum('duration_hours');

        $spec->update([
            'total_courses'        => count($sync),
            'total_duration_hours' => $hours,
        ]);
    }
}
