<?php

namespace App\Support;

use App\Models\Order;
use Illuminate\Support\Str;

final class OrderNumberAllocator
{
    public static function allocate(): string
    {
        for ($i = 0; $i < 12; $i++) {
            $candidate = sprintf(
                'ORD-%s-%s',
                now()->format('Y'),
                strtoupper(substr(str_replace('-', '', (string) Str::uuid()), 0, 8))
            );

            if (! Order::query()->where('order_number', $candidate)->exists()) {
                return $candidate;
            }
        }

        return 'ORD-'.now()->format('Y').'-'.strtoupper(Str::random(12));
    }
}
