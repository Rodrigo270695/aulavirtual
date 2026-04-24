<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $sortBy = request('sort_by');
        $sortDir = request('sort_dir') === 'asc' ? 'asc' : 'desc';
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();
        $dateFrom = $this->normalizeDateInput((string) $request->input('date_from'), $monthStart);
        $dateTo = $this->normalizeDateInput((string) $request->input('date_to'), $monthEnd);
        if ($dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $allowedStatus = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];

        $payments = Payment::query()
            ->with([
                'order:id,order_number',
                'order.items:id,order_id,title',
                'user:id,first_name,last_name,email',
            ])
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $needle = trim($search);

                    $query->where(function ($q) use ($needle): void {
                        $q->where('gateway_transaction_id', 'ilike', "%{$needle}%")
                            ->orWhere('gateway_order_id', 'ilike', "%{$needle}%")
                            ->orWhere('gateway', 'ilike', "%{$needle}%")
                            ->orWhereHas('order', fn ($oq) => $oq->where('order_number', 'ilike', "%{$needle}%"))
                            ->orWhereHas('order.items', fn ($iq) => $iq->where('title', 'ilike', "%{$needle}%"))
                            ->orWhereHas('user', function ($uq) use ($needle): void {
                                $uq->where('email', 'ilike', "%{$needle}%")
                                    ->orWhere('first_name', 'ilike', "%{$needle}%")
                                    ->orWhere('last_name', 'ilike', "%{$needle}%");
                            });
                    });
                }
            )
            ->when(
                request()->filled('status') && in_array((string) request('status'), $allowedStatus, true),
                fn ($q) => $q->where('status', request('status'))
            )
            ->when(
                request()->filled('gateway'),
                fn ($q) => $q->where('gateway', (string) request('gateway'))
            )
            ->when(
                in_array($sortBy, ['gateway', 'status', 'amount', 'created_at', 'processed_at'], true),
                fn ($q) => $q->orderBy($sortBy, $sortDir),
                fn ($q) => $q->orderByDesc('created_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString()
            ->through(fn (Payment $payment) => [
                'id' => $payment->id,
                'gateway' => $payment->gateway,
                'gateway_transaction_id' => $payment->gateway_transaction_id,
                'gateway_order_id' => $payment->gateway_order_id,
                'amount' => (string) $payment->amount,
                'currency' => $payment->currency,
                'payment_method' => $payment->payment_method,
                'card_last_four' => $payment->card_last_four,
                'card_brand' => $payment->card_brand,
                'status' => $payment->status,
                'failure_reason' => $payment->failure_reason,
                'ip_address' => $payment->ip_address,
                'processed_at' => $payment->processed_at?->toIso8601String(),
                'created_at' => $payment->created_at?->toIso8601String(),
                'order' => $payment->order ? [
                    'id' => $payment->order->id,
                    'order_number' => $payment->order->order_number,
                    'items_count' => $payment->order->items->count(),
                    'item_titles' => $payment->order->items
                        ->pluck('title')
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                ] : null,
                'user' => $payment->user ? [
                    'id' => $payment->user->id,
                    'first_name' => $payment->user->first_name,
                    'last_name' => $payment->user->last_name,
                    'email' => $payment->user->email,
                ] : null,
            ]);

        $filters = request()->only(['search', 'per_page', 'sort_by', 'sort_dir', 'status', 'gateway', 'date_from', 'date_to']);
        if (! request()->filled('status') || ! in_array((string) request('status'), $allowedStatus, true)) {
            unset($filters['status']);
        }
        if (! request()->filled('gateway')) {
            unset($filters['gateway']);
        }
        $filters['date_from'] = $dateFrom;
        $filters['date_to'] = $dateTo;

        return Inertia::render('admin/payments/index', [
            'payments' => $payments,
            'filters' => $filters,
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
