<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\Package;
use App\Models\Specialization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();

        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';

        $coupons = Coupon::query()
            ->with('createdBy:id,first_name,last_name')
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $needle = trim($search);
                    $query->where(function ($q) use ($needle): void {
                        $q->where('code', 'ilike', "%{$needle}%")
                            ->orWhere('description', 'ilike', "%{$needle}%");
                    });
                }
            )
            ->when(
                request()->filled('discount_type') && in_array((string) request('discount_type'), ['percentage', 'fixed_amount'], true),
                fn ($q) => $q->where('discount_type', request('discount_type'))
            )
            ->when(
                request()->filled('is_active') && in_array((string) request('is_active'), ['0', '1'], true),
                fn ($q) => $q->where('is_active', request('is_active') === '1')
            )
            ->when(
                in_array($sortBy, ['code', 'discount_type', 'discount_value', 'current_uses', 'is_active', 'created_at', 'valid_until'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderBy('created_at', 'desc')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString()
            ->through(fn (Coupon $coupon) => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'description' => $coupon->description,
                'discount_type' => $coupon->discount_type,
                'discount_value' => (string) $coupon->discount_value,
                'max_uses' => $coupon->max_uses,
                'max_uses_per_user' => $coupon->max_uses_per_user,
                'current_uses' => $coupon->current_uses,
                'min_purchase_amount' => (string) $coupon->min_purchase_amount,
                'applies_to' => $coupon->applies_to,
                'applicable_id' => $coupon->applicable_id,
                'is_active' => (bool) $coupon->is_active,
                'valid_from' => $coupon->valid_from?->toIso8601String(),
                'valid_until' => $coupon->valid_until?->toIso8601String(),
                'created_by' => $coupon->created_by,
                'created_by_name' => trim((string) (($coupon->createdBy?->first_name ?? '').' '.($coupon->createdBy?->last_name ?? ''))),
                'created_at' => $coupon->created_at?->toIso8601String(),
                'updated_at' => $coupon->updated_at?->toIso8601String(),
            ]);

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'discount_type', 'is_active']);
        if (! request()->filled('discount_type') || ! in_array((string) request('discount_type'), ['percentage', 'fixed_amount'], true)) {
            unset($filters['discount_type']);
        }
        if (! request()->filled('is_active') || ! in_array((string) request('is_active'), ['0', '1'], true)) {
            unset($filters['is_active']);
        }

        return Inertia::render('admin/coupons/index', [
            'coupons' => $coupons,
            'courseOptions' => Course::query()
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (Course $course) => [
                    'id' => $course->id,
                    'label' => $course->title,
                ]),
            'categoryOptions' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'label' => $category->name,
                ]),
            'packageOptions' => Package::query()
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (Package $package) => [
                    'id' => $package->id,
                    'label' => $package->title,
                ]),
            'specializationOptions' => Specialization::query()
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (Specialization $specialization) => [
                    'id' => $specialization->id,
                    'label' => $specialization->title,
                ]),
            'filters' => $filters,
            'can' => [
                'create' => $authUser->can('cupones.create'),
                'edit' => $authUser->can('cupones.edit'),
                'delete' => $authUser->can('cupones.delete'),
            ],
        ]);
    }

    public function store(CouponRequest $request): RedirectResponse
    {
        $this->authorize('cupones.create');

        $validated = $request->validated();
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();
        $validated['created_by'] = (string) $authUser->getAuthIdentifier();
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        if (($validated['applies_to'] ?? 'all') === 'all') {
            $validated['applicable_id'] = null;
        }

        $coupon = Coupon::create($validated);

        return back()->with('success', "Cupón «{$coupon->code}» creado exitosamente.");
    }

    public function update(CouponRequest $request, Coupon $coupon): RedirectResponse
    {
        $this->authorize('cupones.edit');

        $validated = $request->validated();
        $validated['is_active'] = (bool) ($validated['is_active'] ?? $coupon->is_active);

        if (($validated['applies_to'] ?? 'all') === 'all') {
            $validated['applicable_id'] = null;
        }

        $coupon->update($validated);

        return back()->with('success', "Cupón «{$coupon->code}» actualizado exitosamente.");
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $this->authorize('cupones.delete');

        $code = $coupon->code;
        $coupon->delete();

        return back()->with('success', "Cupón «{$code}» eliminado exitosamente.");
    }

    public function usages(Request $request, Coupon $coupon): JsonResponse
    {
        abort_unless($request->user()?->can('cupones.view'), 403);

        $usages = $coupon->usages()
            ->with([
                'user:id,first_name,last_name,email',
                'order:id,order_number,total,currency',
            ])
            ->orderByDesc('used_at')
            ->get()
            ->map(fn ($usage) => [
                'id' => $usage->id,
                'discount_applied' => (string) $usage->discount_applied,
                'used_at' => $usage->used_at?->toIso8601String(),
                'user' => $usage->user ? [
                    'id' => $usage->user->id,
                    'first_name' => $usage->user->first_name,
                    'last_name' => $usage->user->last_name,
                    'email' => $usage->user->email,
                ] : null,
                'order' => $usage->order ? [
                    'id' => $usage->order->id,
                    'order_number' => $usage->order->order_number,
                    'total' => (string) $usage->order->total,
                    'currency' => $usage->order->currency,
                ] : null,
            ])
            ->values();

        return response()->json([
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'max_uses' => $coupon->max_uses,
                'max_uses_per_user' => $coupon->max_uses_per_user,
                'current_uses' => $coupon->current_uses,
            ],
            'usages' => $usages,
        ]);
    }
}

