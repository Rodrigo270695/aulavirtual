<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PackageRequest;
use App\Models\Course;
use App\Models\Package;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $packages = Package::query()
            ->with(['courses'])
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
                request()->filled('is_active') && in_array((string) request('is_active'), ['0', '1'], true),
                fn ($q) => $q->where('is_active', request('is_active') === '1')
            )
            ->when(
                in_array($sortBy, ['title', 'slug', 'package_price', 'original_price', 'discount_pct', 'is_active', 'created_at', 'courses_count'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('created_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString();

        $courseOptions = Course::query()
            ->orderBy('title')
            ->get(['id', 'title', 'slug', 'price'])
            ->map(fn (Course $c) => [
                'id'    => $c->id,
                'label' => "{$c->title} ({$c->slug})",
                'price' => $c->price,
            ])
            ->values();

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'is_active']);
        if (! request()->filled('is_active') || ! in_array((string) request('is_active'), ['0', '1'], true)) {
            unset($filters['is_active']);
        }

        /** @var \App\Models\User|null $auth */
        $auth = Auth::user();

        return Inertia::render('admin/packages/index', [
            'packages'      => $packages,
            'courseOptions' => $courseOptions,
            'filters'       => $filters,
            'can'           => [
                'create' => $auth?->can('paquetes.create') ?? false,
                'edit'   => $auth?->can('paquetes.edit') ?? false,
                'delete' => $auth?->can('paquetes.delete') ?? false,
            ],
        ]);
    }

    public function store(PackageRequest $request): RedirectResponse
    {
        $this->authorize('paquetes.create');

        $validated = $request->validated();
        $rows = $validated['courses'] ?? [];
        unset($validated['courses']);

        $validated['original_price'] = 0;
        $validated['discount_pct'] = 0;

        $package = Package::create($validated);
        $this->syncPackageCourses($package, $rows);

        return back()->with('success', "Paquete «{$package->title}» creado correctamente.");
    }

    public function update(PackageRequest $request, Package $package): RedirectResponse
    {
        $this->authorize('paquetes.edit');

        $validated = $request->validated();
        $rows = $validated['courses'] ?? [];
        unset($validated['courses']);

        $package->update($validated);
        $this->syncPackageCourses($package, $rows);

        return back()->with('success', "Paquete «{$package->title}» actualizado correctamente.");
    }

    public function destroy(Package $package): RedirectResponse
    {
        $this->authorize('paquetes.delete');

        $title = $package->title;
        $package->delete();

        return back()->with('success', "Paquete «{$title}» eliminado correctamente.");
    }

    /**
     * @param  array<int, array{course_id: string}>  $rows
     */
    private function syncPackageCourses(Package $package, array $rows): void
    {
        $sync = [];
        foreach ($rows as $index => $row) {
            $cid = $row['course_id'];
            $sync[$cid] = [
                'sort_order' => $index + 1,
            ];
        }

        $package->courses()->sync($sync);

        $original = $sync === []
            ? 0.0
            : (float) Course::query()->whereIn('id', array_keys($sync))->sum('price');

        $pkgPrice = (float) $package->package_price;
        $discountPct = $original > 0 && $pkgPrice <= $original
            ? round((1 - ($pkgPrice / $original)) * 100, 2)
            : 0.0;

        if ($original > 0 && $pkgPrice > $original) {
            $discountPct = 0.0;
        }

        $package->update([
            'original_price' => $original,
            'discount_pct'   => max(0, $discountPct),
        ]);
    }
}
