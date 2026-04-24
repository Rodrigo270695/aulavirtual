<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ShoppingCart;
use App\Models\User;
use App\Support\OrderNumberAllocator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Checkout de cursos de pago con PayPal (crear orden + capturar + matricular).
 */
final class MarketplacePaidCheckoutService
{
    private const DEFAULT_INSTRUCTOR_SHARE_PCT = 70.0;

    public function __construct(
        private readonly MarketplaceCartService $cart,
        private readonly OrderPurchasedNotifier $orderPurchasedNotifier,
    ) {}

    /**
     * @return array{ok: bool, message: string, approval_url?: string, order_number?: string}
     */
    public function startPayPalCheckout(User $user, Request $request): array
    {
        $context = $this->resolvePaidContext($user);

        if ($context === null || $context['lines'] === []) {
            return ['ok' => false, 'message' => 'No hay cursos de pago pendientes para procesar en el checkout.'];
        }

        $context = $this->normalizeCheckoutCurrency($context);

        if ($this->shouldSimulateCheckout()) {
            return $this->completeLocalSimulation($user, $request, $context);
        }

        try {
            $paypalOrder = $this->createPayPalOrder(
                amount: $context['total'],
                currency: $context['currency']
            );
        } catch (Throwable $e) {
            return ['ok' => false, 'message' => 'No se pudo iniciar PayPal. Verifica tu Client ID/Secret y modo sandbox/live.'];
        }

        $approvalUrl = $this->extractApprovalUrl($paypalOrder['links'] ?? []);
        if (! is_string($approvalUrl) || $approvalUrl === '') {
            return ['ok' => false, 'message' => 'PayPal no devolvió URL de aprobación. Intenta de nuevo.'];
        }

        DB::transaction(function () use ($user, $context, $paypalOrder): void {
            $order = Order::query()->create([
                'order_number' => OrderNumberAllocator::allocate(),
                'user_id' => $user->id,
                'coupon_id' => $context['cart']->coupon_id,
                'status' => 'pending',
                'subtotal' => $context['subtotal'],
                'discount_amount' => $context['order_discount'],
                'tax_amount' => 0,
                'total' => $context['total'],
                'currency' => $context['currency'],
                'billing_name' => trim("{$user->first_name} {$user->last_name}"),
                'billing_email' => $user->email,
                'billing_address' => null,
                'notes' => null,
                'paid_at' => null,
            ]);

            foreach ($context['lines'] as $row) {
                /** @var Course $course */
                $course = $row['course'];

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'item_type' => 'course',
                    'item_id' => $course->id,
                    'title' => (string) $course->title,
                    'instructor_id' => $course->instructor_id,
                    'unit_price' => $row['unit_price'],
                    'discount_amount' => $row['discount_amount'],
                    'final_price' => $row['final_price'],
                    'instructor_revenue' => $row['instructor_revenue'],
                    'platform_revenue' => $row['platform_revenue'],
                    'created_at' => now(),
                ]);
            }

            Payment::query()->create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'gateway' => 'paypal',
                'gateway_transaction_id' => null,
                'gateway_order_id' => (string) ($paypalOrder['id'] ?? ''),
                'gateway_response' => [
                    'mode' => 'paypal',
                    'state' => 'created',
                    'coupon_discount' => $context['coupon_discount'],
                    'source_currency' => $context['source_currency'],
                    'source_to_checkout_rate' => $context['fx_rate'],
                    'paypal' => $paypalOrder,
                ],
                'amount' => $context['total'],
                'currency' => $context['currency'],
                'payment_method' => 'paypal',
                'card_last_four' => null,
                'card_brand' => null,
                'status' => 'pending',
                'failure_reason' => null,
                'ip_address' => null,
                'processed_at' => null,
            ]);
        });

        return ['ok' => true, 'message' => 'Redirigiendo a PayPal…', 'approval_url' => $approvalUrl];
    }

    /**
     * @return array{ok: bool, message: string, order_number?: string}
     */
    public function finalizePayPalCheckout(User $user, Request $request, string $paypalOrderId): array
    {
        $payment = Payment::query()
            ->with('order.items')
            ->where('gateway', 'paypal')
            ->where('gateway_order_id', $paypalOrderId)
            ->where('user_id', $user->id)
            ->first();

        if (! $payment instanceof Payment || ! $payment->order instanceof Order) {
            return ['ok' => false, 'message' => 'No encontramos un pago pendiente de PayPal para tu sesión.'];
        }

        if ($payment->status === 'completed') {
            return [
                'ok' => true,
                'order_number' => $payment->order->order_number,
                'message' => "Tu pago ya estaba confirmado (orden {$payment->order->order_number}).",
            ];
        }

        try {
            $capture = $this->capturePayPalOrder($paypalOrderId);
        } catch (Throwable $e) {
            $orderSnapshot = $this->getPayPalOrder($paypalOrderId);
            $orderStatus = strtoupper((string) ($orderSnapshot['status'] ?? ''));
            if ($orderStatus === 'COMPLETED') {
                $capture = $orderSnapshot;
            } else {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
            ]);

            return ['ok' => false, 'message' => 'PayPal no confirmó el cobro. Intenta nuevamente desde checkout.'];
            }
        }

        $captureStatus = strtoupper((string) ($capture['status'] ?? ''));
        if (! in_array($captureStatus, ['COMPLETED', 'APPROVED'], true)) {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => (string) ($capture['message'] ?? 'PayPal no completó la captura'),
                'gateway_response' => [
                    ...($payment->gateway_response ?? []),
                    'paypal_capture' => $capture,
                ],
            ]);

            return ['ok' => false, 'message' => 'El pago no se completó en PayPal.'];
        }

        $captureId = (string) ($capture['purchase_units'][0]['payments']['captures'][0]['id'] ?? '');
        if ($captureId === '') {
            $captureId = (string) ($capture['id'] ?? '');
        }
        $orderNumber = $payment->order->order_number;
        $enrolledCount = 0;
        $purchasedCourseIds = [];

        DB::transaction(function () use ($payment, $request, $capture, $captureId, &$orderNumber, &$enrolledCount, &$purchasedCourseIds): void {
            $lockedPayment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->with('items')->whereKey($lockedPayment->order_id)->lockForUpdate()->firstOrFail();
            $orderNumber = $order->order_number;

            if ($lockedPayment->status !== 'completed') {
                foreach ($order->items as $item) {
                    if ($item->item_type !== 'course') {
                        continue;
                    }

                    $purchasedCourseIds[] = (string) $item->item_id;

                    $enrollment = Enrollment::query()->firstOrCreate(
                        [
                            'user_id' => $order->user_id,
                            'course_id' => $item->item_id,
                        ],
                        [
                            'specialization_id' => null,
                            'package_id' => null,
                            'order_item_id' => $item->id,
                            'access_type' => 'paid',
                            'status' => 'active',
                            'enrolled_at' => now(),
                            'expires_at' => null,
                            'completed_at' => null,
                            'last_accessed_at' => null,
                            'progress_pct' => 0,
                        ]
                    );

                    if ($enrollment->wasRecentlyCreated) {
                        Course::query()->whereKey($item->item_id)->increment('total_enrolled');
                        $enrolledCount++;
                    }
                }

                if ($order->coupon_id !== null && ! CouponUsage::query()->where('order_id', $order->id)->exists()) {
                    $discountApplied = (float) (($lockedPayment->gateway_response['coupon_discount'] ?? 0));
                    CouponUsage::query()->create([
                        'coupon_id' => $order->coupon_id,
                        'user_id' => $order->user_id,
                        'order_id' => $order->id,
                        'discount_applied' => round(max($discountApplied, 0), 2),
                        'used_at' => now(),
                    ]);

                    Coupon::query()->whereKey($order->coupon_id)->increment('current_uses');
                }

                $order->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
            }

            $lockedPayment->update([
                'gateway_transaction_id' => $captureId !== '' ? $captureId : $lockedPayment->gateway_transaction_id,
                'gateway_response' => [
                    ...($lockedPayment->gateway_response ?? []),
                    'state' => 'captured',
                    'paypal_capture' => $capture,
                ],
                'status' => 'completed',
                'failure_reason' => null,
                'ip_address' => $request->ip(),
                'processed_at' => now(),
            ]);
        });

        if ($purchasedCourseIds !== []) {
            $currentIds = $this->cart->ids($request);
            $remainingIds = array_values(array_diff($currentIds, array_unique($purchasedCourseIds)));
            $this->cart->setIds($request, $remainingIds);
        }

        $payment->refresh();
        $paidOrder = $payment->order;
        if ($paidOrder instanceof Order && $paidOrder->status === 'paid') {
            $this->orderPurchasedNotifier->notify($user, $paidOrder, false);
        }

        $msg = $enrolledCount === 1
            ? "Pago confirmado en PayPal. Ya tienes acceso al curso (orden {$orderNumber})."
            : "Pago confirmado en PayPal. Ya tienes acceso a {$enrolledCount} cursos (orden {$orderNumber}).";

        return ['ok' => true, 'order_number' => $orderNumber, 'message' => $msg];
    }

    /**
     * @return array{
     *   cart: ShoppingCart,
     *   lines: array<int, array<string, mixed>>,
     *   subtotal: float,
     *   order_discount: float,
     *   coupon_discount: float,
     *   total: float,
     *   currency: string,
     *   source_currency: string,
     *   fx_rate: float
     * }|null
     */
    private function resolvePaidContext(User $user): ?array
    {
        $cart = ShoppingCart::query()->where('user_id', $user->id)->first();
        if (! $cart instanceof ShoppingCart) {
            return null;
        }

        $ids = CartItem::query()
            ->where('cart_id', $cart->id)
            ->where('item_type', 'course')
            ->orderBy('added_at')
            ->pluck('item_id')
            ->map(fn ($id): string => (string) $id)
            ->values()
            ->all();

        if ($ids === []) {
            return null;
        }

        $idOrder = array_flip($ids);

        $courses = Course::query()
            ->with(['instructor:id,revenue_share_pct'])
            ->whereIn('id', $ids)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('is_free', false)
            ->get()
            ->sortBy(fn (Course $c): int => $idOrder[$c->id] ?? 999999)
            ->values();

        if ($courses->isEmpty()) {
            return [
                'cart' => $cart,
                'lines' => [],
                'subtotal' => 0.0,
                'order_discount' => 0.0,
                'coupon_discount' => 0.0,
                'total' => 0.0,
                'currency' => strtoupper((string) ($cart->currency ?: 'PEN')),
                'source_currency' => strtoupper((string) ($cart->currency ?: 'PEN')),
                'fx_rate' => 1.0,
            ];
        }

        $itemsByCourseId = CartItem::query()
            ->where('cart_id', $cart->id)
            ->where('item_type', 'course')
            ->get()
            ->keyBy(fn (CartItem $row): string => (string) $row->item_id);

        $lines = [];
        foreach ($courses as $course) {
            $exists = Enrollment::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->exists();

            if ($exists) {
                continue;
            }

            $cartItem = $itemsByCourseId->get((string) $course->id);
            $unitPrice = $cartItem instanceof CartItem
                ? (float) $cartItem->unit_price
                : (float) ($course->price ?? 0);
            $finalPrice = $cartItem instanceof CartItem
                ? (float) $cartItem->final_price
                : (float) ($course->discount_price ?? $course->price ?? 0);
            $finalPrice = max(round($finalPrice, 2), 0.0);
            if ($finalPrice <= 0) {
                continue;
            }

            $unitPrice = max(round($unitPrice, 2), $finalPrice);
            $lineDiscount = max(round($unitPrice - $finalPrice, 2), 0.0);

            $sharePct = (float) ($course->instructor?->revenue_share_pct ?? self::DEFAULT_INSTRUCTOR_SHARE_PCT);
            $sharePct = max(0.0, min(100.0, $sharePct));
            $instructorRevenue = round($finalPrice * ($sharePct / 100.0), 2);
            $platformRevenue = round($finalPrice - $instructorRevenue, 2);

            $lines[] = [
                'course' => $course,
                'unit_price' => $unitPrice,
                'discount_amount' => $lineDiscount,
                'final_price' => $finalPrice,
                'instructor_revenue' => $instructorRevenue,
                'platform_revenue' => $platformRevenue,
            ];
        }

        $subtotal = round(array_sum(array_column($lines, 'unit_price')), 2);
        $lineDiscounts = round(array_sum(array_column($lines, 'discount_amount')), 2);
        $paidSubtotal = round(array_sum(array_column($lines, 'final_price')), 2);

        $rawCartDiscount = max((float) $cart->discount_amount, 0.0);
        $couponDiscount = round(min($rawCartDiscount, $paidSubtotal), 2);
        $orderDiscount = round($lineDiscounts + $couponDiscount, 2);
        $total = round(max($paidSubtotal - $couponDiscount, 0), 2);

        $currency = strtoupper((string) ($courses->first()?->currency ?: $cart->currency ?: 'PEN'));

        return [
            'cart' => $cart,
            'lines' => $lines,
            'subtotal' => $subtotal,
            'order_discount' => $orderDiscount,
            'coupon_discount' => $couponDiscount,
            'total' => $total,
            'currency' => $currency,
            'source_currency' => $currency,
            'fx_rate' => 1.0,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function normalizeCheckoutCurrency(array $context): array
    {
        $target = strtoupper((string) config('services.paypal.checkout_currency', ''));
        if ($target === '') {
            return $context;
        }

        $source = strtoupper((string) ($context['currency'] ?? ''));
        if ($source === '' || $source === $target) {
            $context['source_currency'] = $source !== '' ? $source : $target;
            $context['currency'] = $target;
            $context['fx_rate'] = 1.0;

            return $context;
        }

        if ($source === 'PEN' && $target === 'USD') {
            $rate = (float) config('services.paypal.pen_to_usd_rate', 0.27);
            if ($rate <= 0) {
                $rate = 0.27;
            }

            $moneyKeys = ['unit_price', 'discount_amount', 'final_price', 'instructor_revenue', 'platform_revenue'];
            $context['lines'] = array_map(function ($line) use ($rate, $moneyKeys) {
                foreach ($moneyKeys as $key) {
                    if (isset($line[$key])) {
                        $line[$key] = round(((float) $line[$key]) * $rate, 2);
                    }
                }

                return $line;
            }, $context['lines']);

            foreach (['subtotal', 'order_discount', 'coupon_discount', 'total'] as $key) {
                $context[$key] = round(((float) ($context[$key] ?? 0)) * $rate, 2);
            }

            $context['source_currency'] = $source;
            $context['currency'] = $target;
            $context['fx_rate'] = $rate;
        }

        return $context;
    }

    private function shouldSimulateCheckout(): bool
    {
        return app()->environment('local')
            && (bool) config('services.paypal.simulate_checkout', false);
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array{ok: bool, message: string, order_number?: string}
     */
    private function completeLocalSimulation(User $user, Request $request, array $context): array
    {
        $purchasedCourseIds = [];
        $orderNumber = null;

        DB::transaction(function () use ($user, $context, &$purchasedCourseIds, &$orderNumber): void {
            $order = Order::query()->create([
                'order_number' => OrderNumberAllocator::allocate(),
                'user_id' => $user->id,
                'coupon_id' => $context['cart']->coupon_id,
                'status' => 'paid',
                'subtotal' => $context['subtotal'],
                'discount_amount' => $context['order_discount'],
                'tax_amount' => 0,
                'total' => $context['total'],
                'currency' => $context['currency'],
                'billing_name' => trim("{$user->first_name} {$user->last_name}"),
                'billing_email' => $user->email,
                'billing_address' => null,
                'notes' => null,
                'paid_at' => now(),
            ]);

            $orderNumber = $order->order_number;

            foreach ($context['lines'] as $row) {
                /** @var Course $course */
                $course = $row['course'];

                $orderItem = OrderItem::query()->create([
                    'order_id' => $order->id,
                    'item_type' => 'course',
                    'item_id' => $course->id,
                    'title' => (string) $course->title,
                    'instructor_id' => $course->instructor_id,
                    'unit_price' => $row['unit_price'],
                    'discount_amount' => $row['discount_amount'],
                    'final_price' => $row['final_price'],
                    'instructor_revenue' => $row['instructor_revenue'],
                    'platform_revenue' => $row['platform_revenue'],
                    'created_at' => now(),
                ]);

                Enrollment::query()->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'course_id' => $course->id,
                    ],
                    [
                        'specialization_id' => null,
                        'package_id' => null,
                        'order_item_id' => $orderItem->id,
                        'access_type' => 'paid',
                        'status' => 'active',
                        'enrolled_at' => now(),
                        'expires_at' => null,
                        'completed_at' => null,
                        'last_accessed_at' => null,
                        'progress_pct' => 0,
                    ]
                );

                Course::query()->whereKey($course->id)->increment('total_enrolled');
                $purchasedCourseIds[] = (string) $course->id;
            }

            Payment::query()->create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'gateway' => 'paypal',
                'gateway_transaction_id' => 'local-sim',
                'gateway_order_id' => 'local-sim-'.$order->id,
                'gateway_response' => [
                    'mode' => 'paypal-local-sim',
                    'state' => 'captured',
                    'coupon_discount' => $context['coupon_discount'],
                    'source_currency' => $context['source_currency'],
                    'source_to_checkout_rate' => $context['fx_rate'],
                ],
                'amount' => $context['total'],
                'currency' => $context['currency'],
                'payment_method' => 'paypal',
                'card_last_four' => null,
                'card_brand' => null,
                'status' => 'completed',
                'failure_reason' => null,
                'ip_address' => null,
                'processed_at' => now(),
            ]);

            if ($order->coupon_id !== null) {
                CouponUsage::query()->create([
                    'coupon_id' => $order->coupon_id,
                    'user_id' => $order->user_id,
                    'order_id' => $order->id,
                    'discount_applied' => round(max((float) $context['coupon_discount'], 0), 2),
                    'used_at' => now(),
                ]);

                Coupon::query()->whereKey($order->coupon_id)->increment('current_uses');
            }
        });

        if ($purchasedCourseIds !== []) {
            $this->cart->setIds(
                $request,
                array_values(array_diff($this->cart->ids($request), array_unique($purchasedCourseIds)))
            );
        }

        if (is_string($orderNumber) && $orderNumber !== '') {
            $paidOrder = Order::query()->where('order_number', $orderNumber)->with('items')->first();
            if ($paidOrder instanceof Order) {
                $this->orderPurchasedNotifier->notify($user, $paidOrder, false);
            }
        }

        return [
            'ok' => true,
            'order_number' => $orderNumber,
            'message' => "Pago local simulado completado (orden {$orderNumber}).",
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function createPayPalOrder(float $amount, string $currency): array
    {
        $token = $this->paypalAccessToken();
        $base = $this->paypalBaseUrl();

        $response = Http::baseUrl($base)
            ->acceptJson()
            ->asJson()
            ->withToken($token)
            ->post('/v2/checkout/orders', [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => [
                        'currency_code' => strtoupper($currency),
                        'value' => number_format($amount, 2, '.', ''),
                    ],
                ]],
                'application_context' => [
                    'return_url' => route('checkout.paypal.return'),
                    'cancel_url' => route('checkout.paypal.cancel'),
                    'user_action' => 'PAY_NOW',
                    'shipping_preference' => 'NO_SHIPPING',
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('PayPal create-order failed: '.$response->status());
        }

        return $response->json();
    }

    /**
     * @return array<string, mixed>
     */
    private function capturePayPalOrder(string $paypalOrderId): array
    {
        $token = $this->paypalAccessToken();
        $base = $this->paypalBaseUrl();

        $response = Http::baseUrl($base)
            ->acceptJson()
            ->withBody('{}', 'application/json')
            ->withToken($token)
            ->post("/v2/checkout/orders/{$paypalOrderId}/capture");

        if (! $response->successful()) {
            $body = $response->json();
            $issue = is_array($body) ? (string) (($body['details'][0]['issue'] ?? '') ?: ($body['name'] ?? '')) : '';
            $desc = is_array($body) ? (string) (($body['details'][0]['description'] ?? '') ?: ($body['message'] ?? '')) : '';
            $debug = is_array($body) ? (string) ($body['debug_id'] ?? '') : '';
            $parts = array_values(array_filter([$issue, $desc, $debug !== '' ? "debug_id={$debug}" : '']));

            throw new RuntimeException(
                'PayPal capture failed: '.$response->status().($parts !== [] ? ' - '.implode(' | ', $parts) : '')
            );
        }

        return $response->json();
    }

    /**
     * @return array<string, mixed>
     */
    private function getPayPalOrder(string $paypalOrderId): array
    {
        $token = $this->paypalAccessToken();
        $base = $this->paypalBaseUrl();

        $response = Http::baseUrl($base)
            ->acceptJson()
            ->withToken($token)
            ->get("/v2/checkout/orders/{$paypalOrderId}");

        if (! $response->successful()) {
            return [];
        }

        return $response->json();
    }

    private function paypalAccessToken(): string
    {
        $clientId = (string) config('services.paypal.client_id');
        $clientSecret = (string) config('services.paypal.client_secret');

        if ($clientId === '' || $clientSecret === '') {
            throw new RuntimeException('PayPal credentials not configured.');
        }

        $response = Http::baseUrl($this->paypalBaseUrl())
            ->acceptJson()
            ->asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->post('/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('PayPal OAuth failed: '.$response->status());
        }

        $token = (string) $response->json('access_token');
        if ($token === '') {
            throw new RuntimeException('PayPal OAuth returned empty access_token.');
        }

        return $token;
    }

    private function paypalBaseUrl(): string
    {
        $mode = strtolower((string) config('services.paypal.mode', 'sandbox'));

        return $mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    /**
     * @param  array<int, mixed>  $links
     */
    private function extractApprovalUrl(array $links): ?string
    {
        foreach ($links as $link) {
            if (! is_array($link)) {
                continue;
            }

            if (($link['rel'] ?? null) === 'approve' && is_string($link['href'] ?? null)) {
                return $link['href'];
            }
        }

        return null;
    }
}
