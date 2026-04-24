<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();

        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();
        $dateFrom = $this->normalizeDateInput((string) $request->input('date_from'), $monthStart);
        $dateTo = $this->normalizeDateInput((string) $request->input('date_to'), $monthEnd);
        if ($dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $allowedStatuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded'];

        $orders = Order::query()
            ->with(['user:id,first_name,last_name,email'])
            ->withCount('items')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $needle = trim($search);
                    $query->where(function ($q) use ($needle): void {
                        $q->where('order_number', 'ilike', "%{$needle}%")
                            ->orWhere('billing_email', 'ilike', "%{$needle}%")
                            ->orWhere('billing_name', 'ilike', "%{$needle}%")
                            ->orWhereHas('user', function ($uq) use ($needle): void {
                                $uq->where('email', 'ilike', "%{$needle}%")
                                    ->orWhere('first_name', 'ilike', "%{$needle}%")
                                    ->orWhere('last_name', 'ilike', "%{$needle}%");
                            });
                    });
                }
            )
            ->when(
                request()->filled('status') && in_array((string) request('status'), $allowedStatuses, true),
                fn ($q) => $q->where('status', request('status'))
            )
            ->when(
                in_array($sortBy, ['order_number', 'status', 'total', 'created_at', 'paid_at', 'items_count'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('created_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString()
            ->through(fn (Order $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'subtotal' => (string) $order->subtotal,
                'discount_amount' => (string) $order->discount_amount,
                'tax_amount' => (string) $order->tax_amount,
                'total' => (string) $order->total,
                'currency' => $order->currency,
                'billing_name' => $order->billing_name,
                'billing_email' => $order->billing_email,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'created_at' => $order->created_at?->toIso8601String(),
                'items_count' => (int) ($order->items_count ?? 0),
                'user' => $order->user ? [
                    'id' => $order->user->id,
                    'first_name' => $order->user->first_name,
                    'last_name' => $order->user->last_name,
                    'email' => $order->user->email,
                ] : null,
            ]);

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'status', 'date_from', 'date_to']);
        if (! request()->filled('status') || ! in_array((string) request('status'), $allowedStatuses, true)) {
            unset($filters['status']);
        }
        $filters['date_from'] = $dateFrom;
        $filters['date_to'] = $dateTo;

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => $filters,
            'can' => [
                'items' => $authUser->can('ordenes.items'),
            ],
        ]);
    }

    public function items(Order $order): JsonResponse
    {
        $order->loadMissing(['user:id,first_name,last_name,email']);

        $rows = $order->items()
            ->orderBy('created_at')
            ->get()
            ->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'item_type' => $item->item_type,
                'item_id' => $item->item_id,
                'title' => $item->title,
                'instructor_id' => $item->instructor_id,
                'unit_price' => (string) $item->unit_price,
                'discount_amount' => (string) $item->discount_amount,
                'final_price' => (string) $item->final_price,
                'instructor_revenue' => (string) $item->instructor_revenue,
                'platform_revenue' => (string) $item->platform_revenue,
                'created_at' => $item->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'total' => (string) $order->total,
                'currency' => $order->currency,
                'billing_name' => $order->billing_name,
                'billing_email' => $order->billing_email,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'user' => $order->user ? [
                    'first_name' => $order->user->first_name,
                    'last_name' => $order->user->last_name,
                    'email' => $order->user->email,
                ] : null,
            ],
            'items' => $rows,
        ]);
    }

    private function normalizeDateInput(string $value, string $fallback): string
    {
        if ($value === '') {
            return $fallback;
        }

        try {
            return Carbon::createFromFormat('Y-m-d', $value)->toDateString();
        } catch (\Throwable) {
            return $fallback;
        }
    }
}
