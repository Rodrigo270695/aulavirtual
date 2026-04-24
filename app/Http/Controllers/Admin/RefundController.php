<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RefundController extends Controller
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

        $allowedStatus = ['pending', 'approved', 'rejected', 'processed'];

        $refunds = Refund::query()
            ->select('refunds.*')
            ->join('payments', 'payments.id', '=', 'refunds.payment_id')
            ->with([
                'payment:id,order_id,gateway,gateway_transaction_id,currency',
                'order:id,order_number',
                'order.items:id,order_id,title',
                'user:id,first_name,last_name,email',
            ])
            ->whereDate('refunds.created_at', '>=', $dateFrom)
            ->whereDate('refunds.created_at', '<=', $dateTo)
            ->when(
                request('search'),
                function ($query, string $search): void {
                    $needle = trim($search);

                    $query->where(function ($q) use ($needle): void {
                        $q->where('refunds.gateway_refund_id', 'ilike', "%{$needle}%")
                            ->orWhere('refunds.reason', 'ilike', "%{$needle}%")
                            ->orWhere('payments.gateway_transaction_id', 'ilike', "%{$needle}%")
                            ->orWhere('payments.gateway', 'ilike', "%{$needle}%")
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
                fn ($q) => $q->where('refunds.status', request('status'))
            )
            ->when(
                request()->filled('gateway'),
                fn ($q) => $q->where('payments.gateway', (string) request('gateway'))
            )
            ->when(
                in_array($sortBy, ['gateway', 'status', 'amount', 'created_at', 'processed_at', 'reviewed_at'], true),
                function ($q) use ($sortBy, $sortDir): void {
                    if ($sortBy === 'gateway') {
                        $q->orderBy('payments.gateway', $sortDir);

                        return;
                    }
                    $q->orderBy('refunds.'.$sortBy, $sortDir);
                },
                fn ($q) => $q->orderByDesc('refunds.created_at')
            )
            ->paginate((int) request('per_page', 25))
            ->withQueryString()
            ->through(fn (Refund $refund) => [
                'id' => $refund->id,
                'reason' => $refund->reason,
                'amount' => (string) $refund->amount,
                'status' => $refund->status,
                'admin_notes' => $refund->admin_notes,
                'gateway_refund_id' => $refund->gateway_refund_id,
                'reviewed_at' => $refund->reviewed_at?->toIso8601String(),
                'processed_at' => $refund->processed_at?->toIso8601String(),
                'created_at' => $refund->created_at?->toIso8601String(),
                'payment' => $refund->payment ? [
                    'id' => $refund->payment->id,
                    'gateway' => $refund->payment->gateway,
                    'gateway_transaction_id' => $refund->payment->gateway_transaction_id,
                    'currency' => $refund->payment->currency,
                ] : null,
                'order' => $refund->order ? [
                    'id' => $refund->order->id,
                    'order_number' => $refund->order->order_number,
                    'items_count' => $refund->order->items->count(),
                    'item_titles' => $refund->order->items
                        ->pluck('title')
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                ] : null,
                'user' => $refund->user ? [
                    'id' => $refund->user->id,
                    'first_name' => $refund->user->first_name,
                    'last_name' => $refund->user->last_name,
                    'email' => $refund->user->email,
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

        return Inertia::render('admin/refunds/index', [
            'refunds' => $refunds,
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
