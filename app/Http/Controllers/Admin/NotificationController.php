<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'tab' => ['nullable', 'in:all,unread,archived'],
            'category' => ['nullable', 'in:all,commerce,learning,community,system'],
            'per_page' => ['nullable', 'integer'],
        ]);

        $search = trim((string) ($filters['search'] ?? ''));
        $tab = $filters['tab'] ?? 'all';
        $category = $filters['category'] ?? 'all';
        $allowedPerPage = [25, 50, 75, 100];
        $perPage = (int) ($filters['per_page'] ?? 25);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 25;
        }

        $notifications = $user->appNotifications()
            ->when(
                $search !== '',
                function ($q) use ($search): void {
                    $q->where(function ($inner) use ($search): void {
                        $inner->where('title', 'ilike', "%{$search}%")
                            ->orWhere('body', 'ilike', "%{$search}%")
                            ->orWhere('notification_type', 'ilike', "%{$search}%");
                    });
                }
            )
            ->when($tab === 'unread', fn ($q) => $q->whereNull('read_at')->whereNull('archived_at'))
            ->when($tab === 'archived', fn ($q) => $q->whereNotNull('archived_at'))
            ->when($tab === 'all', fn ($q) => $q->whereNull('archived_at'))
            ->when($category !== 'all', fn ($q) => $q->where('category', $category))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Notification $notification) => $this->mapNotification($notification));

        $preferencesByType = $user->notificationPreferences()
            ->get()
            ->keyBy('notification_type');

        $preferences = collect($this->notificationTypeCatalog())
            ->map(function (array $meta, string $type) use ($preferencesByType): array {
                $pref = $preferencesByType->get($type);

                return [
                    'notification_type' => $type,
                    'label' => $meta['label'],
                    'description' => $meta['description'],
                    'email_enabled' => (bool) ($pref?->email_enabled ?? true),
                    'push_enabled' => (bool) ($pref?->push_enabled ?? true),
                    'in_app_enabled' => (bool) ($pref?->in_app_enabled ?? true),
                    'frequency' => (string) ($pref?->frequency ?? 'instant'),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'filters' => [
                'search' => $search,
                'tab' => $tab,
                'category' => $category,
                'per_page' => $perPage,
            ],
            'categories' => ['all', 'commerce', 'learning', 'community', 'system'],
            'preferences' => $preferences,
            'can' => [
                'edit' => $user->can('notificaciones.edit'),
            ],
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var Notification $record */
        $record = $user->appNotifications()->whereKey($notification)->firstOrFail();
        if (! $record->read_at) {
            $record->forceFill(['read_at' => now()])->save();
        }

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $updated = $user->appNotifications()
            ->whereNull('archived_at')
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(['ok' => true, 'updated' => $updated]);
    }

    public function archive(Request $request, string $notification): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var Notification $record */
        $record = $user->appNotifications()->whereKey($notification)->firstOrFail();
        $record->forceFill([
            'archived_at' => now(),
            'read_at' => $record->read_at ?? now(),
        ])->save();

        return response()->json(['ok' => true]);
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $this->authorize('notificaciones.edit');

        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'preferences' => ['required', 'array', 'min:1'],
            'preferences.*.notification_type' => ['required', 'string', 'max:100'],
            'preferences.*.email_enabled' => ['required', 'boolean'],
            'preferences.*.push_enabled' => ['required', 'boolean'],
            'preferences.*.in_app_enabled' => ['required', 'boolean'],
            'preferences.*.frequency' => ['required', 'in:instant,daily_digest,weekly_digest'],
        ]);

        foreach ($validated['preferences'] as $row) {
            NotificationPreference::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_type' => $row['notification_type'],
                ],
                [
                    'email_enabled' => (bool) $row['email_enabled'],
                    'push_enabled' => (bool) $row['push_enabled'],
                    'in_app_enabled' => (bool) $row['in_app_enabled'],
                    'frequency' => (string) $row['frequency'],
                ],
            );
        }

        return back()->with('success', 'Preferencias de notificación actualizadas.');
    }

    private function mapNotification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'notification_type' => $notification->notification_type,
            'title' => $notification->title,
            'body' => $notification->body,
            'category' => $notification->category,
            'priority' => $notification->priority,
            'action_url' => $notification->action_url,
            'action_text' => $notification->action_text,
            'data' => $notification->data,
            'read_at' => $notification->read_at?->toIso8601String(),
            'archived_at' => $notification->archived_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, array{label:string, description:string}>
     */
    private function notificationTypeCatalog(): array
    {
        return [
            'payment.completed' => [
                'label' => 'Pago completado',
                'description' => 'Confirmación de cobros y acceso a cursos.',
            ],
            'refund.processed' => [
                'label' => 'Reembolso procesado',
                'description' => 'Cambios en devoluciones y estado de pago.',
            ],
            'instructor_payout.paid' => [
                'label' => 'Liquidación pagada',
                'description' => 'Avisos de pagos salientes al instructor.',
            ],
            'learning.course.update' => [
                'label' => 'Actualizaciones del curso',
                'description' => 'Nuevas lecciones, recursos y cambios relevantes.',
            ],
            'learning.quiz.graded' => [
                'label' => 'Cuestionario calificado',
                'description' => 'Resultados y retroalimentación de evaluaciones.',
            ],
            'community.reply' => [
                'label' => 'Respuestas y comunidad',
                'description' => 'Respuestas en foros o hilos seguidos.',
            ],
            'system.announcement' => [
                'label' => 'Avisos del sistema',
                'description' => 'Comunicados operativos y mantenimiento.',
            ],
            'admin.order.created' => [
                'label' => 'Nueva orden (admin)',
                'description' => 'Avisos cuando un cliente completa una compra o matrícula gratuita.',
            ],
        ];
    }
}
