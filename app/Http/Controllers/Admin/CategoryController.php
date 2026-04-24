<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $categories = Category::query()
            ->with([
                'parent:id,name,slug',
                'tags:id,name,slug,usage_count',
            ])
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $query->where(function ($q) use ($search): void {
                        $q->where('name', 'ilike', "%{$search}%")
                            ->orWhere('slug', 'ilike', "%{$search}%")
                            ->orWhere('description', 'ilike', "%{$search}%");
                    });
                }
            )
            ->when(
                request()->filled('is_active') && in_array((string) request('is_active'), ['0', '1'], true),
                fn ($q) => $q->where('is_active', request('is_active') === '1')
            )
            ->when(
                in_array($sortBy, ['name', 'slug', 'sort_order', 'is_active', 'created_at'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                function ($q): void {
                    // Raíz primero, luego hijos del mismo “grupo”; dentro: sort_order y nombre asc.
                    $q->orderByRaw('COALESCE(parent_id, id)')
                        ->orderByRaw('CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END')
                        ->orderBy('sort_order')
                        ->orderBy('name');
                }
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString();

        $this->hydrateCategoryDepth($categories);

        $parentOptions = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'label' => "{$c->name} ({$c->slug})",
            ])
            ->values();

        $tagsCount = Tag::query()->count();

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'is_active']);
        if (! request()->filled('is_active') || ! in_array((string) request('is_active'), ['0', '1'], true)) {
            unset($filters['is_active']);
        }

        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
            'parentOptions' => $parentOptions,
            'tagsCount' => $tagsCount,
            'filters' => $filters,
            'can' => [
                'create' => $user?->can('categorias.create') ?? false,
                'edit' => $user?->can('categorias.edit') ?? false,
                'delete' => $user?->can('categorias.delete') ?? false,
            ],
        ]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        $this->authorize('categorias.create');

        $validated = $request->validated();
        $tagNames = $validated['tags'] ?? [];
        unset($validated['tags'], $validated['cover_image_file'], $validated['remove_cover']);

        $validated['sort_order'] = (int) Category::query()->max('sort_order') + 1;
        $validated['is_active'] = $validated['is_active'] ?? true;

        if ($request->hasFile('cover_image_file')) {
            $validated['cover_image'] = $request->file('cover_image_file')->store('category-covers', 'public');
        }

        $category = Category::create($validated);
        $this->syncCategoryTags($category, $tagNames);

        return back()->with('success', "Categoría «{$category->name}» creada correctamente.");
    }

    public function update(CategoryRequest $request, Category $category): RedirectResponse
    {
        $this->authorize('categorias.edit');

        $validated = $request->validated();
        $tagNames = $validated['tags'] ?? [];
        $removeCover = $request->boolean('remove_cover');
        unset($validated['tags'], $validated['cover_image_file'], $validated['remove_cover']);

        if ($request->hasFile('cover_image_file')) {
            if ($category->cover_image) {
                Storage::disk('public')->delete($category->cover_image);
            }
            $validated['cover_image'] = $request->file('cover_image_file')->store('category-covers', 'public');
        } elseif ($removeCover) {
            if ($category->cover_image) {
                Storage::disk('public')->delete($category->cover_image);
            }
            $validated['cover_image'] = null;
        }

        $category->update($validated);
        $this->syncCategoryTags($category, $tagNames);

        return back()->with('success', "Categoría «{$category->name}» actualizada correctamente.");
    }

    public function destroy(Category $category): RedirectResponse
    {
        $this->authorize('categorias.delete');

        if ($category->children()->exists()) {
            return back()->with('error', 'No se puede eliminar: tiene subcategorías. Reubícalas o elimínalas primero.');
        }

        $name = $category->name;
        if ($category->cover_image) {
            Storage::disk('public')->delete($category->cover_image);
        }
        $category->delete();

        return back()->with('success', "Categoría «{$name}» eliminada correctamente.");
    }

    /**
     * Profundidad en el árbol (0 = raíz) para sangría en el listado.
     *
     * @param  LengthAwarePaginator<int, Category>  $paginator
     */
    private function hydrateCategoryDepth(LengthAwarePaginator $paginator): void
    {
        $parentById = Category::query()->pluck('parent_id', 'id')->all();

        $paginator->getCollection()->transform(function (Category $cat) use ($parentById): Category {
            $depth = 0;
            $pid = $cat->parent_id;

            while ($pid !== null) {
                $depth++;
                $pid = $parentById[$pid] ?? null;
            }

            $cat->setAttribute('depth', $depth);

            return $cat;
        });
    }

    /**
     * @param  array<int, string>  $tagNames
     */
    private function syncCategoryTags(Category $category, array $tagNames): void
    {
        $ids = [];
        foreach ($tagNames as $name) {
            $n = is_string($name) ? mb_strtolower(trim($name)) : '';
            if ($n === '') {
                continue;
            }
            $ids[] = $this->findOrCreateTagByName($n)->id;
        }
        $category->tags()->sync(array_values(array_unique($ids)));
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
