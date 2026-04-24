<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationCenterController extends Controller
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

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'filters' => [
                'search' => $search,
                'tab' => $tab,
                'category' => $category,
                'per_page' => $perPage,
            ],
            'categories' => ['all', 'commerce', 'learning', 'community', 'system'],
        ]);
    }

    public function feed(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $recent = $user->appNotifications()
            ->whereNull('archived_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Notification $notification) => $this->mapNotification($notification))
            ->values()
            ->all();

        $unreadCount = $user->appNotifications()
            ->whereNull('read_at')
            ->whereNull('archived_at')
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
            'recent' => $recent,
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
}
