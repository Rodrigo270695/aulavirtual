<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;

/**
 * Dispara notificación in-app + correo (según preferencias) al comprador y avisa a superadmins.
 */
final class OrderPurchasedNotifier
{
    public function __construct(
        private readonly NotificationDispatcher $dispatcher,
    ) {}

    public function notify(User $buyer, Order $order, bool $freeCheckout): void
    {
        $order->loadMissing('items');

        $titles = $order->items
            ->where('item_type', 'course')
            ->pluck('title')
            ->filter()
            ->values()
            ->all();

        $summary = $titles === []
            ? 'Cursos'
            : (count($titles) === 1 ? (string) $titles[0] : count($titles).' cursos');

        $orderLabel = (string) $order->order_number;

        $buyerActionUrl = $buyer->can('ordenes.view')
            ? route('admin.orders.index', ['search' => $orderLabel])
            : route('learning.index');

        $buyerActionText = $buyer->can('ordenes.view') ? 'Ver en administración' : 'Ir a mis cursos';

        if ($freeCheckout) {
            $this->dispatcher->dispatchToUser($buyer, 'payment.completed', [
                'title' => 'Matrícula en curso gratuito',
                'body' => "Tu orden {$orderLabel} quedó registrada (importe 0). Ya tienes acceso: {$summary}.",
                'subject' => "[{$orderLabel}] Matrícula gratuita confirmada",
                'category' => 'commerce',
                'priority' => 'normal',
                'action_url' => $buyerActionUrl,
                'action_text' => $buyerActionText,
                'entity_type' => 'order',
                'entity_id' => (string) $order->id,
                'data' => [
                    'order_number' => $orderLabel,
                    'free' => true,
                ],
            ]);
        } else {
            $currency = strtoupper((string) $order->currency);
            $total = (string) $order->total;

            $this->dispatcher->dispatchToUser($buyer, 'payment.completed', [
                'title' => 'Pago completado',
                'body' => "Tu orden {$orderLabel} fue pagada ({$currency} {$total}). Ya tienes acceso: {$summary}.",
                'subject' => "[{$orderLabel}] Pago confirmado",
                'category' => 'commerce',
                'priority' => 'normal',
                'action_url' => $buyerActionUrl,
                'action_text' => $buyerActionText,
                'entity_type' => 'order',
                'entity_id' => (string) $order->id,
                'data' => [
                    'order_number' => $orderLabel,
                    'free' => false,
                    'total' => $total,
                    'currency' => $currency,
                ],
            ]);
        }

        $this->notifySuperAdminsNewOrder($buyer, $order, $freeCheckout, $summary);
    }

    private function notifySuperAdminsNewOrder(User $buyer, Order $order, bool $freeCheckout, string $summary): void
    {
        $orderLabel = (string) $order->order_number;
        $buyerName = trim("{$buyer->first_name} {$buyer->last_name}");
        $buyerEmail = (string) $buyer->email;

        $adminOrdersUrl = route('admin.orders.index', ['search' => $orderLabel]);

        if ($freeCheckout) {
            $title = 'Nueva matrícula gratuita';
            $body = "{$buyerName} ({$buyerEmail}) se matriculó sin cargo. Orden {$orderLabel}. Contenido: {$summary}.";
            $subject = "[Admin] {$orderLabel} · Matrícula gratuita";
        } else {
            $currency = strtoupper((string) $order->currency);
            $total = (string) $order->total;
            $title = 'Nueva venta registrada';
            $body = "{$buyerName} ({$buyerEmail}) completó un pago. Orden {$orderLabel} ({$currency} {$total}). Contenido: {$summary}.";
            $subject = "[Admin] {$orderLabel} · Pago recibido";
        }

        foreach (User::role('superadmin')->whereKeyNot($buyer->id)->cursor() as $admin) {
            $this->dispatcher->dispatchToUser($admin, 'admin.order.created', [
                'title' => $title,
                'body' => $body,
                'subject' => $subject,
                'category' => 'commerce',
                'priority' => 'normal',
                'action_url' => $admin->can('ordenes.view') ? $adminOrdersUrl : null,
                'action_text' => $admin->can('ordenes.view') ? 'Ver orden en administración' : null,
                'entity_type' => 'order',
                'entity_id' => (string) $order->id,
                'data' => [
                    'order_number' => $orderLabel,
                    'buyer_id' => (string) $buyer->id,
                    'free' => $freeCheckout,
                ],
            ]);
        }
    }
}
