<?php

namespace App\Services;

use App\Mail\UserNotificationMail;
use App\Models\Notification;
use App\Models\NotificationDelivery;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class NotificationDispatcher
{
    /**
     * @param  array{
     *   title:string,
     *   body:string,
     *   data?:array<string,mixed>,
     *   action_url?:string|null,
     *   action_text?:string|null,
     *   category?:string|null,
     *   priority?:string|null,
     *   entity_type?:string|null,
     *   entity_id?:string|null,
     *   subject?:string|null
     * }  $payload
     */
    public function dispatchToUser(User $user, string $notificationType, array $payload): ?Notification
    {
        $preference = NotificationPreference::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'notification_type' => $notificationType,
            ],
            [
                'email_enabled' => true,
                'push_enabled' => true,
                'in_app_enabled' => true,
                'frequency' => 'instant',
            ],
        );

        if (! $preference->in_app_enabled && ! $preference->email_enabled && ! $preference->push_enabled) {
            return null;
        }

        $notification = Notification::query()->create([
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'type' => 'App\\Notifications\\SystemNotification',
            'notification_type' => $notificationType,
            'title' => (string) $payload['title'],
            'body' => (string) $payload['body'],
            'data' => $payload['data'] ?? [],
            'category' => $payload['category'] ?? 'system',
            'priority' => $payload['priority'] ?? 'normal',
            'action_url' => $payload['action_url'] ?? null,
            'action_text' => $payload['action_text'] ?? null,
            'entity_type' => $payload['entity_type'] ?? null,
            'entity_id' => $payload['entity_id'] ?? null,
            'channel' => $preference->in_app_enabled ? 'database' : 'mail',
            'read_at' => null,
            'archived_at' => null,
            'expires_at' => null,
        ]);

        if ($preference->email_enabled && $user->email) {
            $this->sendEmailDelivery($notification, $user, $payload);
        }

        return $notification;
    }

    /**
     * @param  array{
     *   title:string,
     *   body:string,
     *   action_url?:string|null,
     *   action_text?:string|null,
     *   subject?:string|null
     * }  $payload
     */
    private function sendEmailDelivery(Notification $notification, User $user, array $payload): void
    {
        $delivery = NotificationDelivery::query()->create([
            'notification_id' => $notification->id,
            'user_id' => $user->id,
            'channel' => 'mail',
            'status' => 'queued',
            'recipient' => $user->email,
            'subject_snapshot' => $payload['subject'] ?? $payload['title'],
            'provider' => config('mail.default'),
            'provider_message_id' => null,
            'error_message' => null,
            'sent_at' => null,
            'delivered_at' => null,
        ]);

        try {
            Mail::to($user->email)->send(new UserNotificationMail(
                subjectLine: (string) ($payload['subject'] ?? $payload['title']),
                title: (string) $payload['title'],
                body: (string) $payload['body'],
                actionUrl: $payload['action_url'] ?? null,
                actionText: $payload['action_text'] ?? null,
            ));

            $delivery->forceFill([
                'status' => 'sent',
                'sent_at' => now(),
            ])->save();
        } catch (\Throwable $e) {
            $delivery->forceFill([
                'status' => 'failed',
                'error_message' => mb_substr($e->getMessage(), 0, 1000),
            ])->save();
        }
    }
}
