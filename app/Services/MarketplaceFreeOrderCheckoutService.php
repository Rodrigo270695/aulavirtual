<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\User;
use App\Support\OrderNumberAllocator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Matrícula gratuita con orden e ítems en importe cero; queda pagada sin pasarela.
 */
final class MarketplaceFreeOrderCheckoutService
{
    public function __construct(
        private readonly OrderPurchasedNotifier $orderPurchasedNotifier,
    ) {}

    /**
     * @param  iterable<int, Course>|Collection<int, Course>  $courses
     */
    public function complete(User $user, Request $request, iterable $courses): ?string
    {
        $list = Collection::make($courses)->values();
        if ($list->isEmpty()) {
            return null;
        }

        $orderNumber = null;
        $order = null;

        DB::transaction(function () use ($user, $request, $list, &$orderNumber, &$order): void {
            $orderNumber = OrderNumberAllocator::allocate();

            $currency = $list->first() instanceof Course
                ? strtoupper((string) ($list->first()->currency ?: 'PEN'))
                : 'PEN';

            $order = Order::query()->create([
                'order_number' => $orderNumber,
                'user_id' => $user->id,
                'coupon_id' => null,
                'status' => 'paid',
                'subtotal' => 0,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'currency' => $currency,
                'billing_name' => trim("{$user->first_name} {$user->last_name}"),
                'billing_email' => $user->email,
                'billing_address' => null,
                'notes' => null,
                'paid_at' => now(),
            ]);

            foreach ($list as $course) {
                $orderItem = OrderItem::query()->create([
                    'order_id' => $order->id,
                    'item_type' => 'course',
                    'item_id' => $course->id,
                    'title' => (string) $course->title,
                    'instructor_id' => $course->instructor_id,
                    'unit_price' => 0,
                    'discount_amount' => 0,
                    'final_price' => 0,
                    'instructor_revenue' => 0,
                    'platform_revenue' => 0,
                    'created_at' => now(),
                ]);

                Enrollment::query()->create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'specialization_id' => null,
                    'package_id' => null,
                    'order_item_id' => $orderItem->id,
                    'access_type' => 'free',
                    'status' => 'active',
                    'enrolled_at' => now(),
                    'expires_at' => null,
                    'completed_at' => null,
                    'last_accessed_at' => null,
                    'progress_pct' => 0,
                ]);

                $course->increment('total_enrolled');
            }

            Payment::query()->create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'gateway' => 'free',
                'gateway_transaction_id' => 'free-'.Str::uuid()->toString(),
                'gateway_order_id' => null,
                'gateway_response' => ['mode' => 'free', 'note' => 'Curso gratuito; sin cargo.'],
                'amount' => 0,
                'currency' => $currency,
                'payment_method' => 'free',
                'card_last_four' => null,
                'card_brand' => null,
                'status' => 'completed',
                'failure_reason' => null,
                'ip_address' => $request->ip(),
                'processed_at' => now(),
            ]);
        });

        if ($order instanceof Order) {
            $this->orderPurchasedNotifier->notify($user, $order, true);
        }

        return $orderNumber;
    }
}
