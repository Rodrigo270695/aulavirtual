<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ShoppingCart;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MarketplaceCartService
{
    public const SESSION_KEY = 'marketplace_cart_course_ids';

    /**
     * @return list<string>
     */
    public function ids(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $this->syncSessionIntoUserCart($request, $user);

            $ids = $this->userCartIds($user);
            $enrolled = $this->enrolledCourseIds($user);
            $withoutEnrolled = array_values(array_filter(
                $ids,
                fn (string $id): bool => ! in_array($id, $enrolled, true)
            ));

            if ($withoutEnrolled !== $ids) {
                $this->syncUserCartFromIds($user, $withoutEnrolled);

                return $withoutEnrolled;
            }

            return $ids;
        }

        $raw = $request->session()->get(self::SESSION_KEY, []);

        if (! is_array($raw)) {
            return [];
        }

        $ids = [];
        foreach ($raw as $id) {
            if (is_string($id) && $id !== '') {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }

    public function count(Request $request): int
    {
        return count($this->ids($request));
    }

    public function add(Request $request, string $courseId): void
    {
        $user = $request->user();
        if ($user) {
            $this->syncSessionIntoUserCart($request, $user);
            $ids = $this->userCartIds($user);
            if (! in_array($courseId, $ids, true)) {
                $ids[] = $courseId;
            }
            $this->syncUserCartFromIds($user, $ids);

            return;
        }

        $ids = $this->ids($request);
        if (! in_array($courseId, $ids, true)) {
            $ids[] = $courseId;
        }
        $request->session()->put(self::SESSION_KEY, $ids);
    }

    public function remove(Request $request, string $courseId): void
    {
        $user = $request->user();
        if ($user) {
            $this->syncSessionIntoUserCart($request, $user);
            $ids = array_values(array_filter(
                $this->userCartIds($user),
                fn (string $id): bool => $id !== $courseId
            ));
            $this->syncUserCartFromIds($user, $ids);

            return;
        }

        $ids = array_values(array_filter(
            $this->ids($request),
            fn (string $id): bool => $id !== $courseId
        ));
        $request->session()->put(self::SESSION_KEY, $ids);
    }

    /**
     * @param  list<string>  $ids
     */
    public function setIds(Request $request, array $ids): void
    {
        $clean = [];
        foreach ($ids as $id) {
            if (is_string($id) && $id !== '' && ! in_array($id, $clean, true)) {
                $clean[] = $id;
            }
        }

        $user = $request->user();
        if ($user) {
            $this->syncSessionIntoUserCart($request, $user);
            $this->syncUserCartFromIds($user, $clean);

            return;
        }

        $request->session()->put(self::SESSION_KEY, $clean);
    }

    /**
     * @return array{ok: bool, message: string}
     */
    public function applyCoupon(Request $request, string $rawCode): array
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return ['ok' => false, 'message' => 'Inicia sesión para aplicar cupones.'];
        }

        $this->syncSessionIntoUserCart($request, $user);

        $code = strtoupper(trim($rawCode));
        if ($code === '') {
            return ['ok' => false, 'message' => 'Ingresa un código de cupón.'];
        }

        $coupon = Coupon::query()
            ->whereRaw('UPPER(code) = ?', [$code])
            ->first();

        if (! $coupon instanceof Coupon) {
            return ['ok' => false, 'message' => 'Cupón no encontrado.'];
        }

        $ids = $this->userCartIds($user);
        if ($ids === []) {
            return ['ok' => false, 'message' => 'Tu carrito está vacío.'];
        }

        $courses = Course::query()
            ->whereIn('id', $ids)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->get(['id', 'category_id', 'price', 'discount_price', 'is_free']);

        $subtotal = (float) $courses->sum(function (Course $course): float {
            if ($course->is_free) {
                return 0.0;
            }

            return (float) ($course->discount_price ?? $course->price ?? 0);
        });

        [$valid, $discount, $reason] = $this->resolveCouponDiscount($user, $coupon, $courses, $subtotal);
        if (! $valid) {
            return ['ok' => false, 'message' => $reason ?? 'No se pudo aplicar el cupón.'];
        }

        $cart = $this->resolveUserCart($user);
        $cart->update(['coupon_id' => $coupon->id]);
        $this->syncUserCartFromIds($user, $ids);

        return [
            'ok' => true,
            'message' => sprintf('Cupón %s aplicado. Descuento estimado: %.2f', $coupon->code, $discount),
        ];
    }

    public function removeCoupon(Request $request): void
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return;
        }

        $this->syncSessionIntoUserCart($request, $user);
        $ids = $this->userCartIds($user);
        $cart = $this->resolveUserCart($user);
        $cart->update(['coupon_id' => null]);
        $this->syncUserCartFromIds($user, $ids);
    }

    /**
     * @return list<string>
     */
    private function userCartIds(User $user): array
    {
        return CartItem::query()
            ->whereHas('cart', fn ($q) => $q->where('user_id', $user->id))
            ->where('item_type', 'course')
            ->orderBy('added_at')
            ->pluck('item_id')
            ->filter(fn ($id): bool => is_string($id) && $id !== '')
            ->values()
            ->all();
    }

    private function resolveUserCart(User $user): ShoppingCart
    {
        return ShoppingCart::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'coupon_id' => null,
                'subtotal' => 0,
                'discount_amount' => 0,
                'total' => 0,
                'currency' => 'PEN',
            ]
        );
    }

    /**
     * Cursos con matrícula activa: no deben permanecer en el carrito (ni en `cart_items`).
     *
     * @return list<string>
     */
    private function enrolledCourseIds(User $user): array
    {
        return Enrollment::query()
            ->where('user_id', $user->id)
            ->whereNotNull('course_id')
            ->where('status', 'active')
            ->pluck('course_id')
            ->map(fn ($id): string => (string) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<string>  $ids
     */
    private function syncUserCartFromIds(User $user, array $ids): void
    {
        $enrolled = $this->enrolledCourseIds($user);
        $ids = array_values(array_filter(
            $ids,
            fn (string $id): bool => ! in_array($id, $enrolled, true)
        ));

        DB::transaction(function () use ($user, $ids): void {
            $cart = $this->resolveUserCart($user);

            $idOrder = array_flip($ids);

            $courses = Course::query()
                ->whereIn('id', $ids)
                ->where('status', 'published')
                ->whereNotNull('published_at')
                ->get(['id', 'title', 'cover_image', 'price', 'discount_price', 'is_free', 'currency', 'category_id'])
                ->sortBy(fn (Course $course): int => $idOrder[(string) $course->id] ?? 999999)
                ->values();

            $validIds = $courses->pluck('id')->map(fn ($id): string => (string) $id)->all();

            CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('item_type', 'course')
                ->whereNotIn('item_id', $validIds)
                ->delete();

            $itemsById = CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('item_type', 'course')
                ->get()
                ->keyBy('item_id');

            foreach ($courses as $course) {
                $itemId = (string) $course->id;
                $unitPrice = (float) ($course->price ?? 0);
                $discountPrice = $course->discount_price !== null ? (float) $course->discount_price : null;
                $finalPrice = $course->is_free ? 0.0 : (float) ($discountPrice ?? $unitPrice);
                $payload = [
                    'title' => (string) $course->title,
                    'cover_image' => $course->cover_image,
                    'unit_price' => round($unitPrice, 2),
                    'discount_price' => $discountPrice !== null ? round($discountPrice, 2) : null,
                    'final_price' => round($finalPrice, 2),
                ];

                $existing = $itemsById->get($itemId);
                if ($existing instanceof CartItem) {
                    $existing->update($payload);

                    continue;
                }

                CartItem::query()->create([
                    'cart_id' => $cart->id,
                    'item_type' => 'course',
                    'item_id' => $itemId,
                    'added_at' => now(),
                    ...$payload,
                ]);
            }

            $subtotal = (float) CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('item_type', 'course')
                ->sum('final_price');

            $currency = $courses->first()?->currency;
            if (! is_string($currency) || $currency === '') {
                $currency = $cart->currency ?: 'PEN';
            }

            $discountAmount = 0.0;
            $couponId = $cart->coupon_id;
            if ($subtotal <= 0) {
                $couponId = null;
            }
            if ($couponId !== null && $subtotal > 0) {
                $coupon = Coupon::query()->find($couponId);
                [$valid, $resolvedDiscount] = $this->resolveCouponDiscount($user, $coupon, $courses, $subtotal);

                if ($valid) {
                    $discountAmount = $resolvedDiscount;
                } else {
                    $couponId = null;
                    $discountAmount = 0.0;
                }
            }

            $cart->update([
                'coupon_id' => $couponId,
                'subtotal' => round($subtotal, 2),
                'discount_amount' => round($discountAmount, 2),
                'total' => round(max($subtotal - $discountAmount, 0), 2),
                'currency' => strtoupper($currency),
            ]);
        });
    }

    private function syncSessionIntoUserCart(Request $request, User $user): void
    {
        $sessionIds = $request->session()->get(self::SESSION_KEY, []);
        if (! is_array($sessionIds) || $sessionIds === []) {
            return;
        }

        $cleanSessionIds = [];
        foreach ($sessionIds as $id) {
            if (is_string($id) && $id !== '' && ! in_array($id, $cleanSessionIds, true)) {
                $cleanSessionIds[] = $id;
            }
        }

        if ($cleanSessionIds === []) {
            $request->session()->forget(self::SESSION_KEY);

            return;
        }

        $merged = $this->userCartIds($user);
        foreach ($cleanSessionIds as $id) {
            if (! in_array($id, $merged, true)) {
                $merged[] = $id;
            }
        }

        $this->syncUserCartFromIds($user, $merged);
        $request->session()->forget(self::SESSION_KEY);
    }

    /**
     * @param  Collection<int, Course>  $courses
     * @return array{0: bool, 1: float, 2: ?string}
     */
    private function resolveCouponDiscount(User $user, ?Coupon $coupon, Collection $courses, float $subtotal): array
    {
        if (! $coupon instanceof Coupon) {
            return [false, 0.0, 'Cupón no disponible.'];
        }
        if (! $coupon->is_active) {
            return [false, 0.0, 'Este cupón está inactivo.'];
        }

        $now = now();
        if ($coupon->valid_from && $now->lt($coupon->valid_from)) {
            return [false, 0.0, 'Este cupón aún no está vigente.'];
        }
        if ($coupon->valid_until && $now->gt($coupon->valid_until)) {
            return [false, 0.0, 'Este cupón ya venció.'];
        }
        if ($coupon->max_uses !== null && $coupon->current_uses >= $coupon->max_uses) {
            return [false, 0.0, 'Este cupón alcanzó su máximo global de usos.'];
        }

        $usedByUser = CouponUsage::query()
            ->where('coupon_id', $coupon->id)
            ->where('user_id', $user->id)
            ->count();
        if ($usedByUser >= $coupon->max_uses_per_user) {
            return [false, 0.0, 'Ya alcanzaste el máximo de usos por usuario para este cupón.'];
        }

        $eligibleSubtotal = 0.0;
        if ($coupon->applies_to === 'all') {
            $eligibleSubtotal = $subtotal;
        } elseif ($coupon->applies_to === 'course' && $coupon->applicable_id) {
            $eligibleSubtotal = (float) $courses
                ->where('id', $coupon->applicable_id)
                ->sum(fn (Course $course): float => $course->is_free ? 0.0 : (float) ($course->discount_price ?? $course->price ?? 0));
        } elseif ($coupon->applies_to === 'category' && $coupon->applicable_id) {
            $eligibleSubtotal = (float) $courses
                ->where('category_id', $coupon->applicable_id)
                ->sum(fn (Course $course): float => $course->is_free ? 0.0 : (float) ($course->discount_price ?? $course->price ?? 0));
        } else {
            return [false, 0.0, 'Este cupón no aplica al contenido actual del carrito.'];
        }

        if ($eligibleSubtotal <= 0) {
            return [false, 0.0, 'Este cupón no aplica a los cursos de pago de tu carrito.'];
        }
        if ($eligibleSubtotal < (float) $coupon->min_purchase_amount) {
            return [false, 0.0, 'No alcanzas la compra mínima para este cupón.'];
        }

        $discount = 0.0;
        if ($coupon->discount_type === 'percentage') {
            $discount = $eligibleSubtotal * ((float) $coupon->discount_value / 100);
        } elseif ($coupon->discount_type === 'fixed_amount') {
            $discount = min((float) $coupon->discount_value, $eligibleSubtotal);
        }

        $discount = round(max(min($discount, $subtotal), 0.0), 2);
        if ($discount <= 0) {
            return [false, 0.0, 'El cupón no genera descuento para este carrito.'];
        }

        return [true, $discount, null];
    }
}
