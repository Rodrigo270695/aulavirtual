<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CourseRequest;
use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $courses = Course::query()
            ->with([
                'instructor.user:id,first_name,last_name,email',
                'category:id,name,slug',
                'tags:id,name,slug,usage_count',
            ])
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $query->where(function ($q) use ($search): void {
                        $q->where('title', 'ilike', "%{$search}%")
                            ->orWhere('slug', 'ilike', "%{$search}%")
                            ->orWhere('subtitle', 'ilike', "%{$search}%")
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
                request()->filled('is_free') && in_array((string) request('is_free'), ['0', '1'], true),
                fn ($q) => $q->where('is_free', request('is_free') === '1')
            )
            ->when(
                in_array($sortBy, ['title', 'slug', 'status', 'price', 'is_free', 'created_at'], true),
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

        $statusOptions = [
            ['value' => 'draft', 'label' => 'Borrador'],
            ['value' => 'under_review', 'label' => 'En revisión'],
            ['value' => 'published', 'label' => 'Publicado'],
            ['value' => 'unpublished', 'label' => 'Despublicado'],
            ['value' => 'archived', 'label' => 'Archivado'],
        ];

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'category_id', 'instructor_id', 'status', 'is_free']);
        foreach (['category_id', 'instructor_id', 'status'] as $k) {
            if (! request()->filled($k)) {
                unset($filters[$k]);
            }
        }
        if (! request()->filled('is_free') || ! in_array((string) request('is_free'), ['0', '1'], true)) {
            unset($filters['is_free']);
        }

        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();

        return Inertia::render('admin/courses/index', [
            'courses'           => $courses,
            'categoryOptions'   => $categoryOptions,
            'instructorOptions' => $instructorOptions,
            'statusOptions'     => $statusOptions,
            'levelOptions'      => [
                ['value' => 'beginner', 'label' => 'Principiante'],
                ['value' => 'intermediate', 'label' => 'Intermedio'],
                ['value' => 'advanced', 'label' => 'Avanzado'],
                ['value' => 'all_levels', 'label' => 'Todos los niveles'],
            ],
            'currencyOptions' => [
                ['value' => 'USD', 'label' => 'USD'],
                ['value' => 'PEN', 'label' => 'PEN'],
                ['value' => 'EUR', 'label' => 'EUR'],
            ],
            'filters' => $filters,
            'can'     => [
                'create'          => $auth?->can('cursos.create') ?? false,
                'edit'            => $auth?->can('cursos.edit') ?? false,
                'delete'          => $auth?->can('cursos.delete') ?? false,
                'modulosView'     => $auth?->can('cursos_modulos.view') ?? false,
                'fichaView'       => $auth?->can('cursos_ficha.view') ?? false,
                'fichaEdit'       => $auth?->can('cursos_ficha.edit') ?? false,
                'matriculasView'  => $auth?->can('cursos_matriculas.view') ?? false,
            ],
        ]);
    }

    public function store(CourseRequest $request): RedirectResponse
    {
        $this->authorize('cursos.create');

        $validated = $request->validated();
        $tagNames = $validated['tags'] ?? [];
        unset($validated['tags']);

        $validated['language'] = $validated['language'] ?? 'es';
        $validated['currency'] = strtoupper($validated['currency'] ?? 'USD');
        $validated['is_free'] = $validated['is_free'] ?? false;
        $validated['certificate_enabled'] = $validated['certificate_enabled'] ?? true;

        $this->syncCoverImage($request, $validated, null);
        $this->syncPromoVideo($request, $validated, null);

        if (($validated['status'] ?? '') === 'published') {
            $validated['published_at'] = now();
        }

        $course = Course::create($validated);
        $this->syncCourseTags($course, $tagNames);

        return back()->with('success', "Curso «{$course->title}» creado correctamente.");
    }

    public function update(CourseRequest $request, Course $course): RedirectResponse
    {
        $this->authorize('cursos.edit');

        $validated = $request->validated();
        $tagNames = $validated['tags'] ?? [];
        unset($validated['tags']);

        $validated['language'] = $validated['language'] ?? 'es';
        $validated['currency'] = strtoupper($validated['currency'] ?? 'USD');
        $validated['is_free'] = $validated['is_free'] ?? false;
        $validated['certificate_enabled'] = $validated['certificate_enabled'] ?? true;

        $this->syncCoverImage($request, $validated, $course);
        $this->syncPromoVideo($request, $validated, $course);

        if (($validated['status'] ?? '') === 'published' && $course->published_at === null) {
            $validated['published_at'] = now();
        }

        $course->update($validated);
        $this->syncCourseTags($course, $tagNames);

        return back()->with('success', "Curso «{$course->title}» actualizado correctamente.");
    }

    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('cursos.delete');

        $title = $course->title;

        if ($course->promo_video_path) {
            Storage::disk('public')->delete($course->promo_video_path);
        }
        if ($course->cover_image) {
            Storage::disk('public')->delete($course->cover_image);
        }

        $course->delete();

        return back()->with('success', "Curso «{$title}» eliminado correctamente.");
    }

    /**
     * Portada del curso en disco público.
     *
     * @param  array<string, mixed>  $validated
     */
    private function syncCoverImage(CourseRequest $request, array &$validated, ?Course $course): void
    {
        unset($validated['cover_image_file'], $validated['remove_cover']);

        if ($request->hasFile('cover_image_file')) {
            if ($course?->cover_image) {
                Storage::disk('public')->delete($course->cover_image);
            }

            $validated['cover_image'] = $request->file('cover_image_file')->store('course-covers', 'public');

            return;
        }

        if ($request->boolean('remove_cover')) {
            if ($course?->cover_image) {
                Storage::disk('public')->delete($course->cover_image);
            }

            $validated['cover_image'] = null;

            return;
        }

        if ($course === null) {
            $validated['cover_image'] = null;
        } else {
            unset($validated['cover_image']);
        }
    }

    /**
     * Enlace externo (promo_video_url) y/o archivo en disco (promo_video_path); son excluyentes.
     *
     * @param  array<string, mixed>  $validated
     */
    private function syncPromoVideo(CourseRequest $request, array &$validated, ?Course $course): void
    {
        $kind = $request->string('promo_video_input')->value();

        if (! in_array($kind, ['link', 'upload'], true)) {
            $kind = 'link';
        }

        unset($validated['promo_video_input'], $validated['promo_video_file'], $validated['remove_promo_video']);

        if ($request->hasFile('promo_video_file')) {
            if ($course?->promo_video_path) {
                Storage::disk('public')->delete($course->promo_video_path);
            }

            $validated['promo_video_path'] = $request->file('promo_video_file')->store('course-promo-videos', 'public');
            $validated['promo_video_url'] = null;

            return;
        }

        if ($request->boolean('remove_promo_video')) {
            if ($course?->promo_video_path) {
                Storage::disk('public')->delete($course->promo_video_path);
            }

            $validated['promo_video_path'] = null;

            if ($kind === 'upload') {
                $validated['promo_video_url'] = null;
            }

            return;
        }

        if ($kind === 'link') {
            if ($course?->promo_video_path) {
                Storage::disk('public')->delete($course->promo_video_path);
            }

            $validated['promo_video_path'] = null;
            $validated['promo_video_url'] = array_key_exists('promo_video_url', $validated)
                && $validated['promo_video_url'] !== null
                && $validated['promo_video_url'] !== ''
                ? $validated['promo_video_url']
                : null;

            return;
        }

        if ($course === null) {
            $validated['promo_video_path'] = null;
            $validated['promo_video_url'] = null;

            return;
        }

        if ($course->promo_video_path) {
            $validated['promo_video_url'] = null;
            unset($validated['promo_video_path']);

            return;
        }

        // Solo había URL externa: modo «archivo» sin fichero nuevo — no borrar la URL en BD.
        unset($validated['promo_video_url'], $validated['promo_video_path']);
    }

    /**
     * @param  array<int, string>  $tagNames
     */
    private function syncCourseTags(Course $course, array $tagNames): void
    {
        $ids = [];

        foreach ($tagNames as $name) {
            $n = is_string($name) ? mb_strtolower(trim($name)) : '';

            if ($n === '') {
                continue;
            }

            $ids[] = $this->findOrCreateTagByName($n)->id;
        }

        $course->tags()->sync(array_values(array_unique($ids)));
    }

    private function findOrCreateTagByName(string $name): Tag
    {
        $existing = Tag::query()->where('name', $name)->first();

        if ($existing) {
            return $existing;
        }

        $base = Str::slug($name);
        $slug = $base !== '' ? $base : Str::slug(Str::random(8));
        $i = 1;

        while (Tag::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return Tag::create([
            'name' => $name,
            'slug' => $slug,
            'usage_count' => 0,
        ]);
    }
}
