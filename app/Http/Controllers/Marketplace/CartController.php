<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ShoppingCart;
use App\Services\MarketplaceCartService;
use App\Support\PublicCourseData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        private readonly MarketplaceCartService $cart,
    ) {}

    public function index(Request $request): Response
    {
        $ids = $this->cart->ids($request);
        $user = $request->user();

        $enrolledIds = $user
            ? $user->enrollments()->whereNotNull('course_id')->pluck('course_id')->all()
            : [];

        $idOrder = array_flip($ids);

        $courses = Course::query()
            ->with([
                'category:id,name,slug',
                'instructor:id,user_id',
                'instructor.user:id,first_name,last_name',
            ])
            ->whereIn('id', $ids)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->get()
            ->sortBy(fn (Course $c): int => $idOrder[$c->id] ?? 999999)
            ->values();

        $lines = $courses->map(function (Course $course) use ($enrolledIds): array {
            return [
                'course' => PublicCourseData::from($course),
                'already_enrolled' => in_array($course->id, $enrolledIds, true),
            ];
        })->values()->all();

        $missingCount = count($ids) - $courses->count();
        $paidSubtotal = (float) $courses
            ->filter(fn (Course $course): bool => ! in_array($course->id, $enrolledIds, true) && ! $course->is_free)
            ->sum(fn (Course $course): float => (float) ($course->discount_price ?? $course->price ?? 0));

        $cart = $user
            ? ShoppingCart::query()->with('coupon:id,code,max_uses,max_uses_per_user,current_uses')->where('user_id', $user->id)->first()
            : null;
        $discountAmount = min((float) ($cart?->discount_amount ?? 0), $paidSubtotal);
        $totalPayable = max($paidSubtotal - $discountAmount, 0.0);

        $coupon = null;
        if ($user && $cart?->coupon) {
            $usedByUser = CouponUsage::query()
                ->where('coupon_id', $cart->coupon->id)
                ->where('user_id', $user->id)
                ->count();

            $coupon = [
                'id' => $cart->coupon->id,
                'code' => $cart->coupon->code,
                'current_uses' => $cart->coupon->current_uses,
                'max_uses' => $cart->coupon->max_uses,
                'max_uses_per_user' => $cart->coupon->max_uses_per_user,
                'used_by_user' => $usedByUser,
                'remaining_user_uses' => max(0, $cart->coupon->max_uses_per_user - $usedByUser),
            ];
        }

        return Inertia::render('cart/index', [
            'lines' => $lines,
            'missingCount' => $missingCount,
            'summary' => [
                'paid_subtotal' => round($paidSubtotal, 2),
                'discount_amount' => round($discountAmount, 2),
                'total_payable' => round($totalPayable, 2),
                'currency' => $courses->first()?->currency ?? ($cart?->currency ?? 'PEN'),
                'coupon' => $coupon,
            ],
        ]);
    }

    public function add(Request $request, Course $course): RedirectResponse
    {
        if ($course->status !== 'published' || $course->published_at === null) {
            abort(404);
        }

        $user = $request->user();
        if ($user && Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists()) {
            return back()->with('info', 'Ya tienes una matrícula activa en este curso.');
        }

        $this->cart->add($request, $course->id);

        return back()->with('success', 'Curso añadido al carrito.');
    }

    public function destroy(Request $request, Course $course): RedirectResponse
    {
        $this->cart->remove($request, $course->id);

        return back()->with('success', 'Curso quitado del carrito.');
    }

    public function applyCoupon(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
        ]);

        $result = $this->cart->applyCoupon($request, (string) $validated['code']);

        if (! $result['ok']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }

    public function removeCoupon(Request $request): RedirectResponse
    {
        $this->cart->removeCoupon($request);

        return back()->with('success', 'Cupón removido del carrito.');
    }
}
