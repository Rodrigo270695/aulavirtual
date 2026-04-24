<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InstructorPayoutIndexRequest;
use App\Http\Requests\Admin\InstructorPayoutRequest;
use App\Http\Requests\Admin\InstructorPayoutSummaryRequest;
use App\Models\Instructor;
use App\Models\InstructorPayout;
use App\Models\OrderItem;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InstructorPayoutController extends Controller
{
    public function index(InstructorPayoutIndexRequest $request): Response
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();
        $filters = $request->validated();
        $sortBy = $filters['sort_by'] ?? null;
        $sortDir = ($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $payouts = InstructorPayout::query()
            ->select('instructor_payouts.*')
            ->join('instructors', 'instructors.id', '=', 'instructor_payouts.instructor_id')
            ->join('users', 'users.id', '=', 'instructors.user_id')
            ->with([
                'instructor:id,user_id,payout_method',
                'instructor.user:id,first_name,last_name,email',
            ])
            ->when(
                ! empty($filters['search']),
                function ($query) use ($filters): void {
                    $needle = (string) $filters['search'];

                    $query->where(function ($q) use ($needle): void {
                        $q->where('users.first_name', 'ilike', "%{$needle}%")
                            ->orWhere('users.last_name', 'ilike', "%{$needle}%")
                            ->orWhere('users.email', 'ilike', "%{$needle}%")
                            ->orWhere('instructor_payouts.payment_reference', 'ilike', "%{$needle}%");
                    });
                }
            )
            ->when(
                ! empty($filters['status']),
                fn ($q) => $q->where('instructor_payouts.status', (string) $filters['status'])
            )
            ->when(
                ! empty($filters['payout_method']),
                fn ($q) => $q->where('instructors.payout_method', (string) $filters['payout_method'])
            )
            ->when(
                in_array($sortBy, ['status', 'gross_sales', 'platform_fee', 'net_amount', 'period_start', 'period_end', 'paid_at', 'created_at'], true),
                fn ($q) => $q->orderBy('instructor_payouts.'.$sortBy, $sortDir),
                function ($q) use ($sortBy, $sortDir): void {
                    if ($sortBy === 'name') {
                        $q->orderBy('users.last_name', $sortDir)->orderBy('users.first_name', $sortDir);

                        return;
                    }

                    $q->orderByDesc('instructor_payouts.created_at');
                }
            )
            ->paginate((int) ($filters['per_page'] ?? 25))
            ->withQueryString()
            ->through(fn (InstructorPayout $payout) => [
                'id' => $payout->id,
                'period_start' => $payout->getRawOriginal('period_start'),
                'period_end' => $payout->getRawOriginal('period_end'),
                'gross_sales' => (string) $payout->gross_sales,
                'platform_fee' => (string) $payout->platform_fee,
                'net_amount' => (string) $payout->net_amount,
                'currency' => $payout->currency,
                'status' => $payout->status,
                'payment_reference' => $payout->payment_reference,
                'paid_at' => $payout->paid_at?->toIso8601String(),
                'created_at' => $payout->created_at?->toIso8601String(),
                'instructor' => $payout->instructor ? [
                    'id' => $payout->instructor->id,
                    'payout_method' => $payout->instructor->payout_method,
                    'user' => $payout->instructor->user ? [
                        'id' => $payout->instructor->user->id,
                        'first_name' => $payout->instructor->user->first_name,
                        'last_name' => $payout->instructor->user->last_name,
                        'email' => $payout->instructor->user->email,
                    ] : null,
                ] : null,
            ]);

        return Inertia::render('admin/instructor-payouts/index', [
            'payouts' => $payouts,
            'instructorOptions' => Instructor::query()
                ->with('user:id,first_name,last_name,email')
                ->whereHas('user')
                ->orderBy('created_at')
                ->get(['id', 'user_id'])
                ->map(function (Instructor $instructor): array {
                    $fullName = trim((string) (($instructor->user?->first_name ?? '').' '.($instructor->user?->last_name ?? '')));
                    $email = (string) ($instructor->user?->email ?? 'sin-email');

                    return [
                        'id' => $instructor->id,
                        'label' => $fullName.' ('.$email.')',
                    ];
                }),
            'filters' => [
                'search' => $filters['search'] ?? null,
                'per_page' => $filters['per_page'] ?? null,
                'sort_by' => $filters['sort_by'] ?? null,
                'sort_dir' => $filters['sort_dir'] ?? null,
                'status' => $filters['status'] ?? null,
                'payout_method' => $filters['payout_method'] ?? null,
            ],
            'can' => [
                'create' => $authUser->can('liquidaciones_instructores.create'),
                'edit' => $authUser->can('liquidaciones_instructores.edit'),
            ],
        ]);
    }

    public function store(InstructorPayoutRequest $request): RedirectResponse
    {
        $this->authorize('liquidaciones_instructores.create');

        $validated = $request->validated();
        $summary = $this->buildSalesSummary(
            (string) $validated['instructor_id'],
            (string) $validated['period_start'],
            (string) $validated['period_end'],
            (string) $validated['currency'],
        );

        $commissionPct = isset($validated['commission_pct']) ? (float) $validated['commission_pct'] : 15.0;
        $platformFee = round($summary['gross_sales'] * ($commissionPct / 100), 2);
        $netAmount = round($summary['gross_sales'] - $platformFee, 2);

        $payload = [
            'instructor_id' => $validated['instructor_id'],
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'gross_sales' => $summary['gross_sales'],
            'platform_fee' => $platformFee,
            'net_amount' => $netAmount,
            'currency' => $validated['currency'],
            'status' => $validated['status'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'paid_at' => $validated['paid_at'] ?? null,
        ];

        $payout = InstructorPayout::create($payload);
        $this->dispatchPaidPayoutNotificationIfNeeded($payout);

        return back()->with('success', "Liquidación «{$payout->id}» creada exitosamente.");
    }

    public function update(InstructorPayoutRequest $request, InstructorPayout $instructorPayout): RedirectResponse
    {
        $this->authorize('liquidaciones_instructores.edit');

        if ($instructorPayout->status === 'paid') {
            return back()->with('error', 'La liquidación ya pagada no se puede editar.');
        }

        $wasPaid = $instructorPayout->status === 'paid';
        $validated = $request->validated();
        $summary = $this->buildSalesSummary(
            (string) $validated['instructor_id'],
            (string) $validated['period_start'],
            (string) $validated['period_end'],
            (string) $validated['currency'],
        );

        $commissionPct = isset($validated['commission_pct']) ? (float) $validated['commission_pct'] : 15.0;
        $platformFee = round($summary['gross_sales'] * ($commissionPct / 100), 2);
        $netAmount = round($summary['gross_sales'] - $platformFee, 2);

        $payload = [
            'instructor_id' => $validated['instructor_id'],
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'gross_sales' => $summary['gross_sales'],
            'platform_fee' => $platformFee,
            'net_amount' => $netAmount,
            'currency' => $validated['currency'],
            'status' => $validated['status'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'paid_at' => $validated['paid_at'] ?? null,
        ];

        $instructorPayout->update($payload);
        if (! $wasPaid) {
            $this->dispatchPaidPayoutNotificationIfNeeded($instructorPayout->fresh());
        }

        return back()->with('success', 'Liquidación actualizada exitosamente.');
    }

    public function summary(InstructorPayoutSummaryRequest $request): JsonResponse
    {
        $this->authorize('liquidaciones_instructores.view');

        $validated = $request->validated();
        $summary = $this->buildSalesSummary(
            (string) $validated['instructor_id'],
            (string) $validated['period_start'],
            (string) $validated['period_end'],
            (string) $validated['currency'],
        );

        return response()->json([
            'gross_sales' => number_format($summary['gross_sales'], 2, '.', ''),
            'courses_sold' => $summary['courses_sold'],
            'orders_count' => $summary['orders_count'],
        ]);
    }

    /**
     * @return array{gross_sales: float, courses_sold: int, orders_count: int}
     */
    private function buildSalesSummary(string $instructorId, string $periodStart, string $periodEnd, string $currency): array
    {
        $stats = OrderItem::query()
            ->selectRaw('COALESCE(SUM(order_items.final_price), 0) AS gross_sales')
            ->selectRaw('COUNT(*) AS courses_sold')
            ->selectRaw('COUNT(DISTINCT order_items.order_id) AS orders_count')
            ->where('order_items.instructor_id', $instructorId)
            ->where('order_items.item_type', 'course')
            ->whereExists(function ($query) use ($periodStart, $periodEnd, $currency): void {
                $query->selectRaw('1')
                    ->from('payments')
                    ->whereColumn('payments.order_id', 'order_items.order_id')
                    ->where('payments.status', 'completed')
                    ->where('payments.currency', $currency)
                    ->whereRaw('COALESCE(payments.processed_at, payments.created_at)::date >= ?', [$periodStart])
                    ->whereRaw('COALESCE(payments.processed_at, payments.created_at)::date <= ?', [$periodEnd]);
            })
            ->first();

        return [
            'gross_sales' => (float) ($stats?->gross_sales ?? 0),
            'courses_sold' => (int) ($stats?->courses_sold ?? 0),
            'orders_count' => (int) ($stats?->orders_count ?? 0),
        ];
    }

    private function dispatchPaidPayoutNotificationIfNeeded(?InstructorPayout $payout): void
    {
        if (! $payout || $payout->status !== 'paid') {
            return;
        }

        $payout->loadMissing('instructor.user');
        $user = $payout->instructor?->user;
        if (! $user) {
            return;
        }

        app(NotificationDispatcher::class)->dispatchToUser(
            user: $user,
            notificationType: 'instructor_payout.paid',
            payload: [
                'title' => 'Tu liquidación fue pagada',
                'body' => "Se pagó tu liquidación del período {$payout->period_start} al {$payout->period_end} por {$payout->currency} {$payout->net_amount}.",
                'subject' => 'Liquidación pagada',
                'category' => 'commerce',
                'priority' => 'normal',
                'action_url' => route('admin.notifications.index'),
                'action_text' => 'Ver notificaciones',
                'entity_type' => 'instructor_payout',
                'entity_id' => $payout->id,
                'data' => [
                    'payout_id' => $payout->id,
                    'currency' => $payout->currency,
                    'net_amount' => (string) $payout->net_amount,
                    'period_start' => $payout->getRawOriginal('period_start'),
                    'period_end' => $payout->getRawOriginal('period_end'),
                ],
            ],
        );
    }
}
