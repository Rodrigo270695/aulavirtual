<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Course;
use App\Models\CourseReview;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $now = CarbonImmutable::now();
        $startMonth = $now->startOfMonth();
        $prevStartMonth = $startMonth->subMonth();
        $prevEndMonth = $startMonth->subSecond();

        $usersTotal = User::query()->count();
        $usersThisMonth = User::query()->whereBetween('created_at', [$startMonth, $now])->count();
        $usersPrevMonth = User::query()->whereBetween('created_at', [$prevStartMonth, $prevEndMonth])->count();

        $publishedCourses = Course::query()->where('status', 'published')->count();
        $newCoursesThisMonth = Course::query()->whereBetween('created_at', [$startMonth, $now])->count();
        $newCoursesPrevMonth = Course::query()->whereBetween('created_at', [$prevStartMonth, $prevEndMonth])->count();

        $enrollmentsTotal = Enrollment::query()->count();
        $enrollmentsThisMonth = Enrollment::query()->whereBetween('enrolled_at', [$startMonth, $now])->count();
        $enrollmentsPrevMonth = Enrollment::query()->whereBetween('enrolled_at', [$prevStartMonth, $prevEndMonth])->count();

        $paidStatuses = ['paid', 'completed', 'approved', 'succeeded', 'success'];
        $revenueThisMonth = (float) Payment::query()
            ->whereIn('status', $paidStatuses)
            ->whereBetween('processed_at', [$startMonth, $now])
            ->sum('amount');
        $revenuePrevMonth = (float) Payment::query()
            ->whereIn('status', $paidStatuses)
            ->whereBetween('processed_at', [$prevStartMonth, $prevEndMonth])
            ->sum('amount');

        $cards = [
            [
                'key' => 'users_total',
                'label' => 'Total usuarios',
                'value' => $usersTotal,
                'change_pct' => $this->pct($usersThisMonth, $usersPrevMonth),
                'context' => 'nuevos vs mes anterior',
                'tone' => 'blue',
            ],
            [
                'key' => 'courses_published',
                'label' => 'Cursos publicados',
                'value' => $publishedCourses,
                'change_pct' => $this->pct($newCoursesThisMonth, $newCoursesPrevMonth),
                'context' => 'nuevos vs mes anterior',
                'tone' => 'cyan',
            ],
            [
                'key' => 'enrollments_total',
                'label' => 'Matrículas',
                'value' => $enrollmentsTotal,
                'change_pct' => $this->pct($enrollmentsThisMonth, $enrollmentsPrevMonth),
                'context' => 'nuevas vs mes anterior',
                'tone' => 'violet',
            ],
            [
                'key' => 'revenue_month',
                'label' => 'Ingresos del mes',
                'value' => round($revenueThisMonth, 2),
                'change_pct' => $this->pct($revenueThisMonth, $revenuePrevMonth),
                'context' => 'vs mes anterior',
                'tone' => 'emerald',
            ],
        ];

        $trend = $this->buildMonthlyTrend($now, $paidStatuses);
        $courseStatus = $this->buildCourseStatus();
        $topCourses = $this->buildTopCourses();
        $activity = $this->buildRecentActivity();
        $highlights = $this->buildHighlights($now, $paidStatuses);
        $breakdowns = $this->buildBreakdowns($now);

        return Inertia::render('dashboard', [
            'stats' => $cards,
            'highlights' => $highlights,
            'breakdowns' => $breakdowns,
            'charts' => [
                'trend' => $trend,
                'course_status' => $courseStatus,
            ],
            'top_courses' => $topCourses,
            'recent_activity' => $activity,
        ]);
    }

    private function pct(float|int $current, float|int $previous): float
    {
        if ((float) $previous === 0.0) {
            return (float) $current > 0 ? 100.0 : 0.0;
        }

        return round((((float) $current - (float) $previous) / (float) $previous) * 100, 1);
    }

    /**
     * @param  array<int, string>  $paidStatuses
     * @return array<int, array<string, mixed>>
     */
    private function buildMonthlyTrend(CarbonImmutable $now, array $paidStatuses): array
    {
        $months = collect(range(5, 0, -1))
            ->map(fn (int $offset) => $now->subMonths($offset)->startOfMonth());

        return $months
            ->map(function (CarbonImmutable $monthStart) use ($paidStatuses): array {
                $monthEnd = $monthStart->endOfMonth();
                $enrollments = Enrollment::query()
                    ->whereBetween('enrolled_at', [$monthStart, $monthEnd])
                    ->count();
                $revenue = (float) Payment::query()
                    ->whereIn('status', $paidStatuses)
                    ->whereBetween('processed_at', [$monthStart, $monthEnd])
                    ->sum('amount');

                return [
                    'month' => $monthStart->locale('es')->translatedFormat('M'),
                    'month_full' => $monthStart->locale('es')->translatedFormat('F Y'),
                    'enrollments' => $enrollments,
                    'revenue' => round($revenue, 2),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildCourseStatus(): array
    {
        return Course::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'status' => (string) $row->status,
                'label' => $this->courseStatusLabel((string) $row->status),
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildTopCourses(): array
    {
        return Course::query()
            ->whereNull('deleted_at')
            ->orderByDesc('total_enrolled')
            ->limit(6)
            ->get([
                'id',
                'title',
                'status',
                'total_enrolled',
                'avg_rating',
                'total_reviews',
                'price',
                'discount_price',
                'currency',
            ])
            ->map(function (Course $course): array {
                $unitPrice = (float) ($course->discount_price ?? $course->price ?? 0);
                $estimatedRevenue = $unitPrice * (int) ($course->total_enrolled ?? 0);

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status,
                    'status_label' => $this->courseStatusLabel((string) $course->status),
                    'students' => (int) ($course->total_enrolled ?? 0),
                    'rating' => (float) ($course->avg_rating ?? 0),
                    'reviews' => (int) ($course->total_reviews ?? 0),
                    'estimated_revenue' => round($estimatedRevenue, 2),
                    'currency' => $course->currency ?? 'USD',
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRecentActivity(): array
    {
        return ActivityLog::query()
            ->with(['user:id,first_name,last_name,email'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(function (ActivityLog $log): array {
                $user = $log->user;
                $name = $user ? trim("{$user->first_name} {$user->last_name}") : null;
                $display = $name !== '' && $name !== null ? $name : ($user?->email ?? 'Sistema');

                return [
                    'id' => $log->id,
                    'actor' => $display,
                    'actor_initials' => $this->initials($display),
                    'action' => $log->action,
                    'action_label' => $this->activityActionLabel((string) $log->action),
                    'subject' => $this->shortClass($log->subject_type),
                    'subject_id' => $log->subject_id,
                    'created_at' => $log->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $paidStatuses
     * @return array<int, array<string, mixed>>
     */
    private function buildHighlights(CarbonImmutable $now, array $paidStatuses): array
    {
        $startMonth = $now->startOfMonth();
        $activeEnrollments = Enrollment::query()->where('status', 'active')->count();
        $avgProgress = (float) Enrollment::query()->avg('progress_pct');

        $ordersMonth = Order::query()->whereBetween('created_at', [$startMonth, $now])->count();
        $paidPaymentsMonth = Payment::query()
            ->whereIn('status', $paidStatuses)
            ->whereBetween('created_at', [$startMonth, $now])
            ->count();
        $failedPaymentsMonth = Payment::query()
            ->whereIn('status', ['failed', 'declined', 'error', 'cancelled'])
            ->whereBetween('created_at', [$startMonth, $now])
            ->count();
        $refundsMonth = Refund::query()->whereBetween('created_at', [$startMonth, $now])->count();
        $reviewsTotal = CourseReview::query()->count();
        $activity24h = ActivityLog::query()
            ->where('created_at', '>=', $now->subDay())
            ->count();

        return [
            [
                'key' => 'active_enrollments',
                'label' => 'Matrículas activas',
                'value' => $activeEnrollments,
                'hint' => 'Estado activo actualmente',
                'tone' => 'blue',
            ],
            [
                'key' => 'avg_progress',
                'label' => 'Progreso promedio',
                'value' => round($avgProgress, 1).'%',
                'hint' => 'Sobre todas las matrículas',
                'tone' => 'violet',
            ],
            [
                'key' => 'orders_month',
                'label' => 'Órdenes del mes',
                'value' => $ordersMonth,
                'hint' => 'Generadas en el mes actual',
                'tone' => 'cyan',
            ],
            [
                'key' => 'payments_success',
                'label' => 'Pagos exitosos',
                'value' => $paidPaymentsMonth,
                'hint' => "Fallidos en el mes: {$failedPaymentsMonth}",
                'tone' => 'emerald',
            ],
            [
                'key' => 'refunds_month',
                'label' => 'Reembolsos del mes',
                'value' => $refundsMonth,
                'hint' => 'Solicitudes registradas',
                'tone' => 'violet',
            ],
            [
                'key' => 'reviews_total',
                'label' => 'Reseñas de cursos',
                'value' => $reviewsTotal,
                'hint' => "Actividad últimas 24h: {$activity24h}",
                'tone' => 'blue',
            ],
        ];
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function buildBreakdowns(CarbonImmutable $now): array
    {
        $startMonth = $now->startOfMonth();

        $enrollmentStatusRaw = Enrollment::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'key' => (string) $row->status,
                'label' => $this->enrollmentStatusLabel((string) $row->status),
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $paymentStatusRaw = Payment::query()
            ->whereBetween('created_at', [$startMonth, $now])
            ->selectRaw('status, count(*) as total, coalesce(sum(amount), 0) as amount_total')
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'key' => (string) $row->status,
                'label' => $this->paymentStatusLabel((string) $row->status),
                'total' => (int) $row->total,
                'amount_total' => round((float) $row->amount_total, 2),
            ])
            ->values()
            ->all();

        $courseLevelRaw = Course::query()
            ->selectRaw('level, count(*) as total')
            ->groupBy('level')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'key' => (string) $row->level,
                'label' => $this->courseLevelLabel((string) $row->level),
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        return [
            'enrollment_status' => $this->addPercentages($enrollmentStatusRaw),
            'payment_status_month' => $this->addPercentages($paymentStatusRaw),
            'course_levels' => $this->addPercentages($courseLevelRaw),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function addPercentages(array $items): array
    {
        $sum = collect($items)->sum(fn (array $row) => (int) ($row['total'] ?? 0));
        if ($sum <= 0) {
            return collect($items)
                ->map(fn (array $row) => [...$row, 'pct' => 0.0])
                ->values()
                ->all();
        }

        return collect($items)
            ->map(fn (array $row) => [
                ...$row,
                'pct' => round((((int) ($row['total'] ?? 0)) / $sum) * 100, 1),
            ])
            ->values()
            ->all();
    }

    private function enrollmentStatusLabel(string $status): string
    {
        return match ($status) {
            'active' => 'Activa',
            'completed' => 'Completada',
            'expired' => 'Expirada',
            'cancelled' => 'Cancelada',
            default => $status,
        };
    }

    private function paymentStatusLabel(string $status): string
    {
        return match ($status) {
            'paid', 'completed', 'approved', 'succeeded', 'success' => 'Exitoso',
            'failed', 'declined', 'error' => 'Fallido',
            'pending' => 'Pendiente',
            'cancelled' => 'Cancelado',
            default => $status,
        };
    }

    private function courseLevelLabel(string $level): string
    {
        return match ($level) {
            'beginner' => 'Principiante',
            'intermediate' => 'Intermedio',
            'advanced' => 'Avanzado',
            'all_levels' => 'Todos los niveles',
            default => $level,
        };
    }

    private function courseStatusLabel(string $status): string
    {
        return match ($status) {
            'published' => 'Publicado',
            'draft' => 'Borrador',
            'under_review' => 'En revisión',
            'unpublished' => 'Oculto',
            'archived' => 'Archivado',
            default => $status,
        };
    }

    private function activityActionLabel(string $action): string
    {
        return match ($action) {
            'auth.login' => 'Inicio de sesión',
            'auth.logout' => 'Cierre de sesión',
            'auth.login_failed' => 'Intento fallido',
            default => str_replace('_', ' ', $action),
        };
    }

    private function shortClass(?string $fqcn): ?string
    {
        if ($fqcn === null || $fqcn === '') {
            return null;
        }

        $parts = explode('\\', $fqcn);

        return end($parts) ?: $fqcn;
    }

    private function initials(string $name): string
    {
        $parts = collect(explode(' ', trim($name)))
            ->filter()
            ->take(2);

        if ($parts->isEmpty()) {
            return 'SY';
        }

        return $parts
            ->map(fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');
    }
}
