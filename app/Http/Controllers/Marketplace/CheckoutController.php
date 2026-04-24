<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\ShoppingCart;
use App\Models\Course;
use App\Models\Enrollment;
use App\Services\MarketplaceCartService;
use App\Services\MarketplaceFreeOrderCheckoutService;
use App\Services\MarketplacePaidCheckoutService;
use App\Support\PublicCourseData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly MarketplaceCartService $cart,
        private readonly MarketplacePaidCheckoutService $paidCheckout,
        private readonly MarketplaceFreeOrderCheckoutService $freeOrderCheckout,
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        $ids = $this->cart->ids($request);

        $enrolledIds = $user->enrollments()->whereNotNull('course_id')->pluck('course_id')->all();

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

        $freePending = 0;
        $paidPending = 0;
        $paidTotal = 0.0;
        $currency = 'PEN';

        foreach ($courses as $course) {
            $already = in_array($course->id, $enrolledIds, true);
            if ($already) {
                continue;
            }
            if ($course->is_free) {
                $freePending++;
            } else {
                $paidPending++;
                $price = (float) ($course->discount_price ?? $course->price);
                $paidTotal += $price;
                $currency = (string) $course->currency;
            }
        }

        $cart = ShoppingCart::query()
            ->with('coupon:id,code')
            ->where('user_id', $user->id)
            ->first();
        $discountAmount = min((float) ($cart?->discount_amount ?? 0), $paidTotal);
        $paidTotal = max($paidTotal - $discountAmount, 0.0);

        return Inertia::render('checkout/index', [
            'lines' => $lines,
            'summary' => [
                'free_pending' => $freePending,
                'paid_pending' => $paidPending,
                'paid_total' => round($paidTotal, 2),
                'discount_amount' => round($discountAmount, 2),
                'coupon_code' => $cart?->coupon?->code,
                'currency' => $currency,
                'cart_empty' => count($ids) === 0,
            ],
        ]);
    }

    public function confirm(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $ids = $this->cart->ids($request);

        if ($ids === []) {
            return redirect()->route('cart.index')->with('error', 'Tu carrito está vacío.');
        }

        $courses = Course::query()
            ->whereIn('id', $ids)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->get()
            ->keyBy('id');

        $filteredIds = array_values(array_filter($ids, fn (string $id): bool => $courses->has($id)));

        if ($ids !== [] && $filteredIds === []) {
            $this->cart->setIds($request, []);

            return redirect()->route('cart.index')->with('error', 'Los cursos del carrito ya no están disponibles.');
        }

        $enrolledFree = 0;
        $skippedPaid = 0;
        $alreadyEnrolled = 0;
        $newCartIds = [];
        $freeToEnroll = [];

        foreach ($filteredIds as $courseId) {
            $course = $courses->get($courseId);
            if (! $course) {
                continue;
            }

            $exists = Enrollment::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->exists();

            if ($exists) {
                $alreadyEnrolled++;

                continue;
            }

            if (! $course->is_free) {
                $skippedPaid++;
                $newCartIds[] = $courseId;

                continue;
            }

            $freeToEnroll[] = $course;
        }

        $freeOrderNumber = null;
        if ($freeToEnroll !== []) {
            $freeOrderNumber = $this->freeOrderCheckout->complete($user, $request, $freeToEnroll);
            $enrolledFree = $freeOrderNumber !== null ? count($freeToEnroll) : 0;
        }

        $this->cart->setIds($request, $newCartIds);

        $parts = [];
        if ($enrolledFree > 0) {
            $ord = $freeOrderNumber !== null ? " Orden {$freeOrderNumber} registrada (pagada, importe 0)." : '';
            $parts[] = $enrolledFree === 1
                ? "Te has matriculado en 1 curso gratuito.{$ord}"
                : "Te has matriculado en {$enrolledFree} cursos gratuitos.{$ord}";
        }
        if ($alreadyEnrolled > 0) {
            $parts[] = 'Algunos cursos ya los tenías; se han quitado del proceso.';
        }
        if ($skippedPaid > 0) {
            $parts[] = 'Los cursos de pago siguen en el carrito: complétalos con PayPal desde el checkout.';
        }

        $message = $parts !== [] ? implode(' ', $parts) : 'No se ha podido completar la matrícula.';

        $target = ($enrolledFree > 0 && $newCartIds === []) ? 'learning.index' : 'cart.index';

        return redirect()
            ->route($target)
            ->with('success', $message);
    }

    public function startPayPal(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $result = $this->paidCheckout->startPayPalCheckout($user, $request);

        if (! $result['ok']) {
            return redirect()
                ->route('checkout.show')
                ->with('error', $result['message']);
        }

        if (! empty($result['approval_url'])) {
            return redirect()->away($result['approval_url']);
        }

        return redirect()
            ->route('learning.index')
            ->with('success', $result['message']);
    }

    public function payPalReturn(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $paypalOrderId = trim((string) $request->query('token', ''));
        if ($paypalOrderId === '') {
            return redirect()
                ->route('checkout.show')
                ->with('error', 'PayPal no devolvió un identificador de orden válido.');
        }

        $result = $this->paidCheckout->finalizePayPalCheckout($user, $request, $paypalOrderId);
        if (! $result['ok']) {
            return redirect()
                ->route('checkout.show')
                ->with('error', $result['message']);
        }

        return redirect()
            ->route('learning.index')
            ->with('success', $result['message']);
    }

    public function payPalCancel(): RedirectResponse
    {
        return redirect()
            ->route('checkout.show')
            ->with('warning', 'Pago cancelado en PayPal. Puedes intentarlo de nuevo.');
    }
}
